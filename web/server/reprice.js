/*
 * Server-side re-pricing. The storefront's price is for display only: at checkout every cart line is priced again
 * here, with the same pricing code the browser runs (web/pricing/engine.js + the configurator in web/app.js),
 * loaded once into a sandboxed headless copy. A line whose browser price differs from the server's is rejected.
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const W = path.join(__dirname, '..');
let APP = null, CTX = null;

function boot() {
  if (APP) return APP;
  const mem = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; };
  const win = {
    localStorage: mem(), sessionStorage: mem(), location: { pathname: '/', search: '', hash: '', href: 'http://localhost/', origin: 'http://localhost' },
    addEventListener() {}, removeEventListener() {}, scrollTo() {}, matchMedia: () => ({ matches: false, addListener() {}, addEventListener() {} }),
    navigator: { userAgent: 'printoka-reprice' }, history: { pushState() {}, replaceState() {} }, __asset: p => p, open() {},
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  };
  win.window = win;
  class Comp { constructor(props) { this.props = props || {}; this.state = {}; } setState(u, cb) { const n = typeof u === 'function' ? u(this.state) : u; this.state = Object.assign({}, this.state, n); if (cb) cb(); } forceUpdate() {} }
  win.React = { Component: Comp, createElement: () => null, Fragment: 'frag' };
  win.ReactDOM = { render() {}, createRoot: () => ({ render() {} }) };
  win.document = { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }), addEventListener() {}, body: { appendChild() {}, classList: { add() {}, remove() {} } }, head: { appendChild() {} }, documentElement: { style: {} }, title: '' };
  win.fetch = () => new Promise(() => {});   // no network from the sandbox
  CTX = vm.createContext(Object.assign(win, { console: { log() {}, warn() {}, error() {} }, JSON, Math, Date, Object, Array, String, Number, RegExp, Promise, Map, Set, Error, parseFloat, parseInt, isNaN, encodeURIComponent, decodeURIComponent, URLSearchParams }));
  ['pricing/engine.js', 'catalogue.js', 'product-images.js', 'runtime.js', 'app.js'].forEach(f => {
    try { vm.runInContext(fs.readFileSync(path.join(W, f), 'utf8'), CTX, { filename: f, timeout: 20000 }); } catch (e) { if (f === 'app.js' || f === 'pricing/engine.js') throw e; }
  });
  // the captured price tables the browser fetches from /pricing at start-up
  fs.readdirSync(path.join(W, 'pricing')).filter(f => /^excard_.*\.json$/.test(f)).forEach(f => {
    const name = ({ 'excard_bc.json': 'Business Card', 'excard_flyer.json': 'Flyer' })[f]; if (!name) return;
    try { vm.runInContext('EXCARD_PRICES[' + JSON.stringify(name) + '] = ' + fs.readFileSync(path.join(W, 'pricing', f), 'utf8') + ';', CTX); } catch (e) {}
  });
  if (!CTX.PKComponent) throw new Error('reprice: configurator not found in app.js');
  APP = new CTX.PKComponent({});
  return APP;
}

// the configurator state a cart line was priced from (see PKComponent.pricingSnapshot in app.js)
const SNAP_KEYS = ['prodId', 'cfg', 'qty', 'qtyChosen', 'srRows', 'lbLines', 'lbFab', 'cqv'];

// price one cart line on the server; returns { ok, gross } or { ok: false, error }
function priceLine(item, user) {
  try {
    const app = boot();
    if (item && item.pkg) {   // custom packaging box builder
      const sp = item.pkg, q = vm.runInContext('pkgQuote', CTX)(sp), lane = q && sp && sp.lane && q[sp.lane];
      return lane ? { ok: true, gross: Math.round(lane.price * 100) / 100 } : { ok: false, error: 'This box can no longer be priced. Please build it again.' };
    }
    const s = item && item.pricing;
    if (!s || typeof s !== 'object' || !(+s.prodId > 0)) return { ok: false, error: 'Please remove "' + String((item && (item.product || item.name)) || 'this item').slice(0, 60) + '" and add it to your cart again.' };
    const st = { user: user ? { id: user.id, name: user.name, email: user.email, tier: user.tier || 'Standard', type: user.type } : null, route: 'product' };
    SNAP_KEYS.forEach(k => { if (s[k] !== undefined) st[k] = JSON.parse(JSON.stringify(s[k])); });
    st.prodId = +s.prodId; st.qtyChosen = true;
    app.state = Object.assign({}, st);
    if (Number(item.productId) && Number(item.productId) !== st.prodId) return { ok: false, error: 'Cart item does not match its product.' };
    const q = app.pkQuote(app.orderQty() || st.qty || 1);
    if (!q || !q.ok || !(q.gross > 0)) return { ok: false, error: (q && q.message) || 'This item can no longer be priced. Please configure it again.' };
    return { ok: true, gross: Math.round(q.gross * 100) / 100, qty: app.orderQty() || st.qty };
  } catch (e) {
    return { ok: false, error: 'We could not check the price of this item. Please try again.' };
  }
}

// check every line of an order body; mutates prices to the server's own figures. Returns { ok } or { error }
function verifyCart(body, user) {
  const items = body.items || [];
  for (const it of items) {
    const r = priceLine(it, user);
    if (!r.ok) return { error: r.error };
    if (Math.abs(r.gross - (Number(it.lineTotal) || 0)) > 0.05) return { error: 'The price of "' + String(it.product || it.name || 'an item').slice(0, 60) + '" has changed to RM ' + r.gross.toFixed(2) + '. Please refresh your cart and try again.', item: it.jobCode || null, price: r.gross };
    it.lineTotal = r.gross; it.unitPrice = r.gross / (Number(it.qty) || 1);
  }
  return { ok: true };
}

module.exports = { priceLine, verifyCart, boot };
