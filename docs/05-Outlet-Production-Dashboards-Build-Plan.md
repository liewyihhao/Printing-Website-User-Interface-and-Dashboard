# Part 5 — Outlet & Production Dashboards: Build Plan

**Source of truth:** *Guidebook to Printoka Outlet* (Outlet Operations Manual v1.0) and *Guidebook to Printoka Production* (Production Operation Manual v1.0 — Prepress, Scheduler, Logistics, Cross-Dept, Daily SOP, KPI, Discipline).
**Reconciles with:** the Claude Design prototype (now running in `web/`, all 24 screens) and `02-Part2-Website-Feature-Plan.md` / `00-Printoka-Masterplan-Overview.md`.
**Status of the UI today:** the dashboard screens (`s_outlet`, `s_prepress`, `s_production`, `s_logistics`, `s_director`, `s_vendor`) render faithfully but on **demo data**. The configurator is now wired to the **real pricing engine** (93 products). Everything below is about making these dashboards *operate* on real state.

---

## 1. What the guidebooks change vs. the design prototype

The guidebooks are more specific than the prototype. These deltas must be absorbed before/while building:

| # | Guidebook reality | Prototype today | Action |
|---|---|---|---|
| D1 | Production line is **Prepress → Scheduler → Logistics** (Scheduler owns job prioritization, machine allocation **and** outsourcing-to-printer by best quote). | Middle screen is called "Production Queue" and blends in-house/outsource. | **Rename "Production" → "Scheduler"**; move outsourcing decision (best-quotation printer selection) here. Keep a machine/queue allocation view. |
| D2 | Every department is **Manager (1) + Staff (many)**, strict reporting Staff→Manager→Director, **no cross-department bypass**. | Role-scoped screens, but no Manager-vs-Staff split. | Add a **two-tier RBAC**: `*_manager` (approves escalations, sees dept KPI, override within dept) vs `*_staff` (execute + escalate only). |
| D3 | Outlet has **three roles**: Store/Assistant Manager, Printing Consultant (B2B), Customer Service (walk-in). Refund authority tiers (≤RM50 SM · 51–200 SM+doc · >200 HQ). Complaint SLA (ack 10 min / resolve-or-escalate 30 min). | Single "Outlet" scope, generic quote board. | Model the 3 outlet roles + **refund-approval workflow** + **complaint escalation matrix**. |
| D4 | Hard **SLAs everywhere**: online order **ack ≤5 min**; Prepress **≤30 min std / ≤10 min urgent** (book products exempt); complaint ack ≤10 min. | Static "Avg response 27 min" tile. | SLA is a first-class field on every job/ticket, with timers + breach flags feeding KPI. |
| D5 | **Prepress file-check** is a fixed 3-step list (Basic → Technical (12 checks incl. white line, RGB presence, Pantone, risky die-cut, similar-colour <10%, toning <10%) → Content) and a **4-way status** (PASS / MINOR ISSUE → fix+approve / MAJOR → reject to outlet / CRITICAL → escalate). Rejection must state issue + **visual proof screenshot** + suggested correction. | Approve/reject popup with generic reason codes. | Build the checklist + 4-status classifier + "attach visual proof" into the prepress approve/reject flow. This is the same data the customer-facing artwork checker (C2/C3) uses. |
| D6 | **Non-negotiables** (both manuals): no job without **system entry**; no production without **payment confirmation** (bank transfer *validated*); no proceed if **order ≠ artwork** unless customer authorizes; **priority ONLY by (1) customer deadline (2) payment-confirmation time**; every action **traceable in system logs**. | Implied, not enforced. | These become **hard gates + an append-only audit log** in the state machine, not UI conventions. |
| D7 | **Daily reports** are mandatory artefacts: Outlet **Daily Store Report** (order amount/value, quotes submitted, follow-up outcomes, new accounts, B2B gained, feedback); Production **Morning Report** (jobs pending, urgent list, machine/manpower) + **End-of-Day Report** (completed, delayed+reason, errors, tomorrow backlog). | Not present. | Report generators per role, from the same event log — also the KPI source. |
| D8 | **Outsourcing** = request quotes from printers → pick by cost/time/logistics (never relationship/bribery) → award → PO → Logistics **receives, relabels, repacks**. Ties to the existing 9-status printing-job lifecycle + **Hub**. | Vendor/Hub screen exists (demo). | Wire Scheduler↔Vendor portal↔Logistics on one job-state machine. |
| D9 | **KPIs are enumerated** per role (Prepress: check speed, error-detection, rejection accuracy, CSAT; Scheduler: outsource time/accuracy, on-time %, machine utilization, delays; Logistics: delivery accuracy, damage rate, on-time %; Outlet: quotes issued/accepted, conversion, response time, follow-up completion, sales value). | Demo KPI tiles. | KPI definitions become computed metrics with the **"first to touch owns it"** ownership rule. |

---

## 2. The core principle that dictates architecture

Both manuals repeat one rule: **nothing happens outside the system, and everything is traceable.** That means the dashboards can't stay as independent screens with demo arrays — they must all read/write **one shared job/quote state machine with an append-only audit log**. So the build is **backend-first**: a data + API + auth layer, then the dashboards become thin views over it.

**End-to-end state machine (from Production §1.8 + Outlet §4, unified):**

```
Order/Quote intake (Online ack ≤5min │ Walk-in │ Custom quote)
        │  gate: system entry + payment confirmed (or credit terms)
        ▼
PREPRESS  ── file check (Basic→Technical→Content) → PASS / MINOR(fix+approve) / MAJOR(reject→outlet) / CRITICAL(escalate)
        │  gate: order details == artwork (else customer authorizes)
        ▼
SCHEDULER ── priority = deadline, then payment time
        ├── in-house: assign machine → Printing → Finishing → QC
        └── outsource: request printer quotes → award (best cost/time/logistics) → PO PDF → Hub receive
        ▼
LOGISTICS ── receive/relabel/repack → pack → label (from dashboard) → assign courier → dispatch → track → delivered/picked-up
        ▼
Outlet pickup/delivery confirmation (coverage check) │ Customer tracking
```

Priority, SLA timers, ownership, and every transition are logged.

---

## 3. Phased build

Phases align with the Overview's roadmap. **P0 is the unlock** — without it the dashboards can't be "functional." Each item cites its guidebook clause.

### Phase 0 — Data & platform foundation (the unlock)
*Necessary before any dashboard becomes real.*

1. **Data model** for the shared entities (extend Overview §6): `Order`, `Job`, `Quote`, `Artwork(+versions+checkResults)`, `PrintingJob(outsource, 9-status)`, `Hub`, `Shipment`, `CreditLedger`, `AuditEvent`, `KpiSnapshot`, `Outlet`, `User(role, dept, outlet)`, `Machine`, `Printer(vendor)`.
2. **Job/Quote state machine** service (§2 above) with **hard gates**: system-entry, payment-validated, artwork==order (Prod §1.7; Outlet §1.2/§4.1). Illegal transitions rejected.
3. **Append-only audit log** — actor + timestamp + before/after on every transition (Prod §1.7 "traceable"; Outlet §8).
4. **RBAC**: two-tier per dept (`*_manager`/`*_staff`) + outlet roles (store_manager, print_consultant, cs_walkin) + production_director + printer + hub. Strict reporting boundaries (Prod §1.5). Replaces the design's flat scopes.
5. **API contract** the dashboards call (REST/RPC): `POST /jobs/:id/transition`, `GET /queues/:dept`, `POST /quotes`, `GET /kpi/...`, `POST /audit`. Pricing already available via the wired engine.
6. **Auth + session** (email/OTP), and the migration decisions from Audit §9 (phpass verify-on-login, URL/SEO continuity) — can run in parallel.

### Phase 1 — Intake + the linear job lifecycle (make one order flow end-to-end)
*The smallest slice that satisfies "no job outside the system."*

- **Outlet online-order intake** with **5-min acknowledge** timer + verify checklist (product/qty/file/deadline/pickup-outlet) (Outlet §4.2).
- **Walk-in + quotation intake**: account-required, capture specs, issue quote to customer account, follow-up (Outlet §4.3–4.4). Quote builder **reuses the wired configurator/engine** — no parallel price list (Outlet §1.2).
- **Payment-confirmation gate** (validate bank transfer / mark paid) before production (Outlet §4.3; Prod §1.7).
- **Prepress queue** wired to real jobs: the **3-step checklist + 4-status classifier + reject-with-visual-proof** (Prepress §2.4–2.7), SLA timer (≤30/≤10, book-exempt).
- **Scheduler queue**: receive approved job → priority sort (deadline, payment time) → in-house machine assign OR route to outsource (Scheduler §3.4–3.5).
- **Logistics queue**: receive/repack → label (Order ID, customer, destination, parcel count) → courier assign → dispatch → confirm (Logistics §4.4–4.5).
- **Customer tracking** already exists (`s_track`) — point it at the real state machine.

### Phase 2 — Dashboards, boards & the two-tier org
*Turn the prototype screens into live operator tools.*

- **Outlet quote board** (`s_outlet`): live status bars **Quote Issued / Pending / Accepted / Follow-Up**, informational vs "act-now", per-quote action dropdown (view/PDF/collect payment/reminder/mark-done/schedule/convert), **"first to touch owns follow-up"** (Outlet §4; Part 2 D4).
- **Manager vs Staff** views per dept; **Production Director** cross-dept rollup + override (Prod §1.4).
- **Refund/reprint workflow** with authority tiers + reprint logging (Outlet §5); **complaint escalation** ticket with 10/30-min SLA (Outlet §6).
- **Outsourcing sub-flow**: printer quote requests → award by best quote → **PO PDF** → **Hub** receive/track → back to Logistics (Scheduler §3.5; Logistics §4; 9-status lifecycle). Wire the **Vendor/Hub portal** (`s_vendor`) to it.
- **Daily reports**: Outlet Daily Store Report; Production Morning + End-of-Day reports, generated from the event log (Outlet §7; Prod §1.6, §6).
- **Machine/manpower status** + downtime/delay SOP (reassign, notify, log) (Scheduler §3.6–3.7).

### Phase 3 — KPIs, SLA automation, analytics, CRM
- **KPI engine**: computed per role from `AuditEvent`/`KpiSnapshot`, honoring "first to touch owns it" (Prod §7; Outlet §7). Director dashboard charts + capacity view.
- **SLA automation**: auto-flag breaches (prepress, complaints, deadlines) → escalation feed + notifications (Prod §1.7 "deadline failure = operational failure").
- **Chat & Inquiry CRM** (Part 2 §G) — complaints/inquiries land here with the escalation matrix.
- **Vendor scorecard** (on-time %, reject rate) from the event log.
- **Audit & compliance** views (Outlet §8; Prod §8): surprise-audit read access, non-compliance flags.

### Phase 4 — Polish & scale
- Leaderboards, scheduled KPI digests, deeper machine scheduling/optimization, SG/BN rollout, native/mobile counter POS (Outlet §D5 mini-POS hardware).

---

## 4. Cross-cutting rules to enforce in code (not just UI)

- **Priority function** is centralized: `sort by (customer_deadline, payment_confirmed_at)` only — never staff/customer/outlet pressure (Scheduler §3.4).
- **Outsource selection** ranks by `(quote_cost, production_time, logistics_efficiency)` only; log the ranking; block manual override without reason (Scheduler §3.5).
- **Gates are server-side**: no client can transition a job past a failed gate.
- **Every mutation writes an `AuditEvent`.** No silent edits.
- **Ownership is sticky**: KPI owner = first actor to process; later editors don't inherit it (Prod E-rule; Outlet §4).
- **One membership/pricing model**: the configurator engine (now wired) is the only price source across storefront, outlet quotes, and walk-in — the manuals' "HQ-approved system pricing only" (Outlet §1.2).

---

## 5. Recommended immediate next steps

1. **Rename** the prototype's "Production" screen to **Scheduler** and split each production screen into Manager/Staff variants (cheap, aligns vocabulary now).
2. **Stand up Phase 0**: data model + state-machine service + audit log + RBAC + API — this is the real unlock and everything else is thin over it. Recommend Next.js (App Router) + a Postgres schema; keep the pricing engine as-is (already wired).
3. **Phase 1 vertical slice**: one online order flowing intake → prepress → scheduler → logistics → tracked, with gates + audit — proves the architecture before building all boards.

Open decisions to confirm before Phase 0: (a) DB/ORM choice; (b) whether outlet walk-in payment integrates a terminal now or "mark paid"; (c) machine list per production hub (for Scheduler allocation); (d) which SLA breaches auto-notify vs. just flag.

---

## 6. Catalogue layer (built 2026-09-10)

A display-name + category layer now sits between the pricing engine and the storefront (`web/catalogue.js` + `/api/catalogue`). The engine keeps Excard's internal ids/names; the site shows Printoka's own names and categories. This satisfies: **display-name override** (e.g. "Booklet — Litho" → "Offset Printing Booklets" — display-only, pricing unchanged), **8 categories** with all 93 products assigned, a **Browse-all** homepage CTA → **Category page** (filter + grid + instant from-prices), and an **Admin → Products & catalogue** editor (rename / recategorize / hide, persisted + audit-logged). Templates are listed per-product per-size on the product page; the actual AI/PSD/PDF files are a staged migration (drop into `web/assets/templates/<slug>/`), since they live in the old WordPress DB, not as an organized file set in the backup.

## 7. Phase-0 backend (built 2026-09-10)

The dependency-free Node backend (`web/server/`) already implements §2's state machine, §3-Phase-0's gates, RBAC and audit log, and serves the app. **Verified**: the artwork-mismatch gate blocks illegal transitions with the guidebook reason; approvals advance Prepress→Scheduler; every transition is audit-logged; priority = deadline then payment-time.

## 8. Dashboards wired to the live backend (built 2026-09-10)

All five dashboards — **Outlet, Prepress, Scheduler, Logistics, Production Director** — now read the **same** `/api/jobs` and act on the shared state machine. One order syncs across every department: acknowledging an intake order releases it to Prepress; approving it advances it to Scheduler; and so on to Logistics → Done. Each board shows a **live pipeline strip** (per-department counts) and a shared job card with the exact transitions that role may perform (gates disable the rest, with the blocking reason shown). The **Director** sees every job across all departments with override authority. New `POST /api/jobs` creates an order at intake (Outlet "New online order"). **Verified end-to-end**: approve in Prepress moved the job to the Scheduler queue live in both the Director rollup and the Scheduler board; the unpaid-order acknowledge stays disabled (payment gate). Card rendering is fault-tolerant so one bad record can't blank a board.

### Prepress review popup (built 2026-09-10)

Prepress job cards now open a **file-check review popup** (Prepress §2.4–2.7): an artwork preview with trim/bleed/safe overlay, the 3-step checklist (Basic → Technical → Content with pass/warn/fail), a rejection reason-code dropdown, and **Approve → Scheduler / Reject → outlet / Escalate** buttons wired to the live state machine. **Approve is disabled by the artwork == order gate** until a mismatch is authorized. **Verified**: rejecting the mismatch job returned it to the outlet (Prepress→Done) and approving the clean job advanced it to the Scheduler — both synced live across the pipeline.

### Packaging & boxes (built 2026-09-10)

The competitor-informed **packaging box builder** (`s_packaging`, from the design handoff) is integrated as its own `packaging` route: box-style **library** (two lanes — Short Run / Standard — box-family filter, model cards with die-line drawings), the **6-step DIY configurator**, the **spec/finishing/price** page (Standard vs Short Run lanes × 4 membership rungs), and the **die-line archive** tab. Homepage "Packaging & Boxes" tile routes here. Pricing is the design's demo for now — wiring the real box engine (calculator product #179, 67 styles) is the follow-up.

**Still ahead (Phase 2+):** the outsource award → PO PDF → Hub sub-flow on the Scheduler/Vendor screens; real box pricing in the packaging builder; real auth replacing the per-screen role; SLA timers + daily reports + KPI aggregation from the audit log.
