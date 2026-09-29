/*
 * Fresh start (user, 2026-09-29): remove every sample / test order so the flow can be tested from scratch,
 * customer → production → customer. Nothing is destroyed: the data file and the uploaded files are moved into
 * private-files/_backup-<date>/ first (git-ignored). Keeps every staff / outlet / printer login, products, prices,
 * blog and site settings; removes the auto-generated test customer accounts.
 * Run with the server STOPPED:  node web/server/fresh-start.js
 */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const DATA = path.join(__dirname, 'data.json');
const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
const BK = path.join(ROOT, 'private-files', '_backup-' + stamp);
fs.mkdirSync(BK, { recursive: true });
fs.copyFileSync(DATA, path.join(BK, 'data.json'));
// uploaded files of the test orders (artwork, proofs, quotes, transfer slips) → the backup folder
['orders', 'jobs', 'quotes', 'payments'].forEach(d => { const src = path.join(ROOT, 'private-files', d); if (fs.existsSync(src)) fs.renameSync(src, path.join(BK, d)); });

const db = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const before = { orders: (db.orders || []).length, jobs: (db.jobs || []).length, quotes: (db.quotes || []).length, customers: (db.customers || []).filter(c => c.type === 'customer').length };
// every order-flow record
['jobs', 'orders', 'quotes', 'customInvoices', 'notifications', 'emails', 'printerPayments', 'chats', 'topups', 'dailyReports', 'machineIncidents', 'audit'].forEach(k => { db[k] = []; });
db.sessions = {};
// test customer accounts made by the automated tests; the demo customer is reset to her own details
const isTest = c => (c.type === 'customer' && /@example\.(test|com)$/i.test(c.email || '')) || /^(newprep|dir)\d{10,}@printoka\.com$/i.test(c.email || ''); // + staff logins the automated tests created
const gone = new Set((db.customers || []).filter(isTest).map(c => c.id));
db.customers = (db.customers || []).filter(c => !gone.has(c.id));
db.customers.forEach(c => {
  if (c.type !== 'customer') return;
  c.creditBalance = 0; c.creditLedger = []; c.spend12mo = 0; c.tier = 'Standard';
  if (c.email === 'samantha@printoka.my') c.addresses = (c.addresses || []).filter(a => a.isDefault || /Kampung Luak/i.test(a.line1 || '')).slice(0, 1).map(a => Object.assign(a, { isDefault: true }));
});
db.coupons = (db.coupons || []).filter(cp => !cp.userId || !gone.has(cp.userId));
// running numbers start again
db.settings = db.settings || {}; db.settings.purchaseOrderNumber = 1001;
fs.writeFileSync(DATA, JSON.stringify(db, null, 2));
console.log('backup →', path.relative(ROOT, BK));
console.log('removed', before.orders, 'orders,', before.jobs, 'jobs,', before.quotes, 'quotes,', gone.size, 'test accounts');
console.log('kept', db.customers.length, 'accounts:', JSON.stringify(db.customers.reduce((m, c) => (m[c.type] = (m[c.type] || 0) + 1, m), {})));
