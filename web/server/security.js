/*
 * Security helpers for the Printoka server: response headers, request limits, sign-in rate limits,
 * the password rule, who may read an order (and how much of it), and upload type checks.
 * See the security plan (Printoka Security Plan artifact, 9 Oct 2026).
 */
const crypto = require('crypto');
const store = require('./store');

// ---------- response headers ----------
const isProd = () => process.env.NODE_ENV === 'production';
function baseHeaders(req) {
  const h = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  };
  const proto = String((req && req.headers['x-forwarded-proto']) || '').split(',')[0].trim();
  if (proto === 'https' || isProd()) h['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  return h;
}
// Content-Security-Policy for an HTML page: inline scripts are allowed only by their exact hash
const CSP_CACHE = new Map();
function cspFor(html) {
  const key = html.length + ':' + crypto.createHash('sha1').update(html).digest('hex');
  if (CSP_CACHE.has(key)) return CSP_CACHE.get(key);
  const hashes = [];
  const re = /<script(?![^>]*\bsrc=)(?![^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi; let m;
  // the HTML parser turns CRLF into LF before the browser hashes an inline script, so hash the same text
  while ((m = re.exec(html))) hashes.push("'sha256-" + crypto.createHash('sha256').update(m[1].replace(/\r\n?/g, '\n'), 'utf8').digest('base64') + "'");
  const cdn = 'https://cdnjs.cloudflare.com https://cdn.jsdelivr.net';
  const csp = [
    "default-src 'self'",
    "script-src 'self' " + cdn + (hashes.length ? ' ' + hashes.join(' ') : ''),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' " + cdn,
    "worker-src 'self' blob: " + cdn,
    "frame-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://payment.ipay88.com.my https://checkout.stripe.com",
    "frame-ancestors 'none'",
  ].join('; ');
  if (CSP_CACHE.size > 500) CSP_CACHE.clear();
  CSP_CACHE.set(key, csp); return csp;
}

// ---------- request body limits ----------
const LIMIT_JSON = 1024 * 1024;              // 1 MB for ordinary API calls
const LIMIT_UPLOAD = 90 * 1024 * 1024;       // base64 file uploads (60 MB file ≈ 80 MB encoded)
// signed-in accounts may send file uploads (base64 in JSON); anyone else is held to 1 MB
function bodyLimit(req) { const t = req.headers['x-token']; return t && store.sessionCustomer(t) ? LIMIT_UPLOAD : LIMIT_JSON; }
function readRaw(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { if (size < 0) return; size += c.length; if (size > limit) { size = -1; chunks.length = 0; const e = new Error('Request too large'); e.status = 413; req.resume(); reject(e); return; } chunks.push(c); });   // drain and discard the rest; the 413 is still sent
    req.on('end', () => { if (size >= 0) resolve(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', reject);
  });
}

// ---------- sign-in rate limits (in memory; per account and per IP) ----------
const FAILS = new Map();
const WINDOW = 15 * 60 * 1000;
function hit(key, max) { const n = Date.now(), r = FAILS.get(key); if (!r || n - r.t > WINDOW) { FAILS.set(key, { t: n, c: 1 }); return 1 > max; } r.c++; return r.c > max; }
function blocked(key, max) { const r = FAILS.get(key); return !!(r && Date.now() - r.t <= WINDOW && r.c >= max); }
function clientIp(req) { return String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '').split(',')[0].trim(); }
function loginBlocked(req, email) { return blocked('ip:' + clientIp(req), 30) || blocked('acct:' + email, 6); }
function loginFailed(req, email) { hit('ip:' + clientIp(req), 30); hit('acct:' + email, 6); }
function loginOk(email) { FAILS.delete('acct:' + email); }
// any other endpoint that could be abused (password reset, register, chat): a simple per-IP budget
function tooMany(req, bucket, max) { return hit(bucket + ':' + clientIp(req), max); }

// ---------- password rule ----------
const COMMON = new Set(('123456 123456789 12345678 password qwerty123 qwerty 1234567890 1234567 111111 123123 abc123 password1 iloveyou ' +
  '000000 1q2w3e4r 654321 666666 987654321 123321 qwertyuiop 1qaz2wsx password123 12345678910 admin123 welcome1 ' +
  'printoka printoka123 printoka2026 malaysia sayang123 abcd1234 aa123456 p@ssw0rd passw0rd letmein123 changeme').split(' '));
function passwordProblem(pw, email) {
  const p = String(pw || '');
  if (p.length < 10) return 'Use at least 10 characters for your password.';
  if (p.length > 200) return 'That password is too long.';
  if (COMMON.has(p.toLowerCase())) return 'That password is too common. Please choose another.';
  const local = String(email || '').split('@')[0].toLowerCase();
  if (local.length >= 4 && p.toLowerCase().indexOf(local) >= 0) return 'Your password should not contain your email name.';
  return null;
}

// ---------- who may read an order, and how much ----------
// 'full' (customer owner, outlet of the order, production, admin) · 'spec' (printer awarded a job) · 'ship' (hub routing a job) · null
function orderAccess(o, me) {
  if (!o || !me) return null;
  if (me.type === 'admin' || me.type === 'production') return 'full';
  if (me.type === 'customer') return o.userId && o.userId === me.id ? 'full' : null;
  if (me.type === 'outlet') { try { return require('./outlet').outletOrders(me).some(x => x.id === o.id) ? 'full' : null; } catch (e) { return null; } }
  const jobs = (o.jobIds || []).map(id => store.job(id)).filter(Boolean);
  if (me.type === 'vendor') { const co = me.vendorId || me.id; return jobs.some(j => j.outsource && j.outsource.awardedTo === co) ? 'spec' : null; }
  if (me.type === 'hub') return jobs.some(j => j.hub && (!me.hub || j.hub === me.hub)) ? 'ship' : null;
  return null;
}
// a printer sees the job spec, never the customer; a hub sees where to ship, never prices or files
function orderForAccess(v, level, me) {
  if (level === 'full') return v;
  const jobsOf = me && me.type === 'vendor' ? (v.jobs || []).filter(j => j.outsource && j.outsource.awardedTo === (me.vendorId || me.id)) : (v.jobs || []);
  if (level === 'spec') return { id: v.id, createdAt: v.createdAt, status: v.status, items: (v.items || []).map(it => ({ lineNo: it.lineNo, product: it.product, spec: it.spec, specLines: it.specLines, qty: it.qty, productionTime: it.productionTime })),
    jobs: jobsOf.map(j => ({ id: j.id, product: j.product, spec: j.spec, specLines: j.specLines, qty: j.qty, status: j.status, deadline: j.deadline })) };
  if (level === 'ship') return { id: v.id, createdAt: v.createdAt, status: v.status, customer: { name: (v.customer || {}).name || '' }, shipTo: v.shipTo || null, fulfillment: v.fulfillment || null,
    jobs: jobsOf.filter(j => j.hub && (!me.hub || j.hub === me.hub)).map(j => ({ id: j.id, product: j.product, qty: j.qty, status: j.status, parcels: j.parcels || 1 })) };
  return null;
}
// order-number tracking without signing in: progress only, nothing personal
function publicTracking(v) {
  return { id: v.id, createdAt: v.createdAt, status: v.status, tracking: true, payment: { status: (v.payment || {}).status === 'validated' ? 'validated' : 'pending' },
    items: (v.items || []).map(it => ({ lineNo: it.lineNo, product: it.product, qty: it.qty })),
    jobs: (v.jobs || []).map(j => ({ id: j.id, product: j.product, qty: j.qty, status: j.status, statusLabel: j.statusLabel })) };
}

// ---------- uploads: check the real file type from its first bytes ----------
function sniff(buf) {
  const b = buf.slice(0, 16), s = b.toString('latin1');
  if (s.startsWith('%PDF')) return 'pdf';
  if (b[0] === 0x89 && s.slice(1, 4) === 'PNG') return 'png';
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpg';
  if (s.startsWith('GIF8')) return 'gif';
  if (s.startsWith('RIFF') && buf.slice(8, 12).toString('latin1') === 'WEBP') return 'webp';
  if (s.startsWith('II*\u0000') || s.startsWith('MM\u0000*')) return 'tif';
  if (s.startsWith('PK\u0003\u0004')) return 'zip';
  if (s.startsWith('Rar!')) return 'rar';           // also .indd packages, .ai (some), office files
  if (s.startsWith('8BPS')) return 'psd';
  if (s.startsWith('%!PS') || (b[0] === 0xc5 && b[1] === 0xd0 && b[2] === 0xd3 && b[3] === 0xc6)) return 'eps';
  if (s.startsWith('RIFF') && buf.slice(8, 12).toString('latin1').toUpperCase().indexOf('CDR') === 0) return 'cdr';
  if (buf.slice(24, 40).toString('latin1').indexOf('ftypheic') >= 0 || buf.slice(4, 12).toString('latin1').indexOf('ftyphei') >= 0 || buf.slice(4, 12).toString('latin1').indexOf('ftypmif1') >= 0) return 'heic';
  if (b[0] === 0x06 && b[1] === 0x06 && b[2] === 0xed && b[3] === 0xf5) return 'indd';
  const head = buf.slice(0, 512).toString('utf8').trim().toLowerCase();
  if (head.startsWith('<?xml') || head.startsWith('<svg')) return 'svg';
  return null;
}
// the extensions each real type may arrive under
const ACCEPTS = { pdf: ['pdf', 'ai'], png: ['png'], jpg: ['jpg', 'jpeg'], gif: ['gif'], webp: ['webp'], tif: ['tif', 'tiff'], zip: ['zip', 'indd', 'ai'], psd: ['psd'], eps: ['eps', 'ai'], cdr: ['cdr'], heic: ['heic'], indd: ['indd'], svg: ['svg'], rar: ['rar'] };
function fileTypeProblem(buf, ext) {
  const t = sniff(buf); ext = String(ext || '').toLowerCase();
  if (!t) return 'We could not recognise this file. Please upload a PDF, AI, EPS, PSD, TIFF, JPG, PNG, SVG, CDR, INDD or ZIP.';
  if ((ACCEPTS[t] || []).indexOf(ext) < 0) return 'This file is not really a .' + ext + ' file. Please check it and upload again.';
  if (t === 'svg' && /<script|on[a-z]+\s*=|javascript:|<foreignobject/i.test(buf.toString('utf8'))) return 'This SVG contains scripts. Please export a plain SVG or a PDF.';
  return null;
}
// headers for streaming a stored file: never run it in our origin
function fileHeaders(name, type, size, wantDownload) {
  const ext = String(name || '').split('.').pop().toLowerCase();
  const inlineOk = !wantDownload && { pdf: 1, jpg: 1, jpeg: 1, png: 1, webp: 1, gif: 1 }[ext];
  return {
    'Content-Type': type || 'application/octet-stream', 'Content-Length': size,
    'Content-Disposition': (inlineOk ? 'inline' : 'attachment') + '; filename="' + String(name || 'file').replace(/["\r\n]/g, '') + '"',
    'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'",
  };
}

module.exports = { baseHeaders, cspFor, bodyLimit, readRaw, loginBlocked, loginFailed, loginOk, tooMany, clientIp, passwordProblem, orderAccess, orderForAccess, publicTracking, sniff, fileTypeProblem, fileHeaders, isProd };

// ---------- two-step sign-in: authenticator-app codes (TOTP, RFC 6238: SHA-1, 6 digits, 30 s) ----------
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32encode(buf) { let bits = 0, val = 0, out = ''; for (const b of buf) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } } if (bits > 0) out += B32[(val << (5 - bits)) & 31]; return out; }
function b32decode(s) { const c = String(s || '').toUpperCase().replace(/[^A-Z2-7]/g, ''); let bits = 0, val = 0; const out = []; for (const ch of c) { val = (val << 5) | B32.indexOf(ch); bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } } return Buffer.from(out); }
function hotp(key, counter) {
  const msg = Buffer.alloc(8); msg.writeUInt32BE(Math.floor(counter / 0x100000000), 0); msg.writeUInt32BE(counter >>> 0, 4);
  const h = crypto.createHmac('sha1', key).update(msg).digest(), o = h[h.length - 1] & 15;
  return String(((h.readUInt32BE(o) & 0x7fffffff) % 1000000)).padStart(6, '0');
}
function totpNewSecret() { return b32encode(crypto.randomBytes(20)); }
// returns the matched time step (so a code cannot be used twice) or -1
function totpCheck(secret, code, lastStep) {
  const c = String(code || '').replace(/\s/g, ''); if (!/^\d{6}$/.test(c) || !secret) return -1;
  const key = b32decode(secret), step = Math.floor(Date.now() / 30000);
  for (const d of [0, -1, 1]) { const s = step + d; if (lastStep != null && s <= lastStep) continue; const h = hotp(key, s); if (h.length === c.length && crypto.timingSafeEqual(Buffer.from(h), Buffer.from(c))) return s; }
  return -1;
}
function totpUri(secret, email) { return 'otpauth://totp/' + encodeURIComponent('Printoka:' + email) + '?secret=' + secret + '&issuer=Printoka&digits=6&period=30'; }
// staff, printers and hubs must use two-step sign-in on the live site (or wherever PRINTOKA_REQUIRE_2FA=1)
function require2fa(me) {
  const on = process.env.PRINTOKA_REQUIRE_2FA === '1' || (process.env.PRINTOKA_REQUIRE_2FA !== '0' && isProd());
  return on && me && me.type !== 'customer';
}
module.exports.totpNewSecret = totpNewSecret; module.exports.totpCheck = totpCheck; module.exports.totpUri = totpUri; module.exports.require2fa = require2fa;
