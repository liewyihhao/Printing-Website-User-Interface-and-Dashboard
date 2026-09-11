/*
 * Content subsystem — blog/Learning Hub, programmatic SEO landing pages, and the
 * sitemap. Migrated from the live printoka.com WordPress site (Rank Math sitemaps
 * gave the full URL inventory; blog bodies fetched from the live articles).
 * Dependency-free: reads the JSON in web/content/.
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'content');
function readJson(name, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(DIR, name), 'utf8')); } catch (e) { return fallback; }
}
let _blog = null, _seo = null, _faq = null, _downloads = null;
function blog() { if (!_blog) _blog = readJson('blog.json', []); return _blog; }
function seo() { if (!_seo) _seo = readJson('seo-data.json', []); return _seo; }
function faqList() { if (!_faq) _faq = readJson('faq.json', []); return _faq; }
function downloadsList() { if (!_downloads) _downloads = readJson('downloads.json', []); return _downloads; }
// media library — the image assets shipped with the app (product photos + brand icons)
function mediaList() {
  const A = path.join(__dirname, '..', 'assets');
  const scan = (sub, kind) => { try { return fs.readdirSync(path.join(A, sub)).filter(f => /\.(jpg|jpeg|png|svg|webp|gif)$/i.test(f)).map(f => ({ file: 'assets/' + sub + '/' + f, name: f, kind, ext: f.split('.').pop().toLowerCase() })); } catch (e) { return []; } };
  return scan('products', 'Product image').concat(scan('icons', 'Icon / UI'));
}

// Learning Hub list — no body, adds a bodyReady flag so the UI can show which are live.
function blogList() {
  return blog().map(p => ({ slug: p.slug, title: p.title, date: p.date, tag: p.tag, excerpt: p.excerpt, url: p.url, bodyReady: !!p.body }));
}
function blogPost(slug) { return blog().find(p => p.slug === slug) || null; }

function seoList(locale) {
  const all = seo();
  return locale ? all.filter(p => p.locale === locale) : all;
}
function seoPage(slug, locale) {
  return seo().find(p => p.slug === slug && (!locale || p.locale === locale)) || seo().find(p => p.slug === slug) || null;
}

// Full XML sitemap — blog + SEO landing pages + the core storefront routes.
// Preserves the live URL structure for SEO continuity (audit §9).
function sitemapXml(origin) {
  const base = (origin || 'https://printoka.com').replace(/\/$/, '');
  const urls = [];
  ['/', '/blog/', '/about-us/', '/products/'].forEach(u => urls.push(u));
  blog().forEach(p => urls.push(p.url));
  seo().forEach(p => urls.push(p.path));
  const body = urls.map(u => `  <url><loc>${base}${u}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

module.exports = { blogList, blogPost, seoList, seoPage, sitemapXml, faqList, downloadsList, mediaList };
