/*
 * Import the ORIGINAL printoka.com blog into the new site (user, 2026-09-29): the same articles and the same images.
 * For every post (post sitemap ∪ the blog index ∪ the slugs already in blog.json) it takes the title, date, categories,
 * hero image and the article HTML exactly as published, downloads every image into web/assets/blog/, and rewrites
 * links between posts to the new /blog/<slug>/ URLs. The table-of-contents widget and tracking scripts are dropped.
 * Run:  node web/content/import-blog.mjs      (Node 18+, sequential and polite: one request at a time)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, 'blog.json');
const IMG_DIR = path.join(__dirname, '..', 'assets', 'blog');
const ORIGIN = 'https://printoka.com';
const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (Printoka content migration)' } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const get = async u => { const r = await fetch(u, UA); if (!r.ok) throw new Error(r.status + ' ' + u); return r.text(); };
const decode = s => String(s || '').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, '’').replace(/&#8216;|&lsquo;/g, '‘').replace(/&#8220;|&ldquo;/g, '“').replace(/&#8221;|&rdquo;/g, '”').replace(/&#8211;|&ndash;/g, '–').replace(/&#8212;|&mdash;/g, '—').replace(/&nbsp;/g, ' ').replace(/&#038;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&hellip;|&#8230;/g, '…');
const strip = s => decode(String(s || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

// the article body: the blog-content div, balanced to its own closing tag
function contentBlock(html) {
  const at = html.search(/<div[^>]*class="[^"]*blog-content[^"]*"[^>]*>/i); if (at < 0) return '';
  const open = html.indexOf('>', at) + 1; let depth = 1, i = open; const re = /<(\/?)div\b[^>]*>/gi; re.lastIndex = open; let m;
  while ((m = re.exec(html))) { depth += m[1] ? -1 : 1; if (depth === 0) { i = m.index; break; } }
  return html.slice(open, i);
}
function dropBalanced(html, startRe) { // remove an element (by its opening tag) with its balanced children
  let s; while ((s = html.search(startRe)) >= 0) {
    const tag = html.slice(s).match(/^<(\w+)/)[1]; const re = new RegExp('<(/?)' + tag + '\\b[^>]*>', 'gi'); re.lastIndex = s; let depth = 0, m, end = html.length;
    while ((m = re.exec(html))) { depth += m[1] ? -1 : 1; if (depth === 0) { end = m.index + m[0].length; break; } }
    html = html.slice(0, s) + html.slice(end);
  }
  return html;
}
const images = new Map(); // remote url → local published path
function localImg(u) {
  if (!u) return u; let url = u.startsWith('//') ? 'https:' + u : u.startsWith('/') ? ORIGIN + u : u;
  if (!/^https?:\/\/(www\.)?printoka\.com\//i.test(url)) return u;
  url = url.split('?')[0]; const name = decodeURIComponent(url.split('/').pop()).replace(/[^A-Za-z0-9._-]+/g, '-');
  images.set(url, name); return '/assets/blog/' + name;
}
function cleanBody(html, slugs) {
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
  html = dropBalanced(html, /<div[^>]*id="ez-toc-container"/i);
  html = html.replace(/<span class="ez-toc-section(-end)?"[^>]*><\/span>/gi, '');
  // images: the real source (lazy-loaded ones keep it in data-src), local copy, no srcset
  html = html.replace(/<img\b[^>]*>/gi, tag => {
    const src = (tag.match(/\sdata-src="([^"]+)"/i) || tag.match(/\ssrc="([^"]+)"/i) || [])[1];
    const alt = decode((tag.match(/\salt="([^"]*)"/i) || [])[1] || '');
    const w = (tag.match(/\swidth="(\d+)"/i) || [])[1], hgt = (tag.match(/\sheight="(\d+)"/i) || [])[1];
    return src ? '<img src="' + localImg(src) + '" alt="' + alt.replace(/"/g, '&quot;') + '"' + (w ? ' width="' + w + '"' : '') + (hgt ? ' height="' + hgt + '"' : '') + ' loading="lazy">' : '';
  });
  // links between posts → the new /blog/<slug>/ URLs; other printoka.com links → same path on this site
  html = html.replace(/href="https?:\/\/(?:www\.)?printoka\.com(\/[^"]*)?"/gi, (_, p) => {
    const pth = (p || '/').split('#')[0]; const seg = pth.replace(/^\/(blog\/)?/, '').replace(/\/$/, '');
    if (slugs.has(seg)) return 'href="/blog/' + seg + '/"';
    return 'href="' + (p || '/') + '"';
  });
  html = html.replace(/\s(class|aria-label|rel|target|decoding|data-[\w-]+)="[^"]*"/gi, (m, a) => /^(target|rel)$/i.test(a) ? m : '');
  return html.replace(/<p>\s*(&nbsp;)?\s*<\/p>/gi, '').replace(/\n{3,}/g, '\n\n').trim();
}
function parsePost(html, slug, slugs) {
  const title = strip((html.match(/<h2[^>]*class="[^"]*title-with-line[^"]*"[^>]*>([\s\S]*?)<\/h2>/i) || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]);
  const meta = (html.match(/<div class="d-flex fs-14[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i) || [])[1] || '';
  const dm = strip(meta).match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})/i);
  const date = dm ? dm[3] + '-' + String(MONTHS[dm[2].toLowerCase().slice(0, 3)]).padStart(2, '0') + '-' + dm[1].padStart(2, '0') : null;
  const categories = Array.from(meta.matchAll(/\/blog\/category\/[^"]+"[^>]*>([^<]+)</gi)).map(m => decode(m[1]).trim());
  const cb = html.search(/<div[^>]*class="[^"]*blog-content/i);
  const before = cb > 0 ? html.slice(Math.max(0, cb - 3000), cb) : '';
  const heroTag = (before.match(/<img[^>]*>(?![\s\S]*<img)/i) || [])[0] || '';
  const heroSrc = (heroTag.match(/\sdata-src="([^"]+)"/i) || heroTag.match(/\ssrc="([^"]+)"/i) || [])[1];
  const body = cleanBody(contentBlock(html), slugs);
  const firstP = strip((body.match(/<p>([\s\S]*?)<\/p>/i) || [])[1]);
  return { slug, title, date, categories, tag: categories[0] || 'Printing Guides', hero: heroSrc ? localImg(heroSrc) : null, html: body,
    excerpt: firstP.length > 170 ? firstP.slice(0, 167).replace(/\s+\S*$/, '') + '…' : firstP, url: ORIGIN + '/blog/' + slug + '/' };
}

const existing = (() => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { return []; } })();
const slugs = new Set(existing.map(p => p.slug));
for (const sm of ['/post-sitemap.xml', '/post-sitemap1.xml']) {
  try { const x = await get(ORIGIN + sm); (x.match(/<loc>([^<]+)<\/loc>/g) || []).map(l => l.replace(/<\/?loc>/g, '')).forEach(u => { const m = u.match(/printoka\.com\/(?:blog\/)?([a-z0-9-]+)\/?$/i); if (m && m[1] !== 'blog') slugs.add(m[1]); }); console.log('sitemap', sm, 'ok'); break; } catch (e) { console.log('sitemap', sm, e.message); }
}
try { const idx = await get(ORIGIN + '/blog/'); (idx.match(/https:\/\/printoka\.com\/blog\/[a-z0-9-]+\//g) || []).forEach(u => { const s = u.split('/')[4]; if (s && s !== 'category' && s !== 'page') slugs.add(s); }); } catch (e) { console.log('index', e.message); }
console.log('posts to import:', slugs.size);

const out = [];
for (const slug of slugs) {
  try {
    const html = await get(ORIGIN + '/blog/' + slug + '/');
    const p = parsePost(html, slug, slugs);
    if (!p.title || !p.html) { console.log('skip (no article)', slug); continue; }
    const old = existing.find(x => x.slug === slug) || {};
    out.push(Object.assign({}, old, p, { date: p.date || old.date || null, body: null, status: old.status || 'publish' }));
    console.log('ok', slug, '·', p.date, '·', (p.html.match(/<img/g) || []).length, 'images');
  } catch (e) {
    // not on the old site (articles written for the new site): keep them as they are
    const old = existing.find(x => x.slug === slug); if (old) { out.push(old); console.log('kept (new-site article)', slug); } else console.log('fail', slug, e.message);
  }
  await sleep(400);
}
out.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
fs.mkdirSync(IMG_DIR, { recursive: true });
let got = 0;
for (const [url, name] of images) {
  const dest = path.join(IMG_DIR, name); if (fs.existsSync(dest)) { got++; continue; }
  try { const r = await fetch(url, UA); if (!r.ok) throw new Error(r.status); fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); got++; } catch (e) { console.log('image fail', url, e.message); }
  await sleep(150);
}
fs.writeFileSync(FILE, JSON.stringify(out, null, 2));
console.log('saved', out.length, 'posts ·', got + '/' + images.size, 'images in web/assets/blog');
