#!/usr/bin/env node
'use strict';
// Import customers and their history from the old WordPress / WooCommerce site, using a phpMyAdmin SQL export.
//
//   node import-wp.js <export.sql>                         dry run: read the export and report, write nothing
//   node import-wp.js <export.sql> --apply --data <file>   write into that data file (try it on a COPY first)
//
// Options: --prefix printoka_ (detected when left out) · --all-roles (also import staff roles, off by default)
//          --live (needed to write into the live web/server/data.json; stop the server first, it keeps its own copy in memory)
//
// What comes over, per customer: email, name, phone, company, sign-up date, last active, the WordPress password hash
// (kept as wpHash: the old password works once and is then re-hashed, see wppass.js), billing/shipping addresses,
// wallet balance + transactions (woo-wallet), and past orders (HPOS wc_orders or legacy shop_order posts) as
// read-only history in db.legacyOrders. Nothing enters the live order chain, so no dashboard picks the old orders up.
// Customers whose email already exists here are merged: blanks are filled in, the current password is kept.
// Keep the export OUTSIDE the repository: it holds personal data and password hashes.
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const argv = process.argv.slice(2), flag = n => argv.includes('--' + n), opt = n => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : null; };
const SQL_FILE = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && /^--(data|prefix)$/.test(argv[i - 1])));
if (!SQL_FILE) { console.log('usage: node import-wp.js <export.sql> [--apply --data <file>] [--prefix printoka_] [--all-roles] [--live]'); process.exit(1); }

// ---- SQL export reader: CREATE TABLE column order + INSERT rows ----
function parseDump(sql) {
  const tables = {};
  const cols = {};
  const reCreate = /CREATE TABLE(?: IF NOT EXISTS)? `([^`]+)` \(([\s\S]*?)\n\)[^;]*;/g; let m;
  while ((m = reCreate.exec(sql))) cols[m[1]] = m[2].split('\n').map(l => /^\s*`([^`]+)`/.exec(l)).filter(Boolean).map(x => x[1]);
  const reIns = /INSERT INTO `([^`]+)`\s*(\(([^)]*)\))?\s*VALUES\s*/g;
  while ((m = reIns.exec(sql))) {
    const name = m[1], names = m[3] ? m[3].split(',').map(s => s.trim().replace(/`/g, '')) : cols[name];
    let i = reIns.lastIndex; const rows = tables[name] = tables[name] || [];
    // read (v, v, ...), (...) ... ; with MySQL string escapes
    for (;;) {
      while (/\s|,/.test(sql[i])) i++;
      if (sql[i] === ';') { i++; break; }
      if (sql[i] !== '(') throw new Error('unexpected SQL near ' + JSON.stringify(sql.slice(i, i + 40)));
      i++; const row = [];
      for (;;) {
        while (sql[i] === ' ' || sql[i] === '\n' || sql[i] === '\r' || sql[i] === '\t') i++;
        if (sql[i] === "'") {
          let s = ''; i++;
          for (;;) { const c = sql[i++];
            if (c === undefined) throw new Error('unterminated string in ' + name);
            if (c === '\\') { const e = sql[i++]; s += e === 'n' ? '\n' : e === 'r' ? '\r' : e === 't' ? '\t' : e === '0' ? '\0' : e === 'Z' ? '\x1a' : e === 'b' ? '\b' : e; }
            else if (c === "'") { if (sql[i] === "'") { s += "'"; i++; } else break; }
            else s += c; }
          row.push(s);
        } else { let j = i; while (sql[j] !== ',' && sql[j] !== ')') j++; const t = sql.slice(i, j).trim(); i = j;
          row.push(/^null$/i.test(t) ? null : t); }
        while (sql[i] === ' ') i++;
        if (sql[i] === ',') { i++; continue; }
        if (sql[i] === ')') { i++; break; }
        throw new Error('bad row in ' + name);
      }
      rows.push(names ? Object.fromEntries(names.map((n, k) => [n, row[k]])) : row);
    }
    reIns.lastIndex = i;
  }
  return tables;
}

// PHP serialize, enough for capabilities arrays: a:1:{s:8:"customer";b:1;}
function phpRoles(s) { const out = []; const re = /s:\d+:"([^"]+)";b:1;/g; let m; while ((m = re.exec(s || ''))) out.push(m[1]); return out; }

const sql = fs.readFileSync(SQL_FILE, 'utf8');
const T = parseDump(sql);
const prefix = opt('prefix') || (Object.keys(T).find(t => /_users$/.test(t) && T[t][0] && 'user_pass' in T[t][0]) || 'printoka_users').replace(/users$/, '');
const tbl = n => T[prefix + n] || [];
const users = tbl('users'), umeta = tbl('usermeta');
if (!users.length) { console.log('No ' + prefix + 'users rows found. Tables in the export: ' + Object.keys(T).join(', ')); process.exit(1); }

const metaBy = {}; umeta.forEach(r => { (metaBy[r.user_id] = metaBy[r.user_id] || {})[r.meta_key] = r.meta_value; });
const STAFF = /^(administrator|shop_manager|editor|author|contributor)$/;
const dt = s => { if (!s || /^0000/.test(s)) return null; const d = new Date(String(s).replace(' ', 'T') + 'Z'); return isNaN(d) ? null : d.toISOString(); };
const money = v => Math.round((parseFloat(v) || 0) * 100) / 100;
const report = { prefix, users: users.length, imported: 0, merged: 0, skippedStaff: [], skippedNoEmail: 0, hashKinds: {}, addresses: 0, walletUsers: 0, walletTx: 0, orders: 0, orderSource: null, unmappedAddressMeta: {} };

function addr(m, kind) {
  const g = k => (m[kind + '_' + k] || '').trim();
  if (!g('address_1') && !g('city') && !g('postcode')) return null;
  return { id: 'A-' + crypto.randomBytes(3).toString('hex').toUpperCase(), label: kind === 'billing' ? 'Billing' : 'Shipping',
    name: [g('first_name'), g('last_name')].filter(Boolean).join(' '), phone: g('phone'), line1: g('address_1'), line2: g('address_2'),
    city: g('city'), postcode: g('postcode'), state: g('state'), country: g('country') || 'MY', isDefault: false };
}

// ---- customers ----
const out = [];
for (const u of users) {
  const m = metaBy[u.ID] || {}, roles = phpRoles(m[prefix + 'capabilities']);
  const email = String(u.user_email || '').trim().toLowerCase();
  if (!email) { report.skippedNoEmail++; continue; }
  if (roles.some(r => STAFF.test(r)) && !flag('all-roles')) { report.skippedStaff.push(email + ' (' + roles.join(',') + ')'); continue; }
  const h = u.user_pass || '', kind = h.startsWith('$wp$') ? 'wp-bcrypt' : h.startsWith('$2') ? 'bcrypt' : /^\$[PH]\$/.test(h) ? 'phpass' : /^[a-f0-9]{32}$/i.test(h) ? 'md5' : 'other';
  report.hashKinds[kind] = (report.hashKinds[kind] || 0) + 1;
  Object.keys(m).forEach(k => { if (/address/i.test(k) && !/^(billing|shipping)_/.test(k)) report.unmappedAddressMeta[k] = (report.unmappedAddressMeta[k] || 0) + 1; });
  const addresses = [addr(m, 'billing'), addr(m, 'shipping')].filter(Boolean);
  if (addresses.length === 2 && ['line1', 'city', 'postcode'].every(k => addresses[0][k] === addresses[1][k])) addresses.pop();
  if (addresses[0]) addresses[0].isDefault = true;
  const name = [m.first_name, m.last_name].filter(Boolean).join(' ').trim() || u.display_name || email.split('@')[0];
  const lastActive = m.wc_last_active ? new Date(+m.wc_last_active * 1000).toISOString() : null;
  out.push({ wpId: String(u.ID), email, wpHash: kind === 'other' ? null : h, name, phone: (m.billing_phone || '').trim(), company: (m.billing_company || '').trim(),
    createdAt: dt(u.user_registered), lastActiveWp: lastActive, wpRoles: roles, addresses, walletBalance: m._current_woo_wallet_balance != null ? money(m._current_woo_wallet_balance) : null, ledger: [] });
}
const byWp = Object.fromEntries(out.map(c => [c.wpId, c]));

// ---- wallet (woo-wallet) ----
const wtx = tbl('woo_wallet_transactions');
wtx.filter(t => String(t.deleted || '0') === '0').sort((a, b) => (a.date || '').localeCompare(b.date || '') || (+a.transaction_id - +b.transaction_id)).forEach(t => {
  const c = byWp[t.user_id]; if (!c) return;
  const amt = money(t.amount) * (t.type === 'debit' ? -1 : 1);
  c.ledger.unshift({ id: 'L-WP' + t.transaction_id, ts: dt(t.date) || new Date().toISOString(), reason: 'WP_WALLET', amount: amt, actor: 'wp-import', orderId: null,
    balanceAfter: t.balance != null ? money(t.balance) : null, note: (t.details || '').slice(0, 200) });
  report.walletTx++;
});
out.forEach(c => { if (c.walletBalance == null && c.ledger.length) c.walletBalance = c.ledger[0].balanceAfter != null ? c.ledger[0].balanceAfter : money(c.ledger.reduce((s, l) => s + l.amount, 0));
  if (c.walletBalance) report.walletUsers++; });

// ---- orders: HPOS first, legacy posts otherwise ----
const items = {}, itemMeta = {};
tbl('woocommerce_order_itemmeta').forEach(r => { (itemMeta[r.order_item_id] = itemMeta[r.order_item_id] || {})[r.meta_key] = r.meta_value; });
tbl('woocommerce_order_items').forEach(r => { if (r.order_item_type !== 'line_item') return; const im = itemMeta[r.order_item_id] || {};
  (items[r.order_id] = items[r.order_id] || []).push({ name: r.order_item_name, qty: +im._qty || 1, total: money(im._line_total) }); });
const legacy = [];
const pushOrder = o => { const c = byWp[o.customerId]; if (!c) return; legacy.push(Object.assign({ id: 'WP-' + o.wpOrderId, email: c.email }, o)); report.orders++; };
if (tbl('wc_orders').length) {
  report.orderSource = 'HPOS ' + prefix + 'wc_orders';
  const ad = {}; tbl('wc_order_addresses').forEach(a => { (ad[a.order_id] = ad[a.order_id] || {})[a.address_type] = a; });
  tbl('wc_orders').filter(o => (o.type || 'shop_order') === 'shop_order').forEach(o => {
    const s = (ad[o.id] || {}).shipping || {};
    pushOrder({ wpOrderId: String(o.id), customerId: String(o.customer_id), status: String(o.status || '').replace(/^wc-/, ''), currency: o.currency || 'MYR', total: money(o.total_amount),
      payment: o.payment_method_title || o.payment_method || '', createdAt: dt(o.date_created_gmt), items: items[o.id] || [],
      shipTo: s.city ? { city: s.city, state: s.state, postcode: s.postcode, country: s.country } : null });
  });
} else {
  const pm = {}; tbl('postmeta').forEach(r => { (pm[r.post_id] = pm[r.post_id] || {})[r.meta_key] = r.meta_value; });
  const posts = tbl('posts').filter(p => p.post_type === 'shop_order');
  if (posts.length) report.orderSource = 'legacy ' + prefix + 'posts (shop_order)';
  posts.forEach(p => { const m = pm[p.ID] || {};
    pushOrder({ wpOrderId: String(p.ID), customerId: String(m._customer_user || '0'), status: String(p.post_status || '').replace(/^wc-/, ''), currency: m._order_currency || 'MYR',
      total: money(m._order_total), payment: m._payment_method_title || '', createdAt: dt(p.post_date_gmt), items: items[p.ID] || [],
      shipTo: m._shipping_city ? { city: m._shipping_city, state: m._shipping_state, postcode: m._shipping_postcode, country: m._shipping_country } : null });
  });
}
report.addresses = out.reduce((s, c) => s + c.addresses.length, 0);

// ---- report (counts only: no emails or hashes beyond the skipped staff list) ----
console.log('WordPress export: ' + path.basename(SQL_FILE) + ' · table prefix ' + prefix);
console.log('  users in export        ' + report.users);
console.log('  customers to import    ' + out.length + (report.skippedNoEmail ? ' (' + report.skippedNoEmail + ' without email skipped)' : ''));
console.log('  password hash kinds    ' + JSON.stringify(report.hashKinds) + (report.hashKinds.other ? '  (other = cannot verify: those customers use "Forgot password")' : ''));
console.log('  addresses              ' + report.addresses);
console.log('  wallet                 ' + report.walletUsers + ' customers with a balance, ' + report.walletTx + ' transactions');
console.log('  past orders            ' + report.orders + (report.orderSource ? ' from ' + report.orderSource : ' (no order tables in export)'));
if (report.skippedStaff.length) console.log('  staff accounts skipped ' + report.skippedStaff.length + ' (re-create staff here; use --all-roles to import them as customers)');
if (Object.keys(report.unmappedAddressMeta).length) console.log('  other address meta     ' + JSON.stringify(report.unmappedAddressMeta) + '  (address-book plugin: not imported yet)');

if (!flag('apply')) { console.log('\nDry run: nothing was written. Add --apply --data <copy of data.json> to import.'); process.exit(0); }

// ---- apply ----
const target = opt('data'); if (!target) { console.log('--apply needs --data <file>'); process.exit(1); }
const live = path.resolve(__dirname, 'data.json');
if (path.resolve(target) === live && !flag('live')) { console.log('Refusing to write the live data.json without --live. Run it on a copy first.'); process.exit(1); }
const hadFile = fs.existsSync(target); if (hadFile) fs.copyFileSync(target, target + '.before-wp-import');
process.env.PRINTOKA_DATA = path.resolve(target);
const store = require('./store');
const db = store.load(); db.customers = db.customers || []; db.legacyOrders = db.legacyOrders || [];
const have = new Map(db.customers.map(c => [c.email, c]));
for (const w of out) {
  let c = have.get(w.email);
  if (c) {
    report.merged++;
    c.wpId = c.wpId || w.wpId; ['name', 'phone', 'company'].forEach(k => { if (!c[k] && w[k]) c[k] = w[k]; });
    if (!c.lastActiveWp) c.lastActiveWp = w.lastActiveWp;
  } else {
    report.imported++;
    c = { id: 'C-' + crypto.randomBytes(4).toString('hex').toUpperCase(), email: w.email, passHash: null, salt: null, wpHash: w.wpHash, type: 'customer', role: 'customer',
      name: w.name, phone: w.phone, company: w.company, tier: 'Standard', spend12mo: 0, creditBalance: 0, addresses: [], creditLedger: [], coupons: [],
      createdAt: w.createdAt || new Date().toISOString(), wpId: w.wpId, lastActiveWp: w.lastActiveWp, migratedAt: new Date().toISOString() };
    db.customers.push(c); have.set(c.email, c);
  }
  const key = a => [a.line1, a.city, a.postcode].join('|').toLowerCase();
  c.addresses = c.addresses || []; const seen = new Set(c.addresses.map(key));
  w.addresses.forEach(a => { if (!seen.has(key(a))) { if (c.addresses.length) a.isDefault = false; c.addresses.push(a); seen.add(key(a)); } });
  c.creditLedger = c.creditLedger || []; const ids = new Set(c.creditLedger.map(l => l.id));
  const fresh = w.ledger.filter(l => !ids.has(l.id));
  if (fresh.length || (w.walletBalance && !c.creditLedger.some(l => l.reason === 'WP_WALLET'))) {
    c.creditLedger = fresh.concat(c.creditLedger);
    c.creditBalance = money((c.creditBalance || 0) + (w.walletBalance || 0));
  }
}
const custByEmail = new Map(db.customers.map(c => [c.email, c])), known = new Set(db.legacyOrders.map(o => o.id));
let addedOrders = 0;
legacy.forEach(o => { if (known.has(o.id)) return; addedOrders++; const c = custByEmail.get(o.email); db.legacyOrders.push(Object.assign({}, o, { userId: c && c.id, email: undefined })); });
store.logEvent({ actor: 'wp-import', role: 'admin', action: 'wp_import', jobId: null, from: null, to: null, note: report.imported + ' imported, ' + report.merged + ' merged, ' + report.orders + ' past orders' });
store.save();
console.log('\nWritten to ' + target + ': ' + report.imported + ' new customers, ' + report.merged + ' merged into existing, ' + addedOrders + ' past orders added.' + (hadFile ? ' Backup: ' + target + '.before-wp-import' : ''));
