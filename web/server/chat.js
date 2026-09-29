/*
 * Web chat (user, 2026-09-28): a visitor or a signed-in customer chats from the website (the chat bubble, or
 * "Speak to us via Web Chat"); Printoka staff answer from the Chat inbox. A guest's conversation is found again by
 * a private key kept in their browser; a signed-in customer's by their account.
 */
const crypto = require('crypto');
const store = require('./store');

const now = () => new Date().toISOString();
function threads() { const db = store.load(); db.chats = db.chats || []; return db.chats; }
const pub = t => ({ id: t.id, name: t.name, email: t.email, status: t.status, messages: t.messages, createdAt: t.createdAt, updatedAt: t.updatedAt,
  unreadStaff: t.unreadStaff || 0, unreadVisitor: t.unreadVisitor || 0, customer: !!t.customerId, page: t.page || '' });
// the visitor's open conversation: by account when signed in, else by the browser's private key
function mine(me, key) {
  return threads().find(t => t.status === 'open' && ((me && me.type === 'customer' && t.customerId === me.id) || (key && t.visitorKey === key)));
}
function visitorThread(me, key) {
  const t = mine(me, key); if (!t) return { thread: null };
  if (t.unreadVisitor) { t.unreadVisitor = 0; store.save(); }
  return { thread: pub(t) };
}
function visitorSend(me, b) {
  const text = String((b && b.text) || '').trim().slice(0, 2000); if (!text) return { error: 'Type a message first.' };
  let t = mine(me, String(b.visitorKey || '').slice(0, 64));
  if (!t) {
    const cust = me && me.type === 'customer' ? me : null;
    const name = (cust && cust.name) || String(b.name || '').trim().slice(0, 80);
    const email = (cust && cust.email) || String(b.email || '').trim().slice(0, 120);
    if (!name || !/\S+@\S+\.\S+/.test(email)) return { error: 'Please tell us your name and email so we can reply.' };
    t = { id: 'CH-' + crypto.randomBytes(3).toString('hex').toUpperCase(), visitorKey: crypto.randomBytes(16).toString('hex'), customerId: cust ? cust.id : null,
      name, email, status: 'open', messages: [], createdAt: now(), updatedAt: now(), page: String(b.page || '').slice(0, 120) };
    threads().unshift(t);
  }
  t.messages.push({ from: 'visitor', by: t.name, text, at: now() });
  t.updatedAt = now(); t.unreadStaff = (t.unreadStaff || 0) + 1;
  store.save(); return { thread: pub(t), visitorKey: t.visitorKey };
}
// ---- staff inbox
function inbox() {
  return { threads: threads().slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .map(t => Object.assign(pub(t), { messages: undefined, last: t.messages[t.messages.length - 1] || null, count: t.messages.length })) };
}
function open(id) {
  const t = threads().find(x => x.id === id); if (!t) return { error: 'Conversation not found.' };
  if (t.unreadStaff) { t.unreadStaff = 0; store.save(); }
  return { thread: pub(t) };
}
function reply(id, me, text) {
  const t = threads().find(x => x.id === id); if (!t) return { error: 'Conversation not found.' };
  text = String(text || '').trim().slice(0, 2000); if (!text) return { error: 'Type a reply first.' };
  if (t.status !== 'open') t.status = 'open';
  t.messages.push({ from: 'staff', by: me.name || 'Printoka', text, at: now() });
  t.updatedAt = now(); t.unreadVisitor = (t.unreadVisitor || 0) + 1; t.unreadStaff = 0;
  if (t.customerId) store.notify({ type: 'customer', id: t.customerId }, { kind: 'chat_reply', title: 'Printoka replied to your chat', body: text.slice(0, 140) });
  store.save(); return { thread: pub(t) };
}
function close(id) {
  const t = threads().find(x => x.id === id); if (!t) return { error: 'Conversation not found.' };
  t.status = 'closed'; t.closedAt = now(); store.save(); return { thread: pub(t) };
}

module.exports = { visitorThread, visitorSend, inbox, open, reply, close };
