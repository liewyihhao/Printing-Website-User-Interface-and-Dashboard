/*
 * Renumber existing orders to the 8-character format (user, 2026-09-30).
 * PO-2026-35574 → e.g. K7M2Q9XA, and each job J-35574-1 → K7M2Q9XA-1. Every mention in the data file is
 * replaced (orders, jobs, notifications, emails, wallet ledger, audit, quotes, payables…), the order's file
 * folder in private-files/orders is renamed, and the new codes go into the code register so they never repeat.
 *
 * Run with the server STOPPED:   node web/server/renumber-orders.js
 * Back up first (data.json + private-files/orders).  Orders already in the new format are left alone.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA = path.join(__dirname, 'data.json');
const FILES = path.join(__dirname, '..', '..', 'private-files', 'orders');
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // same alphabet as store.js (no O/0, I/1)

const db = JSON.parse(fs.readFileSync(DATA, 'utf8'));
db.codeRegistry = db.codeRegistry || {};
const taken = c => db.codeRegistry[c] || (db.orders || []).some(o => o.id === c) || (db.quotes || []).some(q => String(q.id).replace(/^Q-?/, '') === c) || (db.jobs || []).some(j => String(j.id).split('-')[0] === c);
const newCode = () => { for (;;) { let c = ''; const b = crypto.randomBytes(8); for (let i = 0; i < 8; i++) c += CHARS[b[i] % CHARS.length]; if (/[A-Z]/.test(c) && /[0-9]/.test(c) && !taken(c)) { db.codeRegistry[c] = new Date().toISOString(); return c; } } };

// old → new, for every order not yet in the new format and each of its jobs
const map = [];
(db.orders || []).forEach(o => {
  if (/^[A-Z0-9]{8}$/.test(o.id)) return;
  const code = newCode();
  map.push([o.id, code]);
  (o.jobIds || []).forEach(jid => { const line = String(jid).split('-').pop(); map.push([jid, code + '-' + line]); map.push(['LBL-' + jid, 'LBL-' + code + '-' + line]); });
});
if (!map.length) { console.log('Nothing to renumber — every order already uses the new format.'); process.exit(0); }

// replace each old number wherever it appears in the data (as a whole token, never inside a longer number)
let text = JSON.stringify(db);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
map.sort((a, b) => b[0].length - a[0].length).forEach(([from, to]) => {
  const re = new RegExp('(?<![A-Za-z0-9-])' + esc(from) + '(?![0-9A-Za-z])', 'g');
  text = text.replace(re, to);
});
const out = JSON.parse(text);
fs.writeFileSync(DATA, JSON.stringify(out, null, 2));

// rename the orders' file folders
map.filter(([from]) => !/^J-/.test(from)).forEach(([from, to]) => {
  const a = path.join(FILES, from), b = path.join(FILES, to);
  if (fs.existsSync(a)) fs.renameSync(a, b);
});
map.forEach(([from, to]) => console.log(from.padEnd(16), '→', to));
