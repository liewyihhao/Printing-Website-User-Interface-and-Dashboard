/*
 * Artwork Storage — the customer's own artwork library, as on the original printoka.com
 * ("ARTWORK STORAGE · Choose & click to select the file for selected job"): drag & drop or browse to
 * upload, a thumbnail grid sorted by date, delete files, pages. A cart job takes its artwork from here
 * (Preview · Change · Remove); the files stay in the library so the same job can be reordered.
 * Server: /api/artworks (web/server/artworks.js). Mixed into PKComponent like account.js.
 */
(function () {
  const C = window.PKComponent; if (!C) return;
  const P = C.prototype;
  const PER_PAGE = 18;
  const fmtSize = n => n >= 1048576 ? (n / 1048576).toFixed(2) + 'MB' : (n / 1024).toFixed(2) + 'KB';
  const fmtDate = s => { const d = new Date(s || 0); const p = x => String(x).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()); };
  const PREVIEWABLE = { pdf: 1, jpg: 1, jpeg: 1, png: 1, svg: 1 };

  // ---------------------------------------------------------------- data
  P.agLoad = function (force) {
    if (typeof fetch !== 'function' || !this.authToken()) return;
    if (this._agLoading || (this.state.agList && !force)) return;
    this._agLoading = true;
    fetch('/api/artworks', { headers: this.authHeaders() }).then(r => r.ok ? r.json() : null)
      .then(d => { this._agLoading = false; if (d) this.setState({ agList: d.artworks || [] }); })
      .catch(() => { this._agLoading = false; });
  };
  // a small JPEG preview for the grid, made in the browser (first page of a PDF, or the image itself)
  P.awThumb = function (file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const toJpeg = (src, w, hgt, draw) => { const s = Math.min(1, 260 / Math.max(w, hgt)); const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(hgt * s)); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); draw(x, c, s); return c.toDataURL('image/jpeg', 0.8); };
    if (ext === 'pdf') return this.awLoadPdfjs().then(pdfjs => file.arrayBuffer().then(buf => pdfjs.getDocument({ data: buf }).promise)).then(pdf => pdf.getPage(1)).then(page => {
      const vp = page.getViewport({ scale: 1 }), s = Math.min(1, 260 / Math.max(vp.width, vp.height)), v2 = page.getViewport({ scale: s });
      const c = document.createElement('canvas'); c.width = v2.width; c.height = v2.height;
      return page.render({ canvasContext: c.getContext('2d'), viewport: v2 }).promise.then(() => c.toDataURL('image/jpeg', 0.8));
    }).catch(() => null);
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].indexOf(ext) >= 0) return new Promise(res => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { try { res(toJpeg(img, img.naturalWidth, img.naturalHeight, (x, c) => x.drawImage(img, 0, 0, c.width, c.height))); } catch (e) { res(null); } URL.revokeObjectURL(url); };
      img.onerror = () => { res(null); URL.revokeObjectURL(url); };
      img.src = url;
    });
    return Promise.resolve(null);
  };
  // upload one or more files into the library, one after another; resolves with the stored records
  P.agUpload = function (fileList) {
    const list = Array.prototype.slice.call(fileList || []); if (!list.length) return Promise.resolve([]);
    const done = [];
    this.setState({ agBusy: list.length, agErr: null });
    const one = f => new Promise(res => { const rd = new FileReader(); rd.onload = () => res(rd.result); rd.onerror = () => res(null); rd.readAsDataURL(f); })
      .then(data => data ? this.awThumb(f).then(thumb => fetch('/api/artworks', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, this.authHeaders()), body: JSON.stringify({ name: f.name, data, thumb }) }).then(r => r.json())) : { error: 'Could not read ' + f.name + '.' })
      .then(d => { if (d && d.artwork) { done.push(d.artwork); this.setState(st => ({ agList: [d.artwork].concat(st.agList || []), agBusy: Math.max(0, (st.agBusy || 1) - 1) })); } else this.setState(st => ({ agErr: (d && d.error) || 'Upload failed.', agBusy: Math.max(0, (st.agBusy || 1) - 1) })); })
      .catch(() => this.setState(st => ({ agErr: 'Upload failed — check your connection.', agBusy: Math.max(0, (st.agBusy || 1) - 1) })));
    return list.reduce((p, f) => p.then(() => one(f)), Promise.resolve()).then(() => done);
  };
  P.agDelete = function (ids) {
    if (!ids.length) return;
    fetch('/api/artworks/delete', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, this.authHeaders()), body: JSON.stringify({ ids }) })
      .then(r => r.json()).then(d => this.setState({ agList: d.artworks || [], agSel: {}, agDelMode: false })).catch(() => {});
  };
  // open the file in a new tab (PDF / image) or download it (AI, ZIP…)
  P.agPreview = function (a) {
    if (!a || typeof window === 'undefined') return;
    const ext = (a.ext || (a.name || '').split('.').pop() || '').toLowerCase();
    const w = PREVIEWABLE[ext] ? window.open('', '_blank') : null;
    fetch('/api/artworks/' + a.id + '/file', { headers: this.authHeaders() }).then(r => r.ok ? r.blob() : null).then(b => {
      if (!b) { if (w) w.close(); return; }
      const url = URL.createObjectURL(b);
      if (w) w.location.href = url; else if (this.saveBlob) this.saveBlob(b, a.name);
    }).catch(() => { if (w) w.close(); });
  };

  // ---------------------------------------------------------------- the gallery (modal + dashboard)
  // mode 'pick': choose a file for a cart job (consent required); mode 'manage': the dashboard library
  P.agPanel = function (mode, onPick) {
    this.agLoad();
    const all = this.state.agList, sort = this.state.agSort || 'date_desc';
    const list = (all || []).slice().sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'date_asc' ? (a.at || '').localeCompare(b.at || '') : (b.at || '').localeCompare(a.at || ''));
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE)), page = Math.min(this.state.agPage || 1, pages);
    const shown = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const del = !!this.state.agDelMode, sel = this.state.agSel || {}, nSel = Object.keys(sel).filter(k => sel[k]).length;
    const picked = mode === 'pick' ? (all || []).find(a => a.id === this.state.agPick) : null;
    // a file just uploaded while choosing for a job is selected, ready to confirm
    const onFiles = fl => this.agUpload(fl).then(done => { if (mode === 'pick' && done.length) this.setState({ agPick: done[0].id }); });
    const choose = a => {
      if (del) return this.setState({ agSel: Object.assign({}, sel, { [a.id]: !sel[a.id] }) });
      if (mode !== 'pick') return this.agPreview(a);
      this.setState({ agPick: this.state.agPick === a.id ? null : a.id, agErr: null });
    };
    const badge = ext => h('div', { style: { display: 'grid', placeItems: 'center', height: '100%' } },
      h('div', { style: { position: 'relative', width: 44, height: 54, background: '#fff', border: '1px solid #d5d8dc', borderRadius: 3 } },
        h('span', { style: { position: 'absolute', left: -6, bottom: 9, background: TEAL, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 2 } }, (ext || 'file').toUpperCase().slice(0, 4))));
    const card = a => { const on = del ? !!sel[a.id] : (mode === 'pick' && this.state.agPick === a.id);
      return h('div', { key: a.id, role: 'button', tabIndex: 0, onClick: () => choose(a), onKeyDown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(a); } },
        title: a.name, style: { position: 'relative', background: '#fff', border: '1px solid ' + (on ? TEAL : HAIR), boxShadow: on ? '0 0 0 2px ' + TEAL : 'none', borderRadius: 0, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' } },
        del ? h('span', { style: { position: 'absolute', top: 8, left: 8, height: 18, width: 18, borderRadius: 4, border: '2px solid ' + (on ? TEAL : '#b8bcc2'), background: on ? TEAL : '#fff', color: '#fff', fontSize: 12, lineHeight: '14px', textAlign: 'center', zIndex: 1 } }, on ? '✓' : '') : null,
        h('div', { style: { height: 110, background: '#e9ebee', display: 'grid', placeItems: 'center', overflow: 'hidden' } },
          a.thumb ? h('img', { src: a.thumb, alt: '', style: { maxHeight: '100%', maxWidth: '100%', display: 'block' } }) : badge(a.ext)),
        h('div', { style: { padding: '10px 10px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 5 } },
          h('div', { style: { fontSize: 12, color: INK, wordBreak: 'break-word', lineHeight: 1.35 } }, a.name),
          h('div', { style: { fontSize: 11, color: FAINT } }, fmtSize(a.size || 0)),
          h('div', { style: { fontSize: 10.5, color: '#c4c7cc' } }, fmtDate(a.at)))); };
    const btn = (label, onClick, kind, extra) => h('button', { type: 'button', onClick, style: Object.assign({ font: '600 12.5px Montserrat,sans-serif', letterSpacing: '.04em', border: kind === 'ghost' ? '1px solid ' + HAIR : 'none', background: kind === 'ghost' ? '#fff' : TEAL, color: kind === 'ghost' ? INK : '#fff', borderRadius: 0, padding: '9px 16px', cursor: 'pointer' }, extra || {}) }, label);
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
      // drop zone
      h('label', { onDragOver: e => e.preventDefault(), onDrop: e => { e.preventDefault(); onFiles(e.dataTransfer.files); },
        style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', background: '#e6eaf2', border: '1px dashed #c4ccda', borderRadius: 0, padding: '26px 16px', cursor: 'pointer', color: '#6b7380', fontSize: 17 } },
        h('input', { type: 'file', multiple: true, accept: '.pdf,.ai,.eps,.psd,.tif,.tiff,.jpg,.jpeg,.png,.svg,.cdr,.indd,.zip,.rar', style: { display: 'none' }, onChange: e => { onFiles(e.target.files); e.target.value = ''; } }),
        h('svg', { width: 34, height: 24, viewBox: '0 0 34 24', 'aria-hidden': true }, h('path', { d: 'M27 10.2A9 9 0 0 0 9.6 8.1 7 7 0 0 0 8 22h18a6 6 0 0 0 1-11.8z', fill: '#8a93a3' }), h('path', { d: 'M17 9v9M13 13l4-4 4 4', stroke: '#fff', strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round' })),
        h('span', null, this.state.agBusy ? 'Uploading ' + this.state.agBusy + ' file' + (this.state.agBusy > 1 ? 's' : '') + '…' : 'Drag & Drop files here  - or -'),
        this.state.agBusy ? null : h('span', { style: { background: TEAL, color: '#fff', font: '700 12.5px Montserrat,sans-serif', letterSpacing: '.06em', padding: '10px 14px', borderRadius: 4 } }, 'BROWSE FILES')),
      this.state.agErr ? h('div', { role: 'alert', style: { fontSize: 12.5, color: '#c0392b' } }, this.state.agErr) : null,
      // grid
      all == null ? h('div', { style: { padding: 30, textAlign: 'center', color: FAINT, fontSize: 13 } }, 'Loading your artworks…')
        : !list.length ? h('div', { style: { padding: 30, textAlign: 'center', color: FAINT, fontSize: 13 } }, 'No artworks yet.')
          : h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 } }, shown.map(card)),
      // footer: delete files · sort · pages
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderTop: '1px solid ' + HAIR, paddingTop: 12 } },
        del ? [btn(nSel ? 'DELETE ' + nSel + ' FILE' + (nSel > 1 ? 'S' : '') : 'SELECT FILES TO DELETE', () => { if (nSel && (typeof window === 'undefined' || window.confirm('Delete ' + nSel + ' file' + (nSel > 1 ? 's' : '') + ' from your Artwork Storage?'))) this.agDelete(Object.keys(sel).filter(k => sel[k])); }, 'red', { key: 'd', opacity: nSel ? 1 : .6 }),
          btn('Cancel', () => this.setState({ agDelMode: false, agSel: {} }), 'ghost', { key: 'c' })]
          : [mode === 'pick' ? btn('CONFIRM', () => { if (picked) this.setState({ agAgree: true }); }, 'red', { key: 'ok', opacity: picked ? 1 : .45, cursor: picked ? 'pointer' : 'not-allowed', padding: '10px 26px' }) : null,
             list.length ? btn('DELETE FILES', () => this.setState({ agDelMode: true, agSel: {}, agPick: null }), 'ghost', { key: 'del' }) : null],
        h('label', { style: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: MUT } }, 'Sort By',
          h('select', { value: sort, onChange: e => this.setState({ agSort: e.target.value, agPage: 1 }), style: { font: '400 13px Montserrat,sans-serif', padding: '7px 10px', border: '1px solid ' + HAIR, borderRadius: 0, background: '#fff' } },
            h('option', { value: 'date_desc' }, 'Date Desc'), h('option', { value: 'date_asc' }, 'Date Asc'), h('option', { value: 'name' }, 'Name A–Z'))),
        pages > 1 ? h('span', { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: MUT } },
          h('button', { type: 'button', 'aria-label': 'Previous page', disabled: page <= 1, onClick: () => this.setState({ agPage: page - 1 }), style: { border: 'none', background: 'none', cursor: page > 1 ? 'pointer' : 'default', fontSize: 16, color: page > 1 ? INK : '#ccc' } }, '◀'),
          'Page ', h('b', { style: { color: INK } }, page), ' of ' + pages,
          h('button', { type: 'button', 'aria-label': 'Next page', disabled: page >= pages, onClick: () => this.setState({ agPage: page + 1 }), style: { border: 'none', background: 'none', cursor: page < pages ? 'pointer' : 'default', fontSize: 16, color: page < pages ? INK : '#ccc' } }, '▶')) : null));
  };
  // the modal: opened from a cart job's artwork slot (state.ag = { line, slot })
  P.artStorageModal = function () {
    const ag = this.state.ag; if (!ag) return null;
    const close = () => this.setState({ ag: null, agErr: null, agDelMode: false, agSel: {}, agPick: null, agAgree: false });
    const pick = a => { this.cartSetArtwork(ag.line, ag.slot, a); close(); };
    const picked = (this.state.agList || []).find(a => a.id === this.state.agPick);
    return h('div', { key: 'ag', onClick: close, style: { position: 'fixed', inset: 0, zIndex: 98, background: 'rgba(15,20,25,.55)', display: 'grid', placeItems: 'start center', padding: '4vh 16px', overflow: 'auto' } },
      h('div', { onClick: e => e.stopPropagation(), role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Artwork Storage', style: { position: 'relative', background: '#fff', borderRadius: 0, width: '100%', maxWidth: 1180, padding: '20px 22px 18px', boxShadow: '0 24px 60px rgba(0,0,0,.3)' } },
        h('button', { type: 'button', onClick: close, 'aria-label': 'Close', style: { position: 'absolute', top: 12, right: 12, height: 30, width: 30, borderRadius: '50%', border: 'none', background: INK, color: '#fff', fontSize: 16, cursor: 'pointer' } }, '×'),
        h('div', { style: { marginBottom: 14, paddingRight: 40 } },
          h('div', { style: { fontSize: 20, fontWeight: 700, letterSpacing: '.02em', textTransform: 'uppercase' } }, 'Artwork Storage'),
          h('div', { style: { fontSize: 13, color: MUT, marginTop: 2 } }, 'Choose & click to select the file for ' + (ag.label || 'this job') + ', then Confirm')),
        this.agPanel('pick', pick),
        this.state.agAgree && picked ? h('div', { onClick: e => { e.stopPropagation(); this.setState({ agAgree: false }); }, style: { position: 'absolute', inset: 0, borderRadius: 0, background: 'rgba(255,255,255,.72)', display: 'grid', placeItems: 'center', padding: 16 } },
          h('div', { onClick: e => e.stopPropagation(), role: 'alertdialog', 'aria-modal': 'true', 'aria-label': 'Confirm artwork', style: { background: '#fff', borderRadius: 0, maxWidth: 440, width: '100%', padding: '22px 24px', boxShadow: '0 18px 50px rgba(0,0,0,.25)', border: '1px solid ' + HAIR } },
            h('div', { style: { fontSize: 17, fontWeight: 700, marginBottom: 8 } }, 'Confirm your artwork'),
            h('div', { style: { fontSize: 13.5, color: INK, lineHeight: 1.6, marginBottom: 6 } }, 'I confirm this artwork is finalised. I understand it cannot be changed after my order is submitted.'),
            h('div', { style: { fontSize: 12.5, color: MUT, marginBottom: 18, wordBreak: 'break-word' } }, picked.name),
            h('div', { style: { display: 'flex', gap: 10, justifyContent: 'flex-end' } },
              h('button', { type: 'button', onClick: () => this.setState({ agAgree: false }), style: { font: '600 13.5px Montserrat,sans-serif', background: '#fff', color: INK, border: '1px solid ' + HAIR, borderRadius: 0, padding: '10px 18px', cursor: 'pointer' } }, 'Cancel'),
              h('button', { type: 'button', onClick: () => { this.setState({ agAgree: false, agPick: null }); pick(picked); }, style: { font: '600 13.5px Montserrat,sans-serif', background: TEAL, color: '#fff', border: 'none', borderRadius: 0, padding: '10px 20px', cursor: 'pointer' } }, 'I agree')))) : null));
  };

  // ---------------------------------------------------------------- cart job artwork slots
  // how many artworks a job takes: "Duplicate with Same Configuration: 3 artworks" → 3, else 1
  P.artSlots = function (it) {
    let n = 1;
    (it.specLines || []).forEach(l => { const m = /(\d+)\s*(artworks?|designs?|in\s*1)\b/i.exec(String(l[1] || '')); if (m && /duplicate|package/i.test(String(l[0] || ''))) n = +m[1]; });
    return Math.max(1, Math.min(10, n));
  };
  P.cartSetArtwork = function (line, slot, a) {
    const cart = (this.state.cart || []).map((it, i) => {
      if (i !== line) return it;
      const arts = (it.artworks || []).slice(); arts[slot] = a ? { id: a.id, name: a.name } : null;
      return Object.assign({}, it, { artworks: arts, artLater: false });
    });
    this.setState({ cart }); this.saveCart(cart);
  };
  P.cartArtLater = function (line, on) {
    const cart = (this.state.cart || []).map((it, i) => i === line ? Object.assign({}, it, { artLater: on }) : it);
    this.setState({ cart }); this.saveCart(cart);
  };
  P.cartMissingArt = function () {
    return (this.state.cart || []).filter(it => { const n = this.artSlots(it); for (let k = 0; k < n; k++) if (!(it.artworks || [])[k]) return true; return false; }).length;
  };
  // the job's artwork rows, in the cart's label / value layout (row = the cart's row renderer)
  P.cartArtworkBlock = function (it, i, row) {
    if (this.state.user) this.agLoad();
    const n = this.artSlots(it), lib = this.state.agList || [];
    const link = (label, on) => h('span', { role: 'button', tabIndex: 0, onClick: on, onKeyDown: e => { if (e.key === 'Enter') on(); }, style: { fontSize: 13.5, color: '#2f7fd1', cursor: 'pointer' } }, label);
    // (user, 2026-09-30) uploading goes through the Upload & check artwork page for this job (size + print preview + checks)
    const open = k => { this.setState({ awJob: { line: i, slot: k }, aw: null, awAgree: false }); this.go('artwork'); };
    const out = [];
    for (let k = 0; k < n; k++) {
      const a = (it.artworks || [])[k], full = a && (lib.find(x => x.id === a.id) || a);
      const label = n > 1 ? 'Artwork ' + (k + 1) : 'Artwork';
      const value = a
        ? h('span', { style: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' } },
            h('span', { style: { height: 64, width: 88, background: '#e2e4e7', display: 'grid', placeItems: 'center', overflow: 'hidden', flex: 'none' } },
              full.thumb ? h('img', { src: full.thumb, alt: '', style: { maxHeight: '100%', maxWidth: '100%' } }) : h('span', { style: { fontSize: 10, fontWeight: 700, color: '#fff', background: TEAL, padding: '2px 6px' } }, (full.name.split('.').pop() || 'file').toUpperCase().slice(0, 4))),
            h('span', { style: { minWidth: 0, flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: 5 } },
              h('span', { style: { fontSize: 13.5, wordBreak: 'break-word' } }, full.name),
              h('span', { style: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5, color: FAINT } },
                link('Preview', () => this.agPreview(full)), '|', link('Change', () => open(k)), '|', link('Remove', () => this.cartSetArtwork(i, k, null)))))
        : h('span', { role: 'button', tabIndex: 0, onClick: () => open(k), onKeyDown: e => { if (e.key === 'Enter') open(k); }, style: { display: 'inline-block', background: TEAL, color: '#fff', fontWeight: 500, fontSize: 14, padding: '9px 18px', cursor: 'pointer' } }, 'Upload artwork');
      out.push(row ? row(label, value) : h('div', { key: k, style: { display: 'flex', gap: 14, alignItems: 'center', padding: '8px 0' } }, h('b', { style: { fontSize: 13, minWidth: 80 } }, label), value));
    }
    return h('div', { key: 'art' }, out);
  };
})();

// ---------------------------------------------------------------- payment methods, as on printoka.com's checkout
// Direct bank transfer (opens the bank account) · iPay88 · Stripe · Wallet payment (balance + Top up).
// Used by the checkout and by My Orders ("pay this pending order"). opts: { value, onChange, total, only }
(function () {
  const C = window.PKComponent; if (!C) return;
  const P = C.prototype;
  const A = p => (typeof window !== 'undefined' && window.__asset ? window.__asset(p) : '/' + p);
  P.payList = function (opts) {
    const methods = ((this.state.settings && this.state.settings.payments) || {}).methods || {};
    const bank = methods.bank_transfer || {};
    const bal = (this.state.credit && this.state.credit.balance) || 0;
    const total = opts.total || 0;
    const on = k => methods[k] ? methods[k].enabled !== false : true;
    const cards = h('span', { style: { display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' } },
      h('img', { src: A('assets/payments/visa.svg'), alt: 'Visa', style: { height: 22 } }), h('img', { src: A('assets/payments/mastercard.svg'), alt: 'Mastercard', style: { height: 26 } }));
    const ROWS = [
      ['bank_transfer', h('span', { style: { fontSize: 15 } }, 'Direct bank transfer'), null],
      ['ipay88', h('img', { src: A('assets/payments/ipay88.jpg'), alt: 'iPay88', style: { height: 38, borderRadius: 3 } }), cards],
      ['card_test', h('img', { src: A('assets/payments/stripe.svg'), alt: 'Stripe', style: { height: 30 } }), cards],
      ['wallet', h('span', { style: { fontSize: 15 } }, 'Wallet payment (' + this.money(bal) + ')'), h('span', { role: 'button', tabIndex: 0, onClick: e => { e.stopPropagation(); this.setState({ tu_open: true }); }, style: { marginLeft: 'auto', border: '1px solid ' + TEAL, color: TEAL, borderRadius: 999, padding: '5px 14px', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' } }, 'Top up')],
    ].filter(r => on(r[0]) && (!opts.only || opts.only.indexOf(r[0]) >= 0));
    const radio = sel => h('span', { style: { height: 16, width: 16, borderRadius: '50%', flex: 'none', border: '1.5px solid ' + (sel ? TEAL : '#9aa0a6'), background: '#fff', boxShadow: sel ? 'inset 0 0 0 3px #fff' : 'none', backgroundColor: sel ? TEAL : '#fff' } });
    return h('div', { style: { border: '1px solid #e6e8eb' } },
      ROWS.map((r, i) => {
        const k = r[0], sel = opts.value === k, short = k === 'wallet' && bal + 0.001 < total;
        const pick = () => { if (!short) opts.onChange(k); };
        return h('div', { key: k, style: { borderTop: i ? '1px solid #e6e8eb' : 'none' } },
          h('div', { role: 'radio', 'aria-checked': sel, 'aria-disabled': short, tabIndex: 0, onClick: pick, onKeyDown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } },
            style: { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 14px', minHeight: 40, cursor: short ? 'default' : 'pointer' } },
            radio(sel), h('span', { style: { opacity: short ? .5 : 1 } }, r[1]),
            short ? h('span', { style: { fontSize: 12, color: FAINT } }, 'Not enough balance') : null,
            r[2]),
          sel && k === 'bank_transfer' ? h('div', { style: { background: '#f5f6f8', borderTop: '1px solid #e6e8eb', padding: '16px 18px 18px' } },
            h('div', { style: { fontSize: 15, fontWeight: 500, marginBottom: 6 } }, 'Direct bank transfer'),
            h('div', { style: { fontSize: 13.5, color: MUT, lineHeight: 1.6, marginBottom: 14 } }, 'Make your payment directly into our bank account. Please use your Order ID as the payment reference. Your order will not be shipped until the funds have cleared in our account.'),
            h('div', { style: { background: '#fff', display: 'flex', alignItems: 'center', gap: 22, padding: '18px 22px' } },
              h('span', { style: { height: 60, width: 60, borderRadius: '50%', background: '#FFC72C', display: 'grid', placeItems: 'center', flex: 'none', overflow: 'hidden' } }, h('img', { src: A('assets/payments/maybank.png'), alt: bank.bankName || 'Maybank', style: { width: 42, height: 'auto' } })),
              h('div', { style: { fontSize: 14, lineHeight: 1.6 } },
                h('div', null, bank.bankName || 'Maybank'),
                h('div', null, h('span', { style: { color: MUT } }, 'Acc no. '), h('b', { style: { fontWeight: 600 } }, bank.accountNo || '')),
                h('div', null, h('span', { style: { color: MUT } }, 'Name '), h('b', { style: { fontWeight: 600 } }, bank.accountName || ''))))) : null);
      }));
  };
})();

// ---------------------------------------------------------------- My Orders: a pending order's payment (user, 2026-09-29)
// "Pending for payment to be verified. Upload your payment slip here." — or pay now with iPay88 / Stripe / the wallet.
// The order stays Pending payment until it is paid online, or prepress confirms the slip (Payment received).
(function () {
  const C = window.PKComponent; if (!C) return;
  const P = C.prototype;
  P.orderPayPanel = function (o) {
    const u = this.state.user || {}, pay = o.payment || {};
    const mine = this.userType() === 'customer' && o.userId === u.id;
    const wrap = kids => h('div', { style: { marginTop: 16, background: '#fff8ec', border: '1px solid #f3dfb8', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 } }, kids);
    const title = h('div', { key: 't', style: { fontSize: 15, fontWeight: 600, color: '#8a5a00' } }, 'Pending for payment to be verified.');
    if (!mine) return wrap([title]);
    if (!this.state.credit && !this._tpCredit) { this._tpCredit = true; this.loadAccount(); }
    const refresh = d => { if (d && d.order) this.setState({ trackOrder: d.order }); else this.trackLookup(o.id); this.loadUserOrders(); this.loadAccount(); };
    const upload = e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return; const rd = new FileReader();
      rd.onload = () => { this.setState({ tpBusy: true, tpErr: null }); fetch('/api/orders/' + o.id + '/files', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, this.authHeaders()), body: JSON.stringify({ kind: 'proof', name: f.name, data: rd.result }) })
        .then(r => r.json()).then(d => { this.setState({ tpBusy: false, tpErr: d.error || null }); if (!d.error) refresh(d); }).catch(() => this.setState({ tpBusy: false, tpErr: 'Network error.' })); };
      rd.readAsDataURL(f); };
    const payNow = () => { const m = this.state.tpPay; if (!m) return this.setState({ tpErr: 'Choose how you would like to pay.' });
      this.setState({ tpBusy: true, tpErr: null });
      fetch('/api/orders/' + o.id + '/pay-now', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, this.authHeaders()), body: JSON.stringify({ method: m }) })
        .then(r => r.json()).then(d => { this.setState({ tpBusy: false, tpErr: d.error || null, tpPay: d.error ? m : null }); if (!d.error) refresh(d); }).catch(() => this.setState({ tpBusy: false, tpErr: 'Network error.' })); };
    const red = { display: 'inline-block', background: TEAL, color: '#fff', fontWeight: 500, fontSize: 14, padding: '10px 20px', cursor: this.state.tpBusy ? 'wait' : 'pointer' };
    return wrap([title,
      pay.proof
        ? h('div', { key: 's', style: { fontSize: 14, color: INK, lineHeight: 1.6 } }, 'Payment slip received (', h('b', null, pay.proof), '). We will confirm it shortly.')
        : h('div', { key: 's', style: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' } },
            h('span', { style: { fontSize: 14, color: INK } }, 'Upload your payment slip here.'),
            h('label', { style: red }, h('input', { type: 'file', accept: '.pdf,.png,.jpg,.jpeg,.webp,.heic', style: { display: 'none' }, onChange: upload }), this.state.tpBusy ? 'Uploading…' : 'Upload payment slip')),
      // a slip is in: prepress confirms it — no second payment offered
      pay.proof ? null : h('div', { key: 'o', style: { fontSize: 13, color: MUT, marginTop: 4 } }, 'Or pay now'),
      pay.proof ? null : h('div', { key: 'l', style: { background: '#fff' } }, this.payList({ value: this.state.tpPay || null, total: o.total, only: ['ipay88', 'card_test', 'wallet'], onChange: k => this.setState({ tpPay: k, tpErr: null }) })),
      this.state.tpErr ? h('div', { key: 'e', role: 'alert', style: { fontSize: 12.5, color: '#c0392b' } }, this.state.tpErr) : null,
      pay.proof ? null : h('div', { key: 'b' }, h('span', { role: 'button', tabIndex: 0, onClick: payNow, style: Object.assign({}, red, { opacity: this.state.tpPay ? 1 : .5 }) }, 'Pay ' + this.money(o.total)))]);
  };
})();
