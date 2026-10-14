'use strict';
// Verify passwords carried over from the old WordPress site, so a migrated customer can sign in with the password they
// already have. Once one verifies, store.js re-hashes it into scrypt and drops the WordPress hash.
//   $wp$2y$…  WordPress 6.8+: bcrypt over base64(HMAC-SHA384(password, 'wp-sha384'))
//   $2y$/$2a$/$2b$…  plain bcrypt (plugins, older password_hash)
//   $P$… / $H$…  phpass portable hashes (WordPress before 6.8)
//   32 hex chars  very old plain MD5 (WordPress converts these on first login too)
// No dependencies: bcrypt is implemented here; its Blowfish tables are the hex digits of pi, computed once on first use.
const crypto = require('crypto');

let P0 = null, S0 = null;
function tables() {
  if (P0) return;
  // 18 + 1024 words of pi's fractional hex digits; Machin: pi = 16 atan(1/5) - 4 atan(1/239), in fixed point
  const WORDS = 18 + 1024, BITS = BigInt(WORDS * 32 + 128), ONE = 1n << BITS;
  const atanInv = x => { const X = BigInt(x), X2 = X * X; let term = ONE / X, sum = term, k = 1n, sign = -1n;
    while (term) { term /= X2; const t = term / (2n * k + 1n); if (!t) break; sum += sign * t; sign = -sign; k++; } return sum; };
  const pi = 16n * atanInv(5) - 4n * atanInv(239);
  const frac = (pi % ONE) >> 128n, words = new Uint32Array(WORDS);
  for (let i = 0; i < WORDS; i++) words[i] = Number((frac >> BigInt((WORDS - 1 - i) * 32)) & 0xffffffffn);
  if (words[0] !== 0x243f6a88 || words[18] !== 0xd1310ba6 || words[WORDS - 1] !== 0x3ac372e6) throw new Error('wppass: Blowfish tables failed their check');
  P0 = words.slice(0, 18); S0 = words.slice(18);
}

const B64 = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function b64enc(bytes, n) {
  let out = '', i = 0;
  while (i < n) {
    let c1 = bytes[i++]; out += B64[c1 >> 2]; c1 = (c1 & 3) << 4;
    if (i >= n) { out += B64[c1]; break; }
    let c2 = bytes[i++]; c1 |= c2 >> 4; out += B64[c1]; c1 = (c2 & 15) << 2;
    if (i >= n) { out += B64[c1]; break; }
    c2 = bytes[i++]; c1 |= c2 >> 6; out += B64[c1] + B64[c2 & 63];
  }
  return out;
}
function b64dec(s, n) {
  const v = c => B64.indexOf(c), out = []; let i = 0;
  while (out.length < n && i < s.length - 1) {
    const c1 = v(s[i++]), c2 = v(s[i++]); if (c1 < 0 || c2 < 0) return null;
    out.push(((c1 << 2) | ((c2 & 48) >> 4)) & 255); if (out.length >= n || i >= s.length) break;
    const c3 = v(s[i++]); if (c3 < 0) return null;
    out.push((((c2 & 15) << 4) | ((c3 & 60) >> 2)) & 255); if (out.length >= n || i >= s.length) break;
    const c4 = v(s[i++]); if (c4 < 0) return null;
    out.push((((c3 & 3) << 6) | c4) & 255);
  }
  return out.length === n ? Buffer.from(out) : null;
}

function bcryptRaw(keyBytes, salt, cost) {
  tables();
  const P = P0.slice(), S = S0.slice();
  const F = x => ((((S[x >>> 24] + S[256 | ((x >>> 16) & 255)]) >>> 0) ^ S[512 | ((x >>> 8) & 255)]) + S[768 | (x & 255)]) >>> 0;
  const lr = [0, 0];
  const enc = () => { let L = lr[0], R = lr[1];
    for (let i = 0; i < 16; i += 2) { L = (L ^ P[i]) >>> 0; R = (R ^ F(L)) >>> 0; R = (R ^ P[i + 1]) >>> 0; L = (L ^ F(R)) >>> 0; }
    lr[0] = (R ^ P[17]) >>> 0; lr[1] = (L ^ P[16]) >>> 0; };
  const stream = data => { let off = 0; return () => { let w = 0; for (let i = 0; i < 4; i++) { w = ((w << 8) | data[off]) >>> 0; off = (off + 1) % data.length; } return w; }; };
  const expand = (key, saltData) => {
    const k = stream(key); for (let i = 0; i < 18; i++) P[i] = (P[i] ^ k()) >>> 0;
    const s = saltData ? stream(saltData) : null; lr[0] = lr[1] = 0;
    for (let i = 0; i < 18; i += 2) { if (s) { lr[0] ^= s(); lr[1] ^= s(); } enc(); P[i] = lr[0]; P[i + 1] = lr[1]; }
    for (let i = 0; i < 1024; i += 2) { if (s) { lr[0] ^= s(); lr[1] ^= s(); } enc(); S[i] = lr[0]; S[i + 1] = lr[1]; }
  };
  expand(keyBytes, salt);
  for (let r = 0, n = 2 ** cost; r < n; r++) { expand(keyBytes, null); expand(salt, null); }
  const ct = Buffer.from('OrpheanBeholderScryDoubt', 'latin1'), w = [];
  for (let i = 0; i < 6; i++) w.push(ct.readUInt32BE(i * 4));
  for (let r = 0; r < 64; r++) for (let j = 0; j < 6; j += 2) { lr[0] = w[j]; lr[1] = w[j + 1]; enc(); w[j] = lr[0]; w[j + 1] = lr[1]; }
  const out = Buffer.alloc(24); w.forEach((x, i) => out.writeUInt32BE(x >>> 0, i * 4));
  return out.subarray(0, 23);
}

const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

function bcryptCheck(pw, hash) {
  const m = /^\$2([abxy])\$(\d\d)\$([./A-Za-z0-9]{22})([./A-Za-z0-9]{31})$/.exec(hash || '');
  if (!m || m[1] === 'x') return false;              // $2x$ (the old sign-extension bug) is not supported
  const cost = +m[2]; if (cost < 4 || cost > 31) return false;
  const salt = b64dec(m[3], 16); if (!salt) return false;
  let key = Buffer.from(String(pw), 'utf8');
  key = Buffer.concat([key, Buffer.from([0])]).subarray(0, 72);
  return same(b64enc(bcryptRaw(key, salt, cost), 23), m[4]);
}

const ITOA = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function phpassEncode(input, count) {
  let out = '', i = 0;
  do {
    let v = input[i++]; out += ITOA[v & 63];
    if (i < count) v |= input[i] << 8; out += ITOA[(v >> 6) & 63]; if (i++ >= count) break;
    if (i < count) v |= input[i] << 16; out += ITOA[(v >> 12) & 63]; if (i++ >= count) break;
    out += ITOA[(v >> 18) & 63];
  } while (i < count);
  return out;
}
function phpassCheck(pw, hash) {
  if (!/^\$[PH]\$/.test(hash || '') || hash.length !== 34) return false;
  const log2 = ITOA.indexOf(hash[3]); if (log2 < 7 || log2 > 30) return false;
  const salt = hash.substr(4, 8), p = Buffer.from(String(pw), 'utf8'), md5 = b => crypto.createHash('md5').update(b).digest();
  let h = md5(Buffer.concat([Buffer.from(salt, 'latin1'), p]));
  for (let n = 1 << log2; n > 0; n--) h = md5(Buffer.concat([h, p]));
  return same(hash.substr(0, 12) + phpassEncode(h, 16), hash);
}

// true when pw matches a WordPress-era hash
function verify(pw, hash) {
  hash = String(hash || '');
  if (!pw || !hash) return false;
  try {
    if (hash.startsWith('$wp$2')) return bcryptCheck(crypto.createHmac('sha384', 'wp-sha384').update(String(pw), 'utf8').digest('base64'), hash.slice(3));
    if (hash.startsWith('$2')) return bcryptCheck(pw, hash);
    if (hash.startsWith('$P$') || hash.startsWith('$H$')) return phpassCheck(pw, hash);
    if (/^[a-f0-9]{32}$/i.test(hash)) return same(crypto.createHash('md5').update(String(pw), 'utf8').digest('hex'), hash.toLowerCase());
  } catch (e) { return false; }
  return false;
}

module.exports = { verify, bcryptCheck, phpassCheck };
