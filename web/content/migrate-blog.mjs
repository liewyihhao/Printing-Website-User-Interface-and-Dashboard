/*
 * Fill in blog article bodies from the live printoka.com site.
 * Run:  node web/content/migrate-blog.mjs
 * Idempotent: only fetches posts whose body is still null in blog.json.
 * Requires Node 18+ (global fetch).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, 'blog.json');
const ORIGIN = 'https://printoka.com';

function isolate(html) {
  // start at the WordPress entry-content (or the first H1 after it); the closing </div>
  // is unreliable with nested divs, so cut at the first footer/share/related/comments marker.
  // printoka theme: <div class="... blog-content tw-prose ...">the_content()</div>
  let s = html.search(/class="[^"]*blog-content[^"]*"/i);
  if (s < 0) s = html.search(/class="[^"]*(entry-content|tw-prose)[^"]*"/i);
  if (s < 0) s = html.search(/<article[\s>]/i);
  if (s < 0) return '';
  s = html.indexOf('>', s) + 1;
  const rest = html.slice(s);
  const enders = [/class="col-lg-4"/i, /class="[^"]*(blog-related|sharedaddy|entry-footer|post-tags|post-navigation|nav-links|related|jp-relatedposts|yarpp)/i, /<footer[\s>]/i, /id="comments"/i, /Subscribe for latest/i, /class="[^"]*sidebar/i, /<\/article>/i];
  let end = rest.length;
  for (const re of enders) { const m = rest.search(re); if (m > 200 && m < end) end = m; }
  return rest.slice(0, end);
}
function htmlToMarkdown(html) {
  let body = isolate(html) || html;
  body = body
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, t) => '\n\n' + '#'.repeat(+n === 1 ? 2 : +n) + ' ' + strip(t) + '\n\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => '- ' + strip(t) + '\n')
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => '**' + strip(t) + '**')
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, t) => '*' + strip(t) + '*')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, t) => '\n\n' + strip(t) + '\n\n')
    .replace(/<br\s*\/?>/gi, '\n');
  // final pass: drop remaining tags + decode entities WITHOUT collapsing the newlines we inserted
  body = decode(body.replace(/<[^>]+>/g, ''));
  return body.split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
function decode(s) { return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;/g, '’').replace(/&#8216;/g, '‘').replace(/&#8211;/g, '–').replace(/&#8220;/g, '“').replace(/&#8221;/g, '”').replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'"); }
function strip(s) { return decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim(); }

const posts = JSON.parse(fs.readFileSync(FILE, 'utf8'));
let done = 0, skipped = 0;
for (const p of posts) {
  if (p.body) { skipped++; continue; }
  try {
    const res = await fetch(ORIGIN + p.url, { headers: { 'User-Agent': 'Mozilla/5.0 Printoka-migrate' } });
    if (!res.ok) { console.warn('  ! ' + p.slug + ' → HTTP ' + res.status); continue; }
    const html = await res.text();
    const md = htmlToMarkdown(html);
    if (md && md.length > 120) {
      p.body = md;
      // pull a real <title>/H1 if we don't have a good one yet
      const t = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i); if (t) p.title = strip(t[1]) || p.title;
      done++;
      console.log('  ✓ ' + p.slug + ' (' + md.length + ' chars)');
    } else console.warn('  ? ' + p.slug + ' → body too short, left as stub');
  } catch (e) { console.warn('  ! ' + p.slug + ' → ' + e.message); }
}
fs.writeFileSync(FILE, JSON.stringify(posts, null, 1));
console.log(`\nDone. Imported ${done}, already had ${skipped}. Restart the dev server to serve them.`);
