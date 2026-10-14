// Encrypted backups of the data store (security plan: daily encrypted backups, monthly restore test).
//
//   node web/server/backup.js now                 write one backup now
//   node web/server/backup.js verify <file>       decrypt in memory and check it is a readable store (the restore test)
//   node web/server/backup.js restore <file> <out> decrypt to <out> (never over the live store unless --force)
//
// Environment:
//   PRINTOKA_BACKUP_KEY   64 hex characters (32 bytes). Keep it in the host's secret manager, never in the repository.
//   PRINTOKA_BACKUP_DIR   where backups go (default: <repo>/backups, which git ignores). Put it on separate storage.
//   PRINTOKA_BACKUP_KEEP  how many to keep (default 30)
//   PRINTOKA_DATA         the store to back up (same variable the server uses)
//
// Format: "PKB1" + 12-byte IV + 16-byte GCM tag + AES-256-GCM(gzip(data.json)). The server writes one at start-up and
// every 24 hours when PRINTOKA_BACKUP_KEY is set. Uploaded order files (private-files/) are not included: they belong
// in the private file bucket, which has its own versioning.
const fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');

const DATA_FILE = process.env.PRINTOKA_DATA || path.join(__dirname, 'data.json');
const DIR = process.env.PRINTOKA_BACKUP_DIR || path.join(__dirname, '..', '..', 'backups');
const KEEP = Math.max(1, parseInt(process.env.PRINTOKA_BACKUP_KEEP || '30', 10) || 30);
const MAGIC = Buffer.from('PKB1');

function key() {
  const k = String(process.env.PRINTOKA_BACKUP_KEY || '');
  if (!/^[0-9a-fA-F]{64}$/.test(k)) throw new Error('PRINTOKA_BACKUP_KEY must be 64 hex characters (32 bytes).');
  return Buffer.from(k, 'hex');
}
function encrypt(plain) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([c.update(zlib.gzipSync(plain)), c.final()]);
  return Buffer.concat([MAGIC, iv, c.getAuthTag(), body]);
}
function decrypt(buf) {
  if (!buf.slice(0, 4).equals(MAGIC)) throw new Error('Not a Printoka backup file.');
  const iv = buf.slice(4, 16), tag = buf.slice(16, 32), d = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  d.setAuthTag(tag);
  return zlib.gunzipSync(Buffer.concat([d.update(buf.slice(32)), d.final()]));   // throws if the file was altered or the key is wrong
}
function stamp(t) { return t.toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-'); }

function backupNow() {
  const plain = fs.readFileSync(DATA_FILE);
  JSON.parse(plain.toString('utf8'));                       // never back up a broken store
  fs.mkdirSync(DIR, { recursive: true });
  const file = path.join(DIR, 'printoka-' + stamp(new Date()) + '.pkb');
  fs.writeFileSync(file + '.tmp', encrypt(plain), { mode: 0o600 });
  fs.renameSync(file + '.tmp', file);
  const old = fs.readdirSync(DIR).filter(f => /^printoka-\d{8}-\d{6}\.pkb$/.test(f)).sort();
  old.slice(0, Math.max(0, old.length - KEEP)).forEach(f => { try { fs.unlinkSync(path.join(DIR, f)); } catch (e) {} });
  return file;
}
function verify(file) {
  const db = JSON.parse(decrypt(fs.readFileSync(file)).toString('utf8'));
  const n = k => Array.isArray(db[k]) ? db[k].length : 0;
  return { file, orders: n('orders'), jobs: n('jobs'), accounts: n('customers'), quotes: n('quotes') };
}
function restore(file, out, force) {
  const target = path.resolve(out);
  if (!force && target === path.resolve(DATA_FILE)) throw new Error('Refusing to overwrite the live store; add --force after stopping the server.');
  const plain = decrypt(fs.readFileSync(file)); JSON.parse(plain.toString('utf8'));
  fs.writeFileSync(target, plain, { mode: 0o600 });
  return target;
}
// called by the server: one backup now, then every 24 hours (only when a key is configured)
function schedule(log) {
  if (!process.env.PRINTOKA_BACKUP_KEY) return false;
  const run = () => { try { const f = backupNow(); log && log('backup written: ' + path.basename(f)); } catch (e) { log && log('BACKUP FAILED: ' + e.message); } };
  run(); setInterval(run, 24 * 3600 * 1000).unref();
  return true;
}
module.exports = { backupNow, verify, restore, schedule, encrypt, decrypt };

if (require.main === module) {
  const [cmd, a, b] = process.argv.slice(2);
  try {
    if (cmd === 'now') console.log('wrote', backupNow());
    else if (cmd === 'verify') console.log(verify(a));
    else if (cmd === 'restore') console.log('restored to', restore(a, b, process.argv.includes('--force')));
    else { console.log('usage: node backup.js now | verify <file> | restore <file> <out> [--force]'); process.exit(1); }
  } catch (e) { console.error(e.message); process.exit(1); }
}
