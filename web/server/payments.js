/*
 * Online payments. Card details never reach Printoka: the customer pays on Stripe Checkout or the iPay88 hosted page,
 * and an order is marked paid ONLY when the gateway confirms it by a signed server-to-server callback.
 *
 * Configure with environment variables (never commit them):
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET          Stripe Checkout + webhook signing secret
 *   IPAY88_MERCHANT_CODE, IPAY88_MERCHANT_KEY          iPay88 hosted payment page + backend post
 *   PUBLIC_ORIGIN                                      e.g. https://printoka.com (return / callback URLs)
 *   PRINTOKA_TEST_PAYMENTS=1                           allow instant test payments (never in production)
 */
const crypto = require('crypto');
const store = require('./store');

const env = k => process.env[k] || '';
const isProduction = () => env('NODE_ENV') === 'production';
// test payments (the storefront's simulated card / FPX) are allowed only outside production, or when explicitly enabled
function isTestMode() { if (env('PRINTOKA_TEST_PAYMENTS') === '1') return true; if (env('PRINTOKA_TEST_PAYMENTS') === '0') return false; return !isProduction(); }
const STRIPE_METHODS = { stripe: 1, card_test: 1 };
const IPAY_METHODS = { ipay88: 1, fpx: 1, tng: 1 };
const ONLINE = Object.assign({}, STRIPE_METHODS, IPAY_METHODS);
const stripeReady = () => !!(env('STRIPE_SECRET_KEY') && env('STRIPE_WEBHOOK_SECRET'));
const ipayReady = () => !!(env('IPAY88_MERCHANT_CODE') && env('IPAY88_MERCHANT_KEY'));

// is this method allowed right now?
function methodAvailable(method) {
  if (!ONLINE[method]) return true;
  if (isTestMode()) return true;
  return STRIPE_METHODS[method] ? stripeReady() : ipayReady();
}
// does an order paid this way count as paid the moment it is placed? (wallet: debited on the server; tests: simulated)
function paidAtPlacement(method) { return method === 'wallet' || (!!ONLINE[method] && isTestMode() && !(STRIPE_METHODS[method] ? stripeReady() : ipayReady())); }

const sha256 = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const amountDigits = n => (Math.round(Number(n) * 100) / 100).toFixed(2).replace(/[.,]/g, '');

// start a gateway payment for a placed, unpaid order → { redirect } (Stripe) or { form: { action, fields } } (iPay88)
async function start(order, origin) {
  if (!order || order.payment.status === 'validated') return null;
  const method = order.payment.method, base = env('PUBLIC_ORIGIN') || origin;
  if (STRIPE_METHODS[method] && stripeReady()) {
    const p = new URLSearchParams();
    p.append('mode', 'payment'); p.append('client_reference_id', order.id); p.append('metadata[orderId]', order.id);
    p.append('line_items[0][quantity]', '1'); p.append('line_items[0][price_data][currency]', 'myr');
    p.append('line_items[0][price_data][unit_amount]', String(Math.round(order.total * 100)));
    p.append('line_items[0][price_data][product_data][name]', 'Printoka order ' + order.id);
    p.append('success_url', base + '/dash?paid=' + encodeURIComponent(order.id)); p.append('cancel_url', base + '/dash?unpaid=' + encodeURIComponent(order.id));
    if (order.customer && order.customer.email) p.append('customer_email', order.customer.email);
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: 'Bearer ' + env('STRIPE_SECRET_KEY'), 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': 'co-' + order.id }, body: p.toString() });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.url) { store.logEvent({ actor: 'stripe', role: 'system', action: 'payment_start_failed', jobId: null, from: null, to: null, note: order.id }); return { error: 'We could not open the card payment page. Please try again.' };
    }
    order.payment.sessionId = d.id; store.save();
    return { redirect: d.url };
  }
  if (IPAY_METHODS[method] && ipayReady()) {
    const code = env('IPAY88_MERCHANT_CODE'), key = env('IPAY88_MERCHANT_KEY'), amt = (Math.round(order.total * 100) / 100).toFixed(2);
    const PAYMENT_ID = { fpx: '16', tng: '538' };   // iPay88 payment method ids (confirm against the merchant's enabled list)
    const fields = { MerchantCode: code, RefNo: order.id, Amount: amt, Currency: 'MYR', ProdDesc: 'Printoka order ' + order.id,
      UserName: (order.customer && order.customer.name) || 'Customer', UserEmail: (order.customer && order.customer.email) || '', UserContact: (order.customer && order.customer.phone) || '',
      Lang: 'UTF-8', SignatureType: 'SHA256', Signature: sha256(key + code + order.id + amountDigits(amt) + 'MYR'),
      ResponseURL: base + '/dash?paid=' + encodeURIComponent(order.id), BackendURL: base + '/api/payments/ipay88/backend' };
    if (PAYMENT_ID[method]) fields.PaymentId = PAYMENT_ID[method];
    return { form: { action: 'https://payment.ipay88.com.my/epayment/entry.asp', fields } };
  }
  return null;
}

// one place that marks an order paid from a gateway: idempotent, and only for the exact order total
function confirm(orderId, gateway, reference, amount) {
  const o = store.order(orderId); if (!o) return { error: 'order not found' };
  if (o.payment.status === 'validated') return { ok: true, already: true };
  if (Math.abs(Number(amount) - Number(o.total)) > 0.01) {
    store.logEvent({ actor: gateway, role: 'system', action: 'payment_amount_mismatch', jobId: null, from: null, to: null, note: orderId + ' paid ' + amount + ' expected ' + o.total });
    store.save(); return { error: 'amount mismatch' };
  }
  o.payment.reference = String(reference || '').slice(0, 80); o.payment.gateway = o.payment.gateway || gateway;
  store.validateOrderPayment(orderId, gateway);
  return { ok: true };
}

// Stripe webhook: verify the Stripe-Signature header (HMAC-SHA256 of "t.body", 5-minute tolerance)
function stripeWebhook(raw, sigHeader) {
  const secret = env('STRIPE_WEBHOOK_SECRET'); if (!secret) return { code: 503, error: 'not configured' };
  const parts = {}; String(sigHeader || '').split(',').forEach(kv => { const i = kv.indexOf('='); if (i > 0) (parts[kv.slice(0, i).trim()] = parts[kv.slice(0, i).trim()] || []).push(kv.slice(i + 1).trim()); });
  const t = parts.t && parts.t[0]; if (!t || Math.abs(Date.now() / 1000 - Number(t)) > 300) return { code: 400, error: 'bad timestamp' };
  const expected = crypto.createHmac('sha256', secret).update(t + '.' + raw, 'utf8').digest('hex');
  const ok = (parts.v1 || []).some(v => v.length === expected.length && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(expected)));
  if (!ok) return { code: 400, error: 'bad signature' };
  let ev; try { ev = JSON.parse(raw); } catch (e) { return { code: 400, error: 'bad body' }; }
  if (ev.type === 'checkout.session.completed' || ev.type === 'checkout.session.async_payment_succeeded') {
    const s = ev.data && ev.data.object || {};
    if (s.payment_status === 'paid') { const r = confirm(s.client_reference_id || (s.metadata || {}).orderId, 'Stripe', s.payment_intent || s.id, (s.amount_total || 0) / 100); if (r.error && r.error !== 'amount mismatch') return { code: 404, error: r.error }; }
  }
  return { code: 200, ok: true };
}

// iPay88 backend post: verify the response signature, then answer RECEIVEOK
function ipay88Backend(f) {
  const code = env('IPAY88_MERCHANT_CODE'), key = env('IPAY88_MERCHANT_KEY'); if (!code || !key) return { code: 503, text: 'not configured' };
  if (f.MerchantCode !== code) return { code: 400, text: 'bad merchant' };
  const sig = sha256(key + code + (f.PaymentId || '') + (f.RefNo || '') + amountDigits(f.Amount) + (f.Currency || '') + (f.Status || ''));
  if (!f.Signature || String(f.Signature).toLowerCase() !== sig) return { code: 400, text: 'bad signature' };
  if (String(f.Status) === '1') confirm(f.RefNo, 'iPay88', f.TransId, f.Amount);
  return { code: 200, text: 'RECEIVEOK' };
}

module.exports = { isTestMode, methodAvailable, paidAtPlacement, start, confirm, stripeWebhook, ipay88Backend, ONLINE };
