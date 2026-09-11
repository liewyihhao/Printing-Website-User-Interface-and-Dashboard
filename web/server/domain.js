/*
 * Printoka operations domain — the unified job/quote state machine, hard gates,
 * RBAC, priority function and audit contract from the two operations guidebooks.
 * Pure logic, no I/O. Consumed by server.js.
 *
 * Guidebook anchors:
 *   Prod §1.7 non-negotiables (system entry, payment validated, artwork==order, traceable)
 *   Prod §1.8 workflow (Prepress → Scheduler → Logistics)  ·  Prepress §2.5 status classes
 *   Scheduler §3.4 priority (deadline, then payment-confirmation time)
 *   Outlet §4 intake  ·  Prod §1.4/§1.5 roles & strict reporting
 */

// ---- roles ----------------------------------------------------------------
const ROLES = {
  // outlet
  cs_walkin: { label: 'Customer Service (Walk-in)', dept: 'outlet', tier: 'staff' },
  print_consultant: { label: 'Printing Consultant (B2B)', dept: 'outlet', tier: 'staff' },
  store_manager: { label: 'Store / Assistant Manager', dept: 'outlet', tier: 'manager' },
  // production departments
  prepress_staff: { label: 'Prepress Staff', dept: 'prepress', tier: 'staff' },
  prepress_manager: { label: 'Prepress Manager', dept: 'prepress', tier: 'manager' },
  scheduler_staff: { label: 'Scheduler Staff', dept: 'scheduler', tier: 'staff' },
  scheduler_manager: { label: 'Scheduler Manager', dept: 'scheduler', tier: 'manager' },
  logistics_staff: { label: 'Logistics Staff', dept: 'logistics', tier: 'staff' },
  logistics_manager: { label: 'Logistics Manager', dept: 'logistics', tier: 'manager' },
  production_director: { label: 'Production Director', dept: 'all', tier: 'director' },
  // external
  printer: { label: 'Outsource Printer', dept: 'vendor', tier: 'staff' },
  hub: { label: 'Hub (consolidation)', dept: 'hub', tier: 'staff' },
};

// ---- job statuses ---------------------------------------------------------
// Each status belongs to a department "queue" (drives GET /queues/:dept).
const STATUS = {
  intake: { label: 'Intake — acknowledge', queue: 'outlet' },
  prepress: { label: 'Prepress — file check', queue: 'prepress' },
  prepress_issue: { label: 'Prepress — issue / fixing', queue: 'prepress' },
  scheduling: { label: 'Scheduler — queue & allocate', queue: 'scheduler' },
  printing: { label: 'Printing (in-house)', queue: 'scheduler' },
  outsourcing: { label: 'Outsourced — awarded to printer', queue: 'scheduler' },
  logistics: { label: 'Logistics — pack & dispatch', queue: 'logistics' },
  dispatched: { label: 'Dispatched — in transit', queue: 'logistics' },
  completed: { label: 'Completed / delivered', queue: 'done' },
  rejected: { label: 'Rejected to outlet', queue: 'done' },
  escalated: { label: 'Escalated to manager', queue: 'prepress' },
};

// ---- gates (server-side, non-negotiable) ----------------------------------
// Return null if the gate passes, or a human-readable reason if it blocks.
const GATES = {
  payment: job => (job.paymentValidated || job.creditTerms)
    ? null : 'No production without payment confirmation (bank transfer must be validated), unless on credit terms.',
  artworkMatch: job => (job.artworkMatches || job.customerAuthorizedMismatch)
    ? null : 'Order details do not match the artwork requirement — needs customer authorization to proceed.',
  artworkPresent: job => job.artwork && job.artwork.file
    ? null : 'No artwork file attached to this job.',
};

// ---- transition table -----------------------------------------------------
// from -> [{ action, to, roles:[...], gates:[...], requires:[fields], note }]
// production_director may perform any transition (override authority, Prod §1.4).
const TRANSITIONS = {
  intake: [
    { action: 'acknowledge', to: 'prepress', roles: ['cs_walkin', 'print_consultant', 'store_manager'],
      gates: ['payment'], note: 'Acknowledge within 5 min and release to prepress (Outlet §4.2).' },
  ],
  prepress: [
    { action: 'approve', to: 'scheduling', roles: ['prepress_staff', 'prepress_manager'],
      gates: ['artworkPresent', 'artworkMatch'], note: 'PASS → release to scheduler (Prepress §2.5).' },
    { action: 'flag_minor', to: 'prepress_issue', roles: ['prepress_staff', 'prepress_manager'],
      note: 'MINOR ISSUE → fix internally & seek approval (Prepress §2.5).' },
    { action: 'reject_major', to: 'rejected', roles: ['prepress_staff', 'prepress_manager'],
      requires: ['reason', 'proof'], note: 'MAJOR ISSUE → reject to outlet with issue + visual proof (Prepress §2.7).' },
    { action: 'escalate', to: 'escalated', roles: ['prepress_staff'],
      requires: ['reason'], note: 'CRITICAL → escalate to manager (Prepress §2.5).' },
  ],
  prepress_issue: [
    { action: 'approve', to: 'scheduling', roles: ['prepress_manager'],
      gates: ['artworkPresent', 'artworkMatch'], note: 'Manager approves the internal fix.' },
    { action: 'reject_major', to: 'rejected', roles: ['prepress_staff', 'prepress_manager'], requires: ['reason', 'proof'] },
  ],
  escalated: [
    { action: 'approve', to: 'scheduling', roles: ['prepress_manager'], gates: ['artworkPresent', 'artworkMatch'] },
    { action: 'reject_major', to: 'rejected', roles: ['prepress_manager'], requires: ['reason', 'proof'] },
  ],
  scheduling: [
    { action: 'assign_inhouse', to: 'printing', roles: ['scheduler_staff', 'scheduler_manager'],
      gates: ['payment'], requires: ['machine'], note: 'Assign machine (Scheduler §3.5).' },
    { action: 'assign_outsource', to: 'outsourcing', roles: ['scheduler_staff', 'scheduler_manager'],
      gates: ['payment'], requires: ['printer'], note: 'Award to printer by best quote/time/logistics (Scheduler §3.5).' },
  ],
  printing: [
    { action: 'finish', to: 'logistics', roles: ['scheduler_staff', 'scheduler_manager'], note: 'Printing → Finishing → QC → ready to ship.' },
  ],
  outsourcing: [
    { action: 'receive_hub', to: 'logistics', roles: ['hub', 'logistics_staff', 'logistics_manager'],
      requires: ['tracking'], note: 'Hub receives, relabels/repacks (Logistics §4.4).' },
  ],
  logistics: [
    { action: 'dispatch', to: 'dispatched', roles: ['logistics_staff', 'logistics_manager'],
      requires: ['courier'], note: 'Label, assign courier, dispatch (Logistics §4.5).' },
  ],
  dispatched: [
    { action: 'deliver', to: 'completed', roles: ['logistics_staff', 'logistics_manager', 'cs_walkin', 'store_manager'],
      note: 'Confirm delivery / outlet pickup (Outlet §4.5).' },
  ],
};

function roleCan(role, t) {
  if (role === 'production_director') return true; // override authority
  return (t.roles || []).indexOf(role) !== -1;
}

// Compute the transitions a given role may attempt on a job right now,
// annotated with any blocking gate/requirement (so the UI can show *why* disabled).
function availableActions(job, role) {
  const list = TRANSITIONS[job.status] || [];
  return list.map(t => {
    const permitted = roleCan(role, t);
    const gateBlock = (t.gates || []).map(g => GATES[g](job)).filter(Boolean);
    return {
      action: t.action, to: t.to, toLabel: STATUS[t.to] && STATUS[t.to].label,
      note: t.note, requires: t.requires || [],
      permitted, blockedBy: gateBlock, enabled: permitted && gateBlock.length === 0,
    };
  });
}

// Validate + return the resolved transition (or an error object). Does not mutate.
function resolveTransition(job, role, action, payload) {
  const t = (TRANSITIONS[job.status] || []).find(x => x.action === action);
  if (!t) return { error: `Action "${action}" is not valid from status "${job.status}".` };
  if (!roleCan(role, t)) return { error: `Role "${role}" may not perform "${action}".` };
  for (const g of (t.gates || [])) { const r = GATES[g](job); if (r) return { error: r, gate: g }; }
  for (const f of (t.requires || [])) { if (!payload || payload[f] == null || payload[f] === '') return { error: `Missing required field "${f}" for "${action}".` }; }
  return { transition: t };
}

// Priority: ONLY (1) customer deadline, then (2) payment-confirmation time (Scheduler §3.4).
function priorityCompare(a, b) {
  const da = a.deadline ? Date.parse(a.deadline) : Infinity;
  const db = b.deadline ? Date.parse(b.deadline) : Infinity;
  if (da !== db) return da - db;
  const pa = a.paymentValidatedAt ? Date.parse(a.paymentValidatedAt) : Infinity;
  const pb = b.paymentValidatedAt ? Date.parse(b.paymentValidatedAt) : Infinity;
  return pa - pb;
}

module.exports = { ROLES, STATUS, GATES, TRANSITIONS, roleCan, availableActions, resolveTransition, priorityCompare };
