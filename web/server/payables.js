/*
 * Printer statement of account (accounts payable), user 2026-09-26:
 *   · logistics receives and accepts the goods → the amount on the printer's invoice is CREDITED to its statement
 *   · a weekly payment run (Friday): logistics finalises the week's invoices and pays by bank transfer
 *   · logistics uploads the transfer slip → the printer's statement is DEBITED
 * Balance = credits − debits = what Printoka still owes the printer. Printers see their own statement.
 */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const store = require('./store');

const ROOT = path.join(__dirname, '..', '..', 'private-files', 'payments');
const PAY_DAY = 5; // the weekly payment run: Friday
const now = () => new Date().toISOString();
const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
const safe = n => String(n || 'file').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-').slice(0, 120);
const MIME = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };

function payments() { const db = store.load(); db.printerPayments = db.printerPayments || []; return db.printerPayments; }
// the next payment run on or after a date (YYYY-MM-DD)
function nextRun(from) { const d = new Date(from || Date.now()); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + ((PAY_DAY - d.getDay() + 7) % 7)); return d.toISOString().slice(0, 10); }
function vendorName(vid) { const v = store.findCustomer(vid); return v ? (v.company || v.name) : vid; }
function invoiceAmount(j) {
  const o = j.outsource || {};
  if (o.printerInvoice && Number(o.printerInvoice.amount) > 0) return r2(o.printerInvoice.amount);
  const v = (o.vendors || []).find(x => x.vendorId === o.awardedTo); return r2(v && v.price);
}
// goods received and accepted by logistics → the printer's invoice is billed (credit)
// Printoka's own internal production (a printer account marked internal) is never billed
const isInternal = vid => { const v = store.findCustomer(vid); return !!(v && v.internal); };
function onReceived(j, actor) {
  const o = j && j.outsource; if (!o || !o.awardedTo || o.billedAt || isInternal(o.awardedTo)) return;
  o.billedAt = now(); o.billedBy = actor || 'Logistics'; o.billAmount = invoiceAmount(j);
}
// jobs received before the statement existed are billed from the day logistics received them; payments marked before
// it existed (the old "Mark printer paid") become payment entries, so the statement is complete from day one
function backfill() {
  let changed = false;
  store.jobs().forEach(j => {
    const o = j.outsource; if (!o || !o.awardedTo || isInternal(o.awardedTo)) return;
    const received = !!(j.statusAt && j.statusAt.logistics) || ['logistics', 'dispatched', 'ready_collect', 'completed'].indexOf(j.status) >= 0 && j.route === 'outsource';
    if (!o.billedAt && received) { o.billedAt = (j.statusAt && j.statusAt.logistics) || o.paidAt || now(); o.billedBy = 'Logistics'; o.billAmount = invoiceAmount(j); changed = true; }
    if (o.paidAt && !o.paymentId && o.billedAt) {
      const p = { id: 'PAY-' + crypto.randomBytes(3).toString('hex').toUpperCase(), vendorId: o.awardedTo, amount: r2(o.billAmount), jobIds: [j.id], reference: o.paidRef || '', slip: null, at: o.paidAt, by: o.paidBy || 'Printoka', legacy: true };
      payments().push(p); o.paymentId = p.id; changed = true;
    }
  });
  if (changed) store.save();
}
const billed = vid => isInternal(vid) ? [] : store.jobs().filter(j => j.outsource && j.outsource.awardedTo === vid && j.outsource.billedAt);
const unpaid = vid => billed(vid).filter(j => !j.outsource.paymentId);
const pub = f => f ? { id: f.id, name: f.name } : null;
const invRow = j => { const o = j.outsource; return { jobId: j.id, product: j.product, qty: j.qty, po: o.po || null, amount: o.billAmount, receivedAt: o.billedAt, invoice: pub(o.printerInvoice), paymentId: o.paymentId || null }; };

function statement(vid) {
  backfill();
  const rows = billed(vid).map(j => { const o = j.outsource;
    return { at: o.billedAt, type: 'invoice', ref: o.po || j.id, description: 'Invoice · ' + (o.po || '') + ' · ' + j.product + ' (' + j.id + ')', credit: r2(o.billAmount), debit: 0, jobId: j.id, invoice: pub(o.printerInvoice) }; })
    .concat(payments().filter(p => p.vendorId === vid).map(p => ({ at: p.at, type: 'payment', ref: p.id, description: 'Payment · bank transfer' + (p.reference ? ' · ' + p.reference : '') + ' (' + p.jobIds.length + ' invoice' + (p.jobIds.length === 1 ? '' : 's') + ')', credit: 0, debit: r2(p.amount), paymentId: p.id, slip: pub(p.slip) })))
    .sort((a, b) => String(a.at).localeCompare(String(b.at)));
  let bal = 0; rows.forEach(r => { bal = r2(bal + r.credit - r.debit); r.balance = bal; });
  return { vendorId: vid, vendor: vendorName(vid), rows, totalCredit: r2(rows.reduce((s, r) => s + r.credit, 0)), totalDebit: r2(rows.reduce((s, r) => s + r.debit, 0)), balance: bal, nextRun: nextRun() };
}
// logistics: every printer with invoices waiting for the next payment run
function summary() {
  backfill();
  const ids = Array.from(new Set(store.jobs().filter(j => j.outsource && j.outsource.awardedTo && j.outsource.billedAt && !j.outsource.paymentId).map(j => j.outsource.awardedTo))).filter(vid => !isInternal(vid));
  return { nextRun: nextRun(), printers: ids.map(vid => { const list = unpaid(vid);
    return { vendorId: vid, vendor: vendorName(vid), invoices: list.length, due: r2(list.reduce((s, j) => s + (j.outsource.billAmount || 0), 0)), oldest: list.map(j => j.outsource.billedAt).sort()[0] || null, missingInvoice: list.filter(j => !j.outsource.printerInvoice).length }; })
    .sort((a, b) => String(a.oldest).localeCompare(String(b.oldest))),
    paid: payments().slice().sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 20).map(p => ({ id: p.id, vendorId: p.vendorId, vendor: vendorName(p.vendorId), amount: p.amount, reference: p.reference, at: p.at, by: p.by, invoices: p.jobIds.length, slip: pub(p.slip) })) };
}
function detail(vid) {
  const v = store.findCustomer(vid); if (!v || v.type !== 'vendor') return { error: 'Printer not found.' };
  const list = unpaid(vid).map(invRow);
  return { vendor: { id: v.id, name: v.company || v.name, email: v.email || '', phone: v.phone || '', bank: v.bank || null }, invoices: list, due: r2(list.reduce((s, x) => s + (x.amount || 0), 0)), nextRun: nextRun(), statement: statement(vid) };
}
// finalise the run: pay every invoice waiting for this printer, with the bank transfer slip → debit
function pay(vid, me, b) {
  const list = unpaid(vid); if (!list.length) return { error: 'There is nothing to pay for this printer.' };
  if (!b || !b.slipData) return { error: 'Upload the transfer slip.' };
  const name = safe(b.slipName); const ext = (name.split('.').pop() || '').toLowerCase();
  if (!MIME[ext]) return { error: 'The transfer slip must be a PDF or an image.' };
  const m = String(b.slipData).match(/^data:[^;]*;base64,(.+)$/); if (!m) return { error: 'No file received.' };
  const buf = Buffer.from(m[1], 'base64'); if (buf.length > 10 * 1024 * 1024) return { error: 'The transfer slip must be 10 MB or smaller.' };
  { const tp = require('./security').fileTypeProblem(buf, ext); if (tp) return { error: tp }; }
  const id = 'PAY-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  fs.mkdirSync(ROOT, { recursive: true }); const stored = id + '-' + name; fs.writeFileSync(path.join(ROOT, stored), buf);
  const p = { id, vendorId: vid, amount: r2(list.reduce((s, j) => s + (j.outsource.billAmount || 0), 0)), jobIds: list.map(j => j.id), reference: String(b.reference || '').slice(0, 80),
    slip: { id, name, stored, size: buf.length }, at: now(), by: me.name || me.email };
  payments().push(p);
  list.forEach(j => { j.outsource.paymentId = id; j.outsource.paidAt = p.at; j.outsource.paidBy = p.by; j.outsource.paidRef = p.reference; });
  store.logEvent({ actor: p.by, role: 'logistics', action: 'vendor_paid', jobId: null, from: null, to: null, note: id + ' · ' + vendorName(vid) + ' · RM ' + p.amount.toFixed(2) + ' · ' + p.jobIds.join(', ') });
  store.notify({ type: 'customer', id: vid }, { kind: 'printer_payment', title: 'Payment made — RM ' + p.amount.toFixed(2), body: p.jobIds.length + ' invoice(s) paid by bank transfer' + (p.reference ? ' (' + p.reference + ')' : '') + '. See your Statement of Account.' });
  store.save(); return { ok: true, payment: { id, amount: p.amount, invoices: p.jobIds.length } };
}
function readSlip(pid, me) {
  const p = payments().find(x => x.id === pid); if (!p || !p.slip) return { error: 'File not found.', code: 404 };
  if (me.type === 'vendor' && (me.vendorId || me.id) !== p.vendorId) return { error: 'Not allowed.', code: 403 };
  const f = path.join(ROOT, p.slip.stored); if (!f.startsWith(ROOT) || !fs.existsSync(f)) return { error: 'File missing on disk.', code: 404 };
  return { file: p.slip, data: fs.readFileSync(f), type: MIME[(p.slip.name.split('.').pop() || '').toLowerCase()] || 'application/octet-stream' };
}

module.exports = { onReceived, statement, summary, detail, pay, readSlip, nextRun, invoiceAmount };
