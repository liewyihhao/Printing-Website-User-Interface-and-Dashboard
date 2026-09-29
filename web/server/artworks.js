/*
 * Artwork Storage — each customer's own library of uploaded artworks (as on the original printoka.com
 * "Artwork Storage"). Files live OUTSIDE the public web folder (repo-root /private-files/artworks/<userId>/)
 * and are only streamed back to their owner or to staff. A stored artwork is picked for a cart job,
 * copied onto the order when it is placed, and stays in the library so the customer can reorder with it.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const store = require('./store');

const ROOT = path.join(__dirname, '..', '..', 'private-files', 'artworks');
const now = () => new Date().toISOString();
const EXT = { pdf: 1, ai: 1, eps: 1, psd: 1, tif: 1, tiff: 1, jpg: 1, jpeg: 1, png: 1, svg: 1, cdr: 1, indd: 1, zip: 1, rar: 1 };
const MIME = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml', tif: 'image/tiff', tiff: 'image/tiff', zip: 'application/zip' };
const MAX_MB = 60;
const safe = n => String(n || 'file').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 120) || 'file';

function all() { const db = store.load(); if (!db.artworks) db.artworks = []; return db.artworks; }
const isStaff = me => me && me.type !== 'customer' && me.type !== 'vendor' && me.type !== 'hub';
const view = a => ({ id: a.id, name: a.name, size: a.size, at: a.at, thumb: a.thumb || null, ext: (a.name.split('.').pop() || '').toLowerCase() });

function list(me) {
  if (!me) return { error: 'Please sign in.' };
  return { artworks: all().filter(a => a.userId === me.id).sort((x, y) => (y.at || '').localeCompare(x.at || '')).map(view) };
}
// b = { name, data: 'data:…;base64,…', thumb?: small 'data:image/jpeg;base64,…' preview made in the browser }
function save(me, b) {
  if (!me) return { error: 'Please sign in to upload artwork.' };
  const name = safe(b.name); const ext = (name.split('.').pop() || '').toLowerCase();
  if (!EXT[ext]) return { error: 'Artwork must be PDF, AI, EPS, PSD, TIFF, JPG, PNG, SVG, CDR, INDD, ZIP or RAR.' };
  const m = String(b.data || '').match(/^data:[^;]*;base64,(.+)$/); if (!m) return { error: 'No file received.' };
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length > MAX_MB * 1024 * 1024) return { error: 'File is larger than ' + MAX_MB + ' MB.' };
  const thumb = /^data:image\/(jpeg|png|webp);base64,/.test(String(b.thumb || '')) && String(b.thumb).length < 400000 ? String(b.thumb) : null;
  const id = 'A' + crypto.randomBytes(6).toString('hex').toUpperCase();
  const dir = path.join(ROOT, safe(me.id)); fs.mkdirSync(dir, { recursive: true });
  const stored = id + '-' + name; fs.writeFileSync(path.join(dir, stored), buf);
  const rec = { id, userId: me.id, name, stored, size: buf.length, at: now(), thumb };
  all().push(rec);
  store.logEvent({ actor: me.name || me.email, role: me.type, action: 'artwork_store', jobId: null, from: null, to: null, note: name + ' (' + Math.round(buf.length / 1024) + ' KB)' });
  store.save();
  return { artwork: view(rec) };
}
function remove(me, ids) {
  if (!me) return { error: 'Please sign in.' };
  const want = {}; (Array.isArray(ids) ? ids : [ids]).forEach(i => { want[i] = 1; });
  // an order already placed keeps its own copy of the file, so the library copy can go for good
  const lib = all(); let n = 0;
  for (let i = lib.length - 1; i >= 0; i--) {
    const a = lib[i]; if (!want[a.id] || a.userId !== me.id) continue;
    try { fs.unlinkSync(path.join(ROOT, safe(a.userId), a.stored)); } catch (e) {}
    lib.splice(i, 1); n++;
  }
  store.save();
  return Object.assign({ removed: n }, list(me));
}
function read(me, id) {
  const a = all().find(x => x.id === id); if (!a) return { error: 'File not found.', code: 404 };
  if (!me || (a.userId !== me.id && !isStaff(me))) return { error: 'Not allowed.', code: 403 };
  const p = path.join(ROOT, safe(a.userId), a.stored); if (!p.startsWith(ROOT) || !fs.existsSync(p)) return { error: 'File missing on disk.', code: 404 };
  return { file: a, data: fs.readFileSync(p), type: MIME[(a.name.split('.').pop() || '').toLowerCase()] || 'application/octet-stream' };
}
// an order was just placed: copy each job's chosen library artworks onto the order (per line), which also
// points the production job at the file. refs per line = [{ id }] in the order the customer set them.
function attachToOrder(oid, lines, me) {
  const files = require('./files');
  (lines || []).forEach((refs, i) => (refs || []).forEach(ref => {
    const r = read(me, ref && ref.id); if (r.error) return;
    files.saveFile(oid, { kind: 'artwork', name: r.file.name, line: i + 1, data: 'data:' + r.type + ';base64,' + r.data.toString('base64'), fromLibrary: r.file.id }, me);
  }));
}
// an artwork uploaded straight onto an order (e.g. from the dashboard) is kept in the library too
function keepCopy(me, name, buf) {
  if (!me || me.type !== 'customer') return;
  try { save(me, { name, data: 'data:application/octet-stream;base64,' + buf.toString('base64') }); } catch (e) {}
}
module.exports = { list, save, remove, read, attachToOrder, keepCopy };
