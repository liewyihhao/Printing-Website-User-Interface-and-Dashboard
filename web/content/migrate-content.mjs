/*
 * Migrates the FAQ (/support/) and Downloads (/download/<category>/) content
 * from the LIVE printoka.com into web/content/{faq.json,downloads.json}.
 * Re-runnable & idempotent (overwrites). Node global fetch — no deps.
 * Goal: replicate the original site's content EXACTLY (nothing lesser, nothing more).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const UA = { 'user-agent': 'Mozilla/5.0 (migration)' };
const get = async u => { const r = await fetch(u, { headers: UA }); if (!r.ok) throw new Error(u + ' -> ' + r.status); return r.text(); };
const stripSvg = s => s.replace(/<svg[\s\S]*?<\/svg>/gi, '');
const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#8211;/g, '–').replace(/&#8217;/g, '’').replace(/&#8216;/g, '‘').replace(/&#8220;/g, '“').replace(/&#8221;/g, '”');
const text = s => decode(String(s || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')).trim();

// ---------------- FAQ ----------------
async function migrateFaq() {
  const html = stripSvg(await get('https://printoka.com/support/'));
  const cats = [];
  const parts = html.split(/<div class="[^"]*\baccordion\b[^"]*"\s+id="/i).slice(1);
  for (const part of parts) {
    const id = part.slice(0, part.indexOf('"'));
    // block ends at the next accordion or a clear section close
    const block = part;
    const title = text((block.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i) || [])[1] || id.replace(/-/g, ' '));
    const qs = [];
    const qblocks = block.split(/<div class="card question">/i).slice(1);
    for (const qb of qblocks) {
      const q = text((qb.match(/<h6 class="card-header"[^>]*>([\s\S]*?)<\/h6>/i) || [])[1]);
      const a = text((qb.match(/<div class="card-body[^"]*">([\s\S]*?)<\/div>/i) || [])[1]);
      if (q) qs.push({ q, a });
    }
    if (qs.length) cats.push({ id, title, questions: qs });
  }
  return cats;
}

// ---------------- Downloads ----------------
async function downloadParents() {
  const sm = await get('https://printoka.com/download-sitemap.xml');
  const all = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  // parents = /download/<slug>/ (single segment), skip sitemap self-ref
  return [...new Set(all.filter(u => /\/download\/[^\/]+\/?$/.test(u) && !/\.xml/.test(u)))];
}
function parseDownloadPage(html, slug) {
  const i = html.indexOf('container section template');
  let tmpl = stripSvg(html.slice(i, html.indexOf('col-lg-3 offset', i) >= 0 ? html.indexOf('col-lg-3 offset', i) : i + 60000));
  const title = text((tmpl.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || [])[1]);
  const description = text((tmpl.match(/<div class="muted-16">([\s\S]*?)<\/div>/i) || [])[1]);
  const nm = tmpl.match(/card-warning[\s\S]*?uppercase-sm[^>]*>([\s\S]*?)<\/p>[\s\S]*?<p class="mb-0">([\s\S]*?)<\/p>/i);
  const notice = nm ? { label: text(nm[1]), body: text(nm[2]) } : null;
  // folds
  const folds = [];
  const foldRe = /<a class="nav-item template__fold[^"]*" href="#([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let fm;
  while ((fm = foldRe.exec(tmpl))) {
    const img = (fm[2].match(/data-src="([^"]*)"/) || [])[1] || '';
    const name = text((fm[2].match(/<h6>([\s\S]*?)<\/h6>/i) || [])[1]);
    folds.push({ id: fm[1], name, image: img, rows: [] });
  }
  const foldById = {}; folds.forEach(f => { foldById[f.id] = f; });
  const parseRows = chunk => {
    const out = [];
    const rows = chunk.split(/<div class="row download__row[^"]*">/i).slice(1);
    for (const r of rows) {
      const size = text((r.match(/<p class="fs-16">([\s\S]*?)<\/p>/i) || [])[1]);
      const dims = text((r.match(/<p class="muted-14">([\s\S]*?)<\/p>/i) || [])[1]);
      const files = [];
      const aRe = /<a class="mr-5[^"]*" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let am;
      while ((am = aRe.exec(r))) files.push({ label: text(am[2]), url: am[1] });
      if (size || files.length) out.push({ size, dims, files });
    }
    return out;
  };
  // split the tab-content into panes; each chunk runs to the next pane → rows belong to that pane's fold
  const chunks = tmpl.split(/<div class="tab-pane[^"]*"\s+id="/i).slice(1);
  if (chunks.length) {
    for (const chunk of chunks) {
      const id = chunk.slice(0, chunk.indexOf('"'));
      const f = foldById[id]; if (!f) continue;
      f.rows = parseRows(chunk);
    }
  } else if (!folds.length) {
    // single-variation pages with no fold tabs — one implicit fold
    folds.push({ id: slug, name: title, image: '', rows: parseRows(tmpl) });
  }
  return { slug, title, description, notice, folds };
}
async function migrateDownloads() {
  const parents = await downloadParents();
  const out = [];
  for (const u of parents) {
    const slug = (u.match(/\/download\/([^\/]+)\/?$/) || [])[1];
    try { const html = await get(u); out.push(parseDownloadPage(html, slug)); process.stdout.write('.'); }
    catch (e) { console.error('\n  fail', slug, e.message); }
  }
  process.stdout.write('\n');
  // keep source order but by title
  return out.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
}

const faq = await migrateFaq();
fs.writeFileSync(path.join(DIR, 'faq.json'), JSON.stringify(faq, null, 2));
console.log('FAQ: ' + faq.length + ' categories, ' + faq.reduce((s, c) => s + c.questions.length, 0) + ' questions');

const downloads = await migrateDownloads();
fs.writeFileSync(path.join(DIR, 'downloads.json'), JSON.stringify(downloads, null, 2));
console.log('Downloads: ' + downloads.length + ' categories, ' + downloads.reduce((s, c) => s + c.folds.reduce((t, f) => t + f.rows.length, 0), 0) + ' rows, ' + downloads.reduce((s, c) => s + c.folds.reduce((t, f) => t + f.rows.reduce((x, r) => x + r.files.length, 0), 0), 0) + ' files');
