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
    const consent = !!this.state.agConsent;
    const onFiles = fl => this.agUpload(fl).then(done => { if (mode === 'pick' && done.length === 1 && consent && onPick) onPick(done[0]); });
    const choose = a => {
      if (del) return this.setState({ agSel: Object.assign({}, sel, { [a.id]: !sel[a.id] }) });
      if (mode !== 'pick') return this.agPreview(a);
      if (!consent) return this.setState({ agErr: 'Please tick the box to confirm your artwork is final.' });
      if (onPick) onPick(a);
    };
    const badge = ext => h('div', { style: { display: 'grid', placeItems: 'center', height: '100%' } },
      h('div', { style: { position: 'relative', width: 44, height: 54, background: '#fff', border: '1px solid #d5d8dc', borderRadius: 3 } },
        h('span', { style: { position: 'absolute', left: -6, bottom: 9, background: TEAL, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 2 } }, (ext || 'file').toUpperCase().slice(0, 4))));
    const card = a => { const on = !!sel[a.id];
      return h('div', { key: a.id, role: 'button', tabIndex: 0, onClick: () => choose(a), onKeyDown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(a); } },
        title: a.name, style: { position: 'relative', background: '#fff', border: '1px solid ' + (on ? TEAL : HAIR), boxShadow: on ? '0 0 0 2px ' + TEAL : 'none', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' } },
        del ? h('span', { style: { position: 'absolute', top: 8, left: 8, height: 18, width: 18, borderRadius: 4, border: '2px solid ' + (on ? TEAL : '#b8bcc2'), background: on ? TEAL : '#fff', color: '#fff', fontSize: 12, lineHeight: '14px', textAlign: 'center', zIndex: 1 } }, on ? '✓' : '') : null,
        h('div', { style: { height: 110, background: '#e9ebee', display: 'grid', placeItems: 'center', overflow: 'hidden' } },
          a.thumb ? h('img', { src: a.thumb, alt: '', style: { maxHeight: '100%', maxWidth: '100%', display: 'block' } }) : badge(a.ext)),
        h('div', { style: { padding: '10px 10px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 5 } },
          h('div', { style: { fontSize: 12, color: INK, wordBreak: 'break-word', lineHeight: 1.35 } }, a.name),
          h('div', { style: { fontSize: 11, color: FAINT } }, fmtSize(a.size || 0)),
          h('div', { style: { fontSize: 10.5, color: '#c4c7cc' } }, fmtDate(a.at)))); };
    const btn = (label, onClick, kind, extra) => h('button', { type: 'button', onClick, style: Object.assign({ font: '600 12.5px Montserrat,sans-serif', letterSpacing: '.04em', border: kind === 'ghost' ? '1px solid ' + HAIR : 'none', background: kind === 'ghost' ? '#fff' : TEAL, color: kind === 'ghost' ? INK : '#fff', borderRadius: 6, padding: '9px 16px', cursor: 'pointer' }, extra || {}) }, label);
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
      mode === 'pick' ? h('label', { style: { display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: INK, background: consent ? '#f3faf5' : '#fdf2f2', border: '1px solid ' + (consent ? '#cfe8d6' : '#f3c6c5'), borderRadius: 8, padding: '10px 12px', cursor: 'pointer', lineHeight: 1.5 } },
        h('input', { type: 'checkbox', checked: consent, onChange: e => this.setState({ agConsent: e.target.checked, agErr: null }), style: { marginTop: 3, accentColor: TEAL } }),
        'I confirm this artwork is final. I understand it cannot be changed after my order is submitted.') : null,
      // drop zone
      h('label', { onDragOver: e => e.preventDefault(), onDrop: e => { e.preventDefault(); onFiles(e.dataTransfer.files); },
        style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', background: '#e6eaf2', border: '1px dashed #c4ccda', borderRadius: 8, padding: '26px 16px', cursor: 'pointer', color: '#6b7380', fontSize: 17 } },
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
          : (list.length ? btn('DELETE FILES', () => this.setState({ agDelMode: true, agSel: {} }), 'red') : null),
        h('label', { style: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: MUT } }, 'Sort By',
          h('select', { value: sort, onChange: e => this.setState({ agSort: e.target.value, agPage: 1 }), style: { font: '400 13px Montserrat,sans-serif', padding: '7px 10px', border: '1px solid ' + HAIR, borderRadius: 6, background: '#fff' } },
            h('option', { value: 'date_desc' }, 'Date Desc'), h('option', { value: 'date_asc' }, 'Date Asc'), h('option', { value: 'name' }, 'Name A–Z'))),
        pages > 1 ? h('span', { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: MUT } },
          h('button', { type: 'button', 'aria-label': 'Previous page', disabled: page <= 1, onClick: () => this.setState({ agPage: page - 1 }), style: { border: 'none', background: 'none', cursor: page > 1 ? 'pointer' : 'default', fontSize: 16, color: page > 1 ? INK : '#ccc' } }, '◀'),
          'Page ', h('b', { style: { color: INK } }, page), ' of ' + pages,
          h('button', { type: 'button', 'aria-label': 'Next page', disabled: page >= pages, onClick: () => this.setState({ agPage: page + 1 }), style: { border: 'none', background: 'none', cursor: page < pages ? 'pointer' : 'default', fontSize: 16, color: page < pages ? INK : '#ccc' } }, '▶')) : null));
  };
  // the modal: opened from a cart job's artwork slot (state.ag = { line, slot })
  P.artStorageModal = function () {
    const ag = this.state.ag; if (!ag) return null;
    const close = () => this.setState({ ag: null, agErr: null, agDelMode: false, agSel: {} });
    const pick = a => { this.cartSetArtwork(ag.line, ag.slot, a); close(); };
    return h('div', { key: 'ag', onClick: close, style: { position: 'fixed', inset: 0, zIndex: 98, background: 'rgba(15,20,25,.55)', display: 'grid', placeItems: 'start center', padding: '4vh 16px', overflow: 'auto' } },
      h('div', { onClick: e => e.stopPropagation(), role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Artwork Storage', style: { position: 'relative', background: '#fff', borderRadius: 10, width: '100%', maxWidth: 1180, padding: '20px 22px 18px', boxShadow: '0 24px 60px rgba(0,0,0,.3)' } },
        h('button', { type: 'button', onClick: close, 'aria-label': 'Close', style: { position: 'absolute', top: 12, right: 12, height: 30, width: 30, borderRadius: '50%', border: 'none', background: INK, color: '#fff', fontSize: 16, cursor: 'pointer' } }, '×'),
        h('div', { style: { marginBottom: 14, paddingRight: 40 } },
          h('div', { style: { fontSize: 20, fontWeight: 700, letterSpacing: '.02em', textTransform: 'uppercase' } }, 'Artwork Storage'),
          h('div', { style: { fontSize: 13, color: MUT, marginTop: 2 } }, 'Choose & click to select the file for ' + (ag.label || 'this job'))),
        this.agPanel('pick', pick)));
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
  P.cartArtworkBlock = function (it, i) {
    if (this.state.user) this.agLoad();
    const n = this.artSlots(it), lib = this.state.agList || [];
    const link = (label, on) => h('span', { role: 'button', tabIndex: 0, onClick: on, onKeyDown: e => { if (e.key === 'Enter') on(); }, style: { fontSize: 12.5, fontWeight: 600, color: '#2f7fd1', cursor: 'pointer' } }, label);
    const open = k => this.setState({ ag: { line: i, slot: k, label: it.name + (n > 1 ? ' · Artwork ' + (k + 1) : '') }, agErr: null });
    const rows = [];
    for (let k = 0; k < n; k++) {
      const a = (it.artworks || [])[k], full = a && (lib.find(x => x.id === a.id) || a);
      const label = n > 1 ? 'Artwork ' + (k + 1) : 'Artwork';
      rows.push(h('div', { key: k, style: { display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderTop: k ? '1px solid ' + LINE : 'none', flexWrap: 'wrap' } },
        h('div', { style: { fontSize: 12.5, fontWeight: 600, minWidth: 74 } }, label),
        a ? [
          h('div', { key: 't', style: { height: 64, width: 88, borderRadius: 6, background: '#e2e4e7', display: 'grid', placeItems: 'center', overflow: 'hidden', flex: 'none' } },
            full.thumb ? h('img', { src: full.thumb, alt: '', style: { maxHeight: '100%', maxWidth: '100%' } }) : h('span', { style: { fontSize: 10, fontWeight: 700, color: '#fff', background: TEAL, borderRadius: 2, padding: '2px 6px' } }, (full.name.split('.').pop() || 'file').toUpperCase().slice(0, 4))),
          h('div', { key: 'n', style: { minWidth: 0, flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 5 } },
            h('div', { style: { fontSize: 12.5, color: INK, wordBreak: 'break-word' } }, full.name),
            h('div', { style: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5, color: FAINT } },
              link('Preview', () => this.agPreview(full)), '|', link('Change', () => open(k)), '|', link('Remove', () => this.cartSetArtwork(i, k, null))))]
          : it.artLater ? h('div', { style: { display: 'flex', gap: 12, alignItems: 'center', fontSize: 12.5, color: MUT } }, 'Upload later', link('Upload now', () => this.cartArtLater(i, false)))
            : h('div', { style: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' } },
              h('span', { role: 'button', tabIndex: 0, onClick: () => open(k), onKeyDown: e => { if (e.key === 'Enter') open(k); }, style: { background: TEAL, color: '#fff', fontWeight: 600, fontSize: 13, borderRadius: 8, padding: '8px 16px', cursor: 'pointer' } }, 'Upload artwork'),
              k === 0 ? h('span', { role: 'button', tabIndex: 0, onClick: () => this.cartArtLater(i, true), style: { fontSize: 12.5, fontWeight: 600, color: TEAL, cursor: 'pointer' } }, 'Upload files later') : null)));
    }
    return h('div', { key: 'art', style: { marginTop: 14, background: ALT, borderRadius: 10, padding: '13px 15px' } },
      h('div', { style: { fontSize: 12.5, fontWeight: 600, marginBottom: 4 } }, 'Artwork upload'),
      rows);
  };
})();
