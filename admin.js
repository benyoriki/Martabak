'use strict';
/* =========================================================
   Martabak Mas Bejo V2 — admin.js (Admin Command Center)
   Memakai Repo/h/rp dari script.js. Data tetap di localStorage
   dengan key mb1_* (products, settings, orders, messages).
   CATATAN: file admin.js versi lama TIDAK ada di ZIP yang diterima,
   sehingga modul ini ditulis ulang dari skema data aktual.
   ========================================================= */
(function () {
  const TABS = [['dash', 'Dashboard', 'dash'], ['orders', 'Pesanan', 'orders'], ['menu', 'Menu', 'menu'], ['promo', 'Promo', 'promo'], ['inbox', 'Inbox', 'mail'], ['cust', 'Pelanggan', 'users'], ['report', 'Laporan', 'chart'], ['settings', 'Pengaturan', 'gear'], ['backup', 'Backup', 'dl']];
  const NEXT = { 'Baru': ['Dikonfirmasi', 'Konfirmasi'], 'Dikonfirmasi': ['Diproses', 'Mulai Proses'], 'Diproses': ['Siap Diambil', 'Siap Diambil / Diantar'], 'Siap Diambil': ['Selesai', 'Tandai Selesai'] };
  const dayOf = t => new Date(t).toLocaleDateString('sv', { timeZone: 'Asia/Jakarta' });
  const ico = (id, s = 20) => { const n = 'http://www.w3.org/2000/svg', v = document.createElementNS(n, 'svg'), u = document.createElementNS(n, 'use'); v.setAttribute('width', s); v.setAttribute('height', s); v.setAttribute('class', 'ico'); u.setAttribute('href', '#i-' + id); v.append(u); return v };
  const main = $('#main'), dlg = $('#dlg');
  let tab = 'dash', oFilter = 'Semua', oQ = '', mQ = '', rFrom = '', rTo = '', openMsg = null;
  const orders = () => Repo.get('orders'), prods = () => Repo.get('products').sort((a, b) => a.order - b.order), msgs = () => Repo.get('messages'), sett = () => Repo.get('settings');
  const valid = o => o.status !== 'Dibatalkan', done = o => o.status === 'Selesai';
  const stCls = s => ({ 'Baru': 'b', 'Dikonfirmasi': 'c', 'Diproses': 'p', 'Siap Diambil': 'r', 'Selesai': 'g', 'Dibatalkan': 'x' }[s] || 'b');
  const pill = (t, c) => h('span', { class: 'pill ' + (c || stCls(t)) }, t);
  const num = v => Math.max(0, Math.round(+String(v).replace(/[^\d.]/g, '')) || 0);

  /* ---------- Login ---------- */
  const authed = () => { try { return sessionStorage.getItem('mbAdmin') === '1' } catch (e) { return false } };
  const enter = () => { try { sessionStorage.setItem('mbAdmin', '1') } catch (e) { } start() };
  $('#demoA').onclick = enter;
  $('#lf').onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); if (f.get('u').trim().toLowerCase() === 'admin@masbejo.demo' && f.get('p') === 'admin123') enter(); else toast('Email atau password salah', 1) };
  $('#out').onclick = () => { try { sessionStorage.removeItem('mbAdmin') } catch (e) { } location.href = 'index.html' };
  dialogsInit();
  function dialogsInit() { let dn = false; dlg.addEventListener('mousedown', e => dn = e.target === dlg); dlg.addEventListener('click', e => { if (dn && e.target === dlg) dlg.close(); dn = false }) }

  /* ---------- Modal ---------- */
  function modal(title, ...c) { dlg.replaceChildren(h('div', { class: 'dc' }, h('button', { class: 'x', onclick: () => dlg.close(), 'aria-label': 'Tutup' }, '✕'), h('h3', {}, title), ...c)); if (!dlg.open) dlg.showModal(); dlg.scrollTop = 0 }
  const confirmD = (title, text, label, fn, danger = true) => modal(title, h('p', {}, text), h('div', { class: 'row end' }, h('button', { class: 'chip', onclick: () => dlg.close() }, 'Batal'), h('button', { class: 'btn ' + (danger ? 'red' : 'green'), onclick: () => { dlg.close(); fn() } }, label)));

  /* ---------- Shell ---------- */
  function counts() { const o = orders().filter(x => x.status === 'Baru').length, m = msgs().filter(x => x.status === 'Baru').length; return { o, m } }
  function drawTabs() {
    const c = counts();
    $('#tabs').replaceChildren(...TABS.map(([k, t, i]) => h('button', { class: k === tab ? 'on' : '', 'aria-current': k === tab ? 'page' : null, onclick: () => go(k) }, ico(i), h('span', {}, t), k === 'orders' && c.o ? h('i', { class: 'nb' }, c.o) : k === 'inbox' && c.m ? h('i', { class: 'nb' }, c.m) : null)));
    const n = c.o + c.m; $('#bn').hidden = !n; $('#bn').textContent = n;
    const S = sett(); $('#stSw').checked = !S.closed; $('#stLbl').textContent = S.closed ? 'Tutup (manual)' : 'Buka';
  }
  function go(k) { tab = k; location.hash = k; render(); window.scrollTo(0, 0) }
  function render() {
    $('#ttl').textContent = TABS.find(t => t[0] === tab)[1]; drawTabs(); $('#np').hidden = true;
    main.replaceChildren(); ({ dash, orders: ordersV, menu: menuV, promo: promoV, inbox: inboxV, cust: custV, report: reportV, settings: settingsV, backup: backupV })[tab](main);
  }
  $('#stSw').onchange = e => { const S = sett(); S.closed = !e.target.checked; Repo.save('settings', S); render(); toast(S.closed ? 'Toko ditandai TUTUP di website' : 'Toko ditandai BUKA di website') };
  $('#bell').onclick = () => {
    const np = $('#np'), c = counts(); if (!np.hidden) { np.hidden = true; return }
    np.replaceChildren(...[h('b', {}, 'Notifikasi'), c.o || c.m ? null : h('p', { class: 'mu' }, 'Tidak ada yang baru.'), c.o ? h('button', { class: 'nl', onclick: () => { oFilter = 'Baru'; go('orders') } }, c.o + ' pesanan baru') : null, c.m ? h('button', { class: 'nl', onclick: () => go('inbox') }, c.m + ' pesan baru di inbox') : null].filter(Boolean)); np.hidden = false;
  };
  /* sinkron bila toko (tab lain) menulis data baru */
  addEventListener('storage', e => { if (e.key && e.key.startsWith(K) && !dlg.open && !$('#app').hidden && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) render() });

  /* ---------- Komponen ---------- */
  const panel = (title, ...c) => h('section', { class: 'pn' }, title ? h('h2', {}, title) : null, ...c);
  const stat = (i, label, val, sub, cl) => h('div', { class: 'sc ' + (cl || '') }, h('span', { class: 'sci' }, ico(i, 22)), h('div', {}, h('small', {}, label), h('b', {}, val), sub ? h('em', {}, sub) : null));
  const empty = t => h('p', { class: 'empty' }, t);
  const kfmt = n => n >= 1e6 ? (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'jt' : n >= 1e3 ? Math.round(n / 1e3) + 'rb' : String(n);
  function lastDays(n) { const r = []; for (let i = n - 1; i >= 0; i--) r.push(new Date(Date.now() - i * 864e5).toLocaleDateString('sv', { timeZone: 'Asia/Jakarta' })); return r }
  function barChart(days, vals, label) {
    const NS = 'http://www.w3.org/2000/svg', W = 560, H = 210, L = 44, B = 28, T = 14, mx = Math.max(...vals, 1), sx = (W - L - 8) / days.length;
    const el = (t, a, tx) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (tx != null) e.textContent = tx; return e };
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': label });
    [0, .5, 1].forEach(f => { const y = T + (H - T - B) * (1 - f); svg.append(el('line', { x1: L, x2: W - 4, y1: y, y2: y, class: 'gl' }), el('text', { x: L - 6, y: y + 4, 'text-anchor': 'end', class: 'ax' }, kfmt(Math.round(mx * f)))) });
    days.forEach((d, i) => { const hh = (H - T - B) * vals[i] / mx, x = L + i * sx + sx * .18, w = sx * .64; svg.append(el('rect', { x, y: T + (H - T - B) - hh, width: w, height: Math.max(hh, vals[i] ? 2 : 0), rx: 4, class: 'bc' }), el('text', { x: x + w / 2, y: H - 9, 'text-anchor': 'middle', class: 'ax' }, d.slice(8) + '/' + d.slice(5, 7)));
      const t = el('title', {}, d + ': ' + rp(vals[i])); svg.lastChild.append(t) });
    return svg;
  }

  /* ---------- DASHBOARD ---------- */
  function dash(m) {
    const os = orders(), S = sett(), ps = prods(), td = today(), vo = os.filter(valid);
    const omz = os.filter(done).reduce((a, o) => a + o.total, 0), omzT = os.filter(o => done(o) && dayOf(o.time) === td).reduce((a, o) => a + o.total, 0);
    const proc = os.filter(o => ['Dikonfirmasi', 'Diproses', 'Siap Diambil'].includes(o.status)).length;
    const promoN = ps.filter(p => p.on && promoOn(p)).length;
    m.append(h('div', { class: 'wl' }, h('div', {}, h('h2', {}, 'Halo, Admin Mas Bejo 👋'), h('p', {}, 'Kelola pesanan, menu, dan promo di sini.')), h('small', {}, 'Data tersimpan di browser ini (localStorage).')));
    m.append(h('div', { class: 'sg' },
      stat('orders', 'Total Pesanan', os.length, vo.length + ' tidak dibatalkan', 'b'), stat('bell', 'Pesanan Baru', os.filter(o => o.status === 'Baru').length, 'perlu dikonfirmasi', 'r'),
      stat('flame', 'Sedang Diproses', proc, 'konfirmasi → siap', 'y'), stat('check', 'Selesai', os.filter(done).length, 'pesanan selesai', 'g'),
      stat('wallet', 'Omzet (Selesai)', rp(omz), 'hari ini ' + rp(omzT), 'y'), stat('menu', 'Menu Aktif', ps.filter(p => p.on).length, ps.length + ' total menu', 'b'), stat('promo', 'Promo Aktif', promoN, 'sedang berlaku', 'r'), stat('mail', 'Inbox Baru', msgs().filter(x => x.status === 'Baru').length, msgs().length + ' pesan', 'g')));
    const days = lastDays(7), vals = days.map(d => os.filter(o => done(o) && dayOf(o.time) === d).reduce((a, o) => a + o.total, 0));
    const grid = h('div', { class: 'two' });
    grid.append(panel('Grafik Omzet 7 Hari Terakhir', vals.some(Boolean) ? barChart(days, vals, 'Omzet pesanan selesai 7 hari terakhir') : empty('Belum ada pesanan selesai dalam 7 hari terakhir. Grafik dihitung dari pesanan berstatus Selesai.')));
    const top = {}; vo.forEach(o => o.items.forEach(i => { top[i.name] = (top[i.name] || 0) + i.qty })); const tl = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5), tm = tl[0] ? tl[0][1] : 1;
    grid.append(panel('Menu Terlaris', tl.length ? h('ol', { class: 'tp' }, tl.map(([n, q]) => h('li', {}, h('span', {}, n), h('b', {}, q + ' pcs'), h('i', { style: `width:${Math.round(q / tm * 100)}%` })))) : empty('Belum ada pesanan.')));
    m.append(grid);
    m.append(panel('Pesanan Terbaru', h('div', { class: 'row end tiny' }, h('button', { class: 'chip sm', onclick: () => go('orders') }, 'Lihat semua ›')), os.length ? ordTable(os.slice().sort((a, b) => b.time.localeCompare(a.time)).slice(0, 5)) : empty('Belum ada pesanan. Pesanan dari website akan muncul di sini (pada browser yang sama).')));
  }

  /* ---------- PESANAN ---------- */
  function ordTable(list) {
    return h('div', { class: 'tw' }, h('table', { class: 'rk' }, h('thead', {}, h('tr', {}, ['No', 'Waktu', 'Pelanggan', 'Total', 'Bayar', 'Status', ''].map(t => h('th', {}, t)))),
      h('tbody', {}, list.map(o => h('tr', {}, h('td', { 'data-label': 'No' }, h('b', {}, o.no)), h('td', { 'data-label': 'Waktu' }, fmt(o.time)), h('td', { 'data-label': 'Pelanggan' }, o.name), h('td', { 'data-label': 'Total' }, rp(o.total)), h('td', { 'data-label': 'Bayar' }, o.payStatus || o.pay), h('td', { 'data-label': 'Status' }, pill(o.status)), h('td', {}, h('button', { class: 'btn gold sm', onclick: () => orderD(o.id) }, 'Detail')))))));
  }
  function ordersV(m) {
    const all = orders().sort((a, b) => b.time.localeCompare(a.time)), fl = ['Semua', ...ST];
    const list = all.filter(o => (oFilter === 'Semua' || o.status === oFilter) && (oQ === '' || (o.no + o.name + o.phone).toLowerCase().includes(oQ)));
    const q = h('input', { type: 'search', placeholder: 'Cari no. pesanan / nama / HP…', value: oQ, 'aria-label': 'Cari pesanan' }); q.oninput = () => { oQ = q.value.toLowerCase().trim(); const pos = q.selectionStart; ordersV(m2()); const n = $('#main input[type=search]'); n && (n.focus(), n.setSelectionRange(pos, pos)) };
    const m2 = () => { main.replaceChildren(); return main };
    m.append(h('div', { class: 'tb' }, h('div', { class: 'fl' }, fl.map(s => h('button', { class: 'chip sm' + (s === oFilter ? ' on' : ''), onclick: () => { oFilter = s; render() } }, s + (s === 'Semua' ? ' (' + all.length + ')' : ' (' + all.filter(o => o.status === s).length + ')')))), q));
    m.append(panel('', list.length ? ordTable(list) : empty(all.length ? 'Tidak ada pesanan yang cocok.' : 'Belum ada pesanan.')));
  }
  function orderD(id) {
    const o = orders().find(x => x.id === id); if (!o) return;
    const set = (patch, msgT) => { const l = orders(), x = l.find(i => i.id === id); Object.assign(x, patch); if (Repo.save('orders', l)) { toast(msgT || 'Tersimpan'); render(); orderD(id) } };
    const nx = NEXT[o.status], sel = h('select', { 'aria-label': 'Ubah status' }, ST.map(s => h('option', { value: s, selected: s === o.status ? '' : null }, s)));
    const delivery = o.method === 'Delivery', waMsg = `Halo ${o.name}, pesanan ${o.no} di ${sett().name} statusnya: ${o.status}${delivery && o.status === 'Siap Diambil' ? ' (siap diantar)' : ''}. Total ${rp(o.total)}. Terima kasih!`;
    modal('Pesanan ' + o.no, h('div', { class: 'kv' }, h('span', {}, 'Status'), pill(o.status), h('span', {}, 'Waktu'), h('b', {}, fmt(o.time)), h('span', {}, 'Pelanggan'), h('b', {}, o.name), h('span', {}, 'WhatsApp'), h('b', {}, o.phone), h('span', {}, 'Pengambilan'), h('b', {}, delivery ? 'Delivery' : 'Ambil di tempat'), delivery ? h('span', {}, 'Alamat') : null, delivery ? h('b', {}, o.address || '-') : null, h('span', {}, 'Pembayaran'), h('b', {}, (o.pay === 'QRIS' ? 'QRIS' : 'Tunai') + ' · ' + (o.payStatus || '-')), h('span', {}, 'Catatan'), h('b', {}, o.note || '-')),
      h('div', { class: 'items' }, o.items.map(i => h('div', { class: 'ln' }, h('span', {}, i.name + ' ×' + i.qty), h('b', {}, rp(i.price * i.qty)))), h('div', { class: 'ln tt' }, h('span', {}, 'Total'), h('b', {}, rp(o.total)))),
      h('div', { class: 'row' }, nx ? h('button', { class: 'btn red', onclick: () => { const p = { status: nx[0] }; if (nx[0] === 'Selesai' && o.payStatus !== 'Lunas') p.payStatus = 'Lunas'; set(p, 'Status: ' + nx[0]) } }, nx[1]) : null,
        o.payStatus !== 'Lunas' && valid(o) ? h('button', { class: 'btn green', onclick: () => set({ payStatus: 'Lunas' }, 'Ditandai lunas') }, 'Tandai Lunas') : null,
        h('a', { class: 'btn ghost', target: '_blank', rel: 'noopener', href: waLink(o.phone.replace(/^0/, '62').replace(/^\+/, ''), waMsg) }, 'Kabari via WhatsApp')),
      h('label', {}, 'Ubah status manual', sel), h('div', { class: 'row end' }, valid(o) ? h('button', { class: 'btn dng', onclick: () => confirmD('Batalkan pesanan?', 'Pesanan ' + o.no + ' akan ditandai Dibatalkan dan tidak dihitung dalam omzet.', 'Ya, Batalkan', () => set({ status: 'Dibatalkan' }, 'Pesanan dibatalkan')) }, 'Batalkan Pesanan') : null, h('button', { class: 'chip', onclick: () => set({ status: sel.value }, 'Status diperbarui') }, 'Simpan status')));
  }

  /* ---------- MENU ---------- */
  function readImg(file, max = 720) {
    return new Promise((res, rej) => {
      if (!file || !file.type.startsWith('image/')) { rej(new Error('Pilih file gambar (JPG/PNG/WebP).')); return }
      const fr = new FileReader(); fr.onerror = () => rej(new Error('Gagal membaca file.'));
      fr.onload = () => { const im = new Image(); im.onerror = () => rej(new Error('File gambar tidak valid.')); im.onload = () => { const r = Math.min(1, max / im.width), c = document.createElement('canvas'); c.width = Math.round(im.width * r); c.height = Math.round(im.height * r); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); let q = .8, d = c.toDataURL('image/webp', q); if (!d.startsWith('data:image/webp')) d = c.toDataURL('image/jpeg', q); while (d.length > 190000 && q > .4) { q -= .1; d = c.toDataURL(d.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg', q) } res(d) }; im.src = fr.result };
      fr.readAsDataURL(file);
    });
  }
  const imgField = (label, getV, setV, kind, hint) => {
    const prev = h('img', { alt: '', class: 'prev', width: 120, height: 90 }), path = h('input', { placeholder: 'mis. manis.jpg (file di repo GitHub)', 'aria-label': label + ' nama file' }), fi = h('input', { type: 'file', accept: 'image/*', 'aria-label': 'Unggah ' + label });
    const show = () => { const v = getV(); prev.src = v || art(kind); prev.onerror = () => { prev.onerror = null; prev.src = art(kind) }; path.value = v && !v.startsWith('data:') ? v : '' };
    fi.onchange = async () => { try { setV(await readImg(fi.files[0])); show(); toast('Foto dimuat (belum tersimpan)') } catch (e) { toast(e.message, 1) } };
    path.oninput = () => { setV(path.value.trim()); prev.src = path.value.trim() || art(kind) };
    show();
    return h('div', { class: 'imgf' }, h('label', {}, label), h('div', { class: 'row' }, prev, h('div', { class: 'grow' }, fi, h('label', {}, 'atau nama file di repo', path), h('button', { type: 'button', class: 'chip sm', onclick: () => { setV(''); show() } }, 'Hapus foto'))), h('small', { class: 'mu' }, hint));
  };
  function menuV(m) {
    const ps = prods(), list = ps.filter(p => !mQ || (p.name + p.cat).toLowerCase().includes(mQ));
    const q = h('input', { type: 'search', placeholder: 'Cari menu…', value: mQ, 'aria-label': 'Cari menu' }); q.oninput = () => { mQ = q.value.toLowerCase().trim(); const pos = q.selectionStart; render(); const n = $('#main input[type=search]'); n && (n.focus(), n.setSelectionRange(pos, pos)) };
    m.append(h('div', { class: 'tb' }, h('button', { class: 'btn red', onclick: () => menuD() }, '+ Tambah Menu'), q));
    const move = (p, d) => { const l = prods(), i = l.findIndex(x => x.id === p.id), j = i + d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; l.forEach((x, n) => x.order = n + 1); Repo.save('products', l) && render() };
    m.append(panel('', list.length ? h('div', { class: 'mlist' }, list.map(p => h('div', { class: 'mi' + (p.on ? '' : ' off') }, h('img', { src: p.img || FILES[p.id] || art(kindOf(p)), alt: '', width: 72, height: 54, loading: 'lazy', onerror: e => { if (!e.target.dataset.fb) { e.target.dataset.fb = 1; e.target.src = art(kindOf(p)) } } }),
      h('div', { class: 'mt' }, h('b', {}, p.name), h('small', {}, p.cat + ' · ' + p.desc), h('div', { class: 'pr' }, h('b', {}, rp(price(p))), promoOn(p) ? h('s', {}, rp(p.price)) : null, p.best ? pill('Terlaris', 'c') : null, promoOn(p) ? pill('Promo', 'b') : null, p.stock ? null : pill('Habis', 'x'), p.on ? null : pill('Nonaktif', 'x'))),
      h('div', { class: 'ma' }, h('button', { class: 'chip sm', onclick: () => move(p, -1), 'aria-label': 'Naikkan', title: 'Naikkan' }, '↑'), h('button', { class: 'chip sm', onclick: () => move(p, 1), 'aria-label': 'Turunkan', title: 'Turunkan' }, '↓'),
        h('button', { class: 'chip sm', onclick: () => { p.on = !p.on; Repo.put('products', p) && render() } }, p.on ? 'Nonaktifkan' : 'Aktifkan'), h('button', { class: 'btn gold sm', onclick: () => menuD(p.id) }, 'Edit'), h('button', { class: 'btn dng sm', onclick: () => confirmD('Hapus menu?', '"' + p.name + '" akan dihapus permanen. Pesanan lama tetap tersimpan.', 'Hapus', () => { Repo.del('products', p.id) && (toast('Menu dihapus'), render()) }) }, 'Hapus'))))) : empty('Menu tidak ditemukan.')));
  }
  function menuD(id) {
    const old = id ? prods().find(p => p.id === id) : null, p = old ? { ...old } : { id: 'P' + uid(), name: '', cat: 'Manis', desc: '', price: 0, promo: 0, promoStart: '', promoEnd: '', img: '', on: true, best: false, stock: true, order: prods().length + 1 };
    const f = h('form', { class: 'fm' });
    const inp = (lab, k, o = {}) => { const i = h(o.tag || 'input', { type: o.type, required: o.req ? '' : null, maxlength: o.max, inputmode: o.im, placeholder: o.ph, rows: o.rows }); i.value = o.num && !p[k] ? '' : (p[k] ?? ''); i.oninput = () => p[k] = o.num ? num(i.value) : i.value; return h('label', {}, lab, i) };
    const cat = h('select', {}, ['Manis', 'Asin', 'Spesial'].map(c => h('option', { value: c, selected: c === p.cat ? '' : null }, c))); cat.onchange = () => p.cat = cat.value;
    const chk = (lab, k) => { const c = h('input', { type: 'checkbox' }); c.checked = !!p[k]; c.onchange = () => p[k] = c.checked; return h('label', { class: 'ck' }, c, lab) };
    f.append(inp('Nama menu *', 'name', { req: 1, max: 60 }), h('label', {}, 'Kategori', cat), inp('Deskripsi singkat', 'desc', { tag: 'textarea', rows: 2, max: 140 }),
      h('div', { class: 'two2' }, inp('Harga (Rp) *', 'price', { req: 1, num: 1, im: 'numeric' }), inp('Harga promo (Rp, opsional)', 'promo', { num: 1, im: 'numeric' }), inp('Promo mulai', 'promoStart', { type: 'date' }), inp('Promo berakhir', 'promoEnd', { type: 'date' })),
      imgField('Foto menu', () => p.img, v => p.img = v, kindOf(p), 'Foto unggahan tersimpan di browser ini saja. Agar tampil untuk semua pengunjung, simpan file di repo dan isi nama file-nya.'),
      h('div', { class: 'row' }, chk('Aktif (tampil di website)', 'on'), chk('Stok tersedia', 'stock'), chk('Terlaris', 'best')),
      h('div', { class: 'row end' }, h('button', { type: 'button', class: 'chip', onclick: () => dlg.close() }, 'Batal'), h('button', { class: 'btn red' }, old ? 'Simpan Perubahan' : 'Tambah Menu')));
    f.onsubmit = e => {
      e.preventDefault(); p.name = p.name.trim(); p.desc = (p.desc || '').trim();
      if (p.name.length < 2) return toast('Nama menu minimal 2 huruf', 1); if (!(p.price > 0)) return toast('Harga harus lebih dari 0', 1);
      if (p.promo && p.promo >= p.price) return toast('Harga promo harus lebih kecil dari harga normal', 1); if (p.promoEnd && p.promoStart && p.promoEnd < p.promoStart) return toast('Tanggal promo berakhir sebelum mulai', 1);
      if (!p.promo) { p.promoStart = ''; p.promoEnd = '' }
      if (Repo.put('products', p)) { dlg.close(); toast(old ? 'Menu diperbarui' : 'Menu ditambahkan'); render() }
    };
    modal(old ? 'Edit Menu' : 'Tambah Menu', f);
  }

  /* ---------- PROMO ---------- */
  function promoStatus(p) { if (!(p.promo > 0 && p.promo < p.price)) return ['Tidak ada', 'x']; const t = today(); if (p.promoStart && p.promoStart > t) return ['Terjadwal', 'p']; if (p.promoEnd && p.promoEnd < t) return ['Berakhir', 'x']; return ['Aktif', 'g'] }
  function promoV(m) {
    const S = sett(), ps = prods(), t = h('input', { value: S.promoTitle, maxlength: 60 }), x = h('textarea', { rows: 2, maxlength: 160 }); x.value = S.promoText;
    m.append(panel('Banner Promo di Website', h('label', {}, 'Judul promo', t), h('label', {}, 'Teks promo', x), h('div', { class: 'row end' }, h('button', { class: 'btn red', onclick: () => { const s = sett(); s.promoTitle = t.value.trim(); s.promoText = x.value.trim(); Repo.save('settings', s) && toast('Banner promo disimpan') } }, 'Simpan Banner'))));
    m.append(panel('Promo per Menu', h('p', { class: 'mu' }, 'Atur harga diskon dan periode untuk tiap menu. Promo otomatis aktif/berakhir sesuai tanggal.'), h('div', { class: 'tw' }, h('table', { class: 'rk' }, h('thead', {}, h('tr', {}, ['Menu', 'Harga', 'Promo', 'Periode', 'Status', ''].map(c => h('th', {}, c)))),
      h('tbody', {}, ps.map(p => { const [s, c] = promoStatus(p), pr = p.promo > 0 && p.promo < p.price; return h('tr', {}, h('td', { 'data-label': 'Menu' }, h('b', {}, p.name)), h('td', { 'data-label': 'Harga' }, rp(p.price)), h('td', { 'data-label': 'Promo' }, pr ? rp(p.promo) + ' (−' + Math.round((1 - p.promo / p.price) * 100) + '%)' : '-'), h('td', { 'data-label': 'Periode' }, pr ? (p.promoStart || '…') + ' s/d ' + (p.promoEnd || '…') : '-'), h('td', { 'data-label': 'Status' }, pill(s, c)), h('td', {}, h('button', { class: 'btn gold sm', onclick: () => promoD(p.id) }, pr ? 'Edit' : 'Atur Promo'))) })))) ));
  }
  function promoD(id) {
    const old = prods().find(p => p.id === id), p = { ...old }, f = h('form', { class: 'fm' });
    const pr = h('input', { inputmode: 'numeric', placeholder: 'Contoh: ' + Math.round(old.price * .9) }), a = h('input', { type: 'date' }), b = h('input', { type: 'date' }); pr.value = p.promo || ''; a.value = p.promoStart || ''; b.value = p.promoEnd || '';
    f.append(h('p', {}, h('b', {}, old.name), ' — harga normal ', h('b', {}, rp(old.price))), h('label', {}, 'Harga promo (Rp)', pr), h('div', { class: 'two2' }, h('label', {}, 'Mulai', a), h('label', {}, 'Berakhir', b)),
      h('div', { class: 'row end' }, old.promo ? h('button', { type: 'button', class: 'btn dng', onclick: () => { const q = { ...old, promo: 0, promoStart: '', promoEnd: '' }; Repo.put('products', q) && (dlg.close(), toast('Promo diakhiri'), render()) } }, 'Hapus Promo') : null, h('button', { class: 'btn red' }, 'Simpan Promo')));
    f.onsubmit = e => { e.preventDefault(); const v = num(pr.value); if (!v) return toast('Isi harga promo', 1); if (v >= old.price) return toast('Harga promo harus lebih kecil dari harga normal', 1); if (a.value && b.value && b.value < a.value) return toast('Tanggal berakhir sebelum mulai', 1); Object.assign(p, { promo: v, promoStart: a.value, promoEnd: b.value }); if (Repo.put('products', p)) { dlg.close(); toast('Promo disimpan'); render() } };
    modal('Atur Promo', f);
  }

  /* ---------- INBOX ---------- */
  function inboxV(m) {
    const l = msgs().sort((a, b) => b.time.localeCompare(a.time)), cur = l.find(x => x.id === openMsg), wrap = h('div', { class: 'inbox' + (cur ? ' open' : '') });
    const list = h('div', { class: 'ml' }, l.length ? l.map(x => h('button', { class: 'mr' + (x.status === 'Baru' ? ' nw' : '') + (cur && cur.id === x.id ? ' on' : ''), onclick: () => { openMsg = x.id; if (x.status === 'Baru') { const a = msgs(), z = a.find(i => i.id === x.id); z.status = 'Dibaca'; Repo.save('messages', a) } render() } }, h('b', {}, x.name), h('small', {}, fmt(x.time)), h('span', {}, x.text))) : empty('Belum ada pesan. Pesan dari tombol Chat Admin di website (browser yang sama) muncul di sini.'));
    const det = h('div', { class: 'md' }, cur ? [h('button', { class: 'chip sm bk', onclick: () => { openMsg = null; render() } }, '‹ Kembali'), h('h3', {}, cur.name), h('p', { class: 'mu' }, cur.phone + ' · ' + fmt(cur.time)), h('div', { class: 'bub' }, cur.text),
      h('div', { class: 'row' }, h('a', { class: 'btn green', target: '_blank', rel: 'noopener', href: waLink(cur.phone.replace(/\D/g, '').replace(/^0/, '62'), 'Halo ' + cur.name + ', terima kasih sudah menghubungi ' + sett().name + '. ') }, 'Balas via WhatsApp'), h('button', { class: 'btn dng', onclick: () => confirmD('Hapus pesan?', 'Pesan dari ' + cur.name + ' akan dihapus.', 'Hapus', () => { Repo.del('messages', cur.id); openMsg = null; render() }) }, 'Hapus'))] : empty('Pilih pesan untuk dibaca.'));
    wrap.append(list, det); m.append(panel('', wrap));
  }

  /* ---------- PELANGGAN (dihitung dari pesanan & inbox) ---------- */
  const normPh = p => { p = String(p).replace(/\D/g, ''); return p.startsWith('0') ? '62' + p.slice(1) : p };
  function custV(m) {
    const map = {};
    orders().forEach(o => { const k = normPh(o.phone), c = map[k] || (map[k] = { name: o.name, phone: o.phone, n: 0, spent: 0, last: '' }); if (valid(o)) { c.n++; if (done(o)) c.spent += o.total } if (o.time > c.last) { c.last = o.time; c.name = o.name } });
    msgs().forEach(x => { const k = normPh(x.phone); if (!map[k]) map[k] = { name: x.name, phone: x.phone, n: 0, spent: 0, last: x.time } });
    const l = Object.values(map).sort((a, b) => b.last.localeCompare(a.last));
    m.append(panel('Daftar Pelanggan', h('p', { class: 'mu' }, 'Dikelompokkan otomatis dari nomor HP pada pesanan dan inbox. Total belanja = pesanan Selesai.'), l.length ? h('div', { class: 'tw' }, h('table', { class: 'rk' }, h('thead', {}, h('tr', {}, ['Nama', 'HP', 'Pesanan', 'Total Belanja', 'Terakhir', ''].map(c => h('th', {}, c)))), h('tbody', {}, l.map(c => h('tr', {}, h('td', { 'data-label': 'Nama' }, h('b', {}, c.name)), h('td', { 'data-label': 'HP' }, c.phone), h('td', { 'data-label': 'Pesanan' }, c.n), h('td', { 'data-label': 'Total' }, rp(c.spent)), h('td', { 'data-label': 'Terakhir' }, fmt(c.last)), h('td', {}, h('a', { class: 'btn green sm', target: '_blank', rel: 'noopener', href: waLink(normPh(c.phone), 'Halo ' + c.name + ', ') }, 'WhatsApp'))))))) : empty('Belum ada data pelanggan.')));
  }

  /* ---------- LAPORAN ---------- */
  function reportV(m) {
    if (!rFrom) { rFrom = lastDays(30)[0]; rTo = today() }
    const a = h('input', { type: 'date', value: rFrom, 'aria-label': 'Dari' }), b = h('input', { type: 'date', value: rTo, 'aria-label': 'Sampai' });
    const os = orders().filter(o => { const d = dayOf(o.time); return d >= rFrom && d <= rTo }), vo = os.filter(valid), dn = os.filter(done), omz = dn.reduce((x, o) => x + o.total, 0);
    const ap = () => { if (a.value && b.value && a.value <= b.value) { rFrom = a.value; rTo = b.value; render() } else toast('Rentang tanggal tidak valid', 1) };
    m.append(h('div', { class: 'tb' }, h('label', { class: 'dt' }, 'Dari', a), h('label', { class: 'dt' }, 'Sampai', b), h('button', { class: 'btn red sm', onclick: ap }, 'Terapkan'), h('button', { class: 'chip sm', onclick: () => { rFrom = lastDays(7)[0]; rTo = today(); render() } }, '7 hari'), h('button', { class: 'chip sm', onclick: () => { rFrom = lastDays(30)[0]; rTo = today(); render() } }, '30 hari'),
      h('button', { class: 'chip sm', onclick: () => csv(os) }, '⇩ Ekspor CSV')));
    m.append(h('div', { class: 'sg' }, stat('orders', 'Pesanan', vo.length, os.length - vo.length + ' dibatalkan', 'b'), stat('check', 'Selesai', dn.length, '', 'g'), stat('wallet', 'Omzet (Selesai)', rp(omz), '', 'y'), stat('chart', 'Rata-rata / pesanan', rp(dn.length ? Math.round(omz / dn.length) : 0), '', 'r')));
    const byDay = {}; dn.forEach(o => { const d = dayOf(o.time); byDay[d] = (byDay[d] || 0) + o.total }); const dl = Object.entries(byDay).sort();
    const byMenu = {}; vo.forEach(o => o.items.forEach(i => { const c = byMenu[i.name] || (byMenu[i.name] = { q: 0, v: 0 }); c.q += i.qty; c.v += i.qty * i.price })); const ml = Object.entries(byMenu).sort((x, y) => y[1].q - x[1].q);
    const g = h('div', { class: 'two' });
    g.append(panel('Omzet per Hari', dl.length ? h('div', { class: 'tw' }, h('table', { class: 'rk' }, h('thead', {}, h('tr', {}, h('th', {}, 'Tanggal'), h('th', {}, 'Omzet'))), h('tbody', {}, dl.map(([d, v]) => h('tr', {}, h('td', { 'data-label': 'Tanggal' }, d), h('td', { 'data-label': 'Omzet' }, rp(v))))), h('tfoot', {}, h('tr', {}, h('td', {}, 'Total'), h('td', {}, rp(omz)))))) : empty('Tidak ada pesanan selesai pada rentang ini.')));
    g.append(panel('Penjualan per Menu', ml.length ? h('div', { class: 'tw' }, h('table', { class: 'rk' }, h('thead', {}, h('tr', {}, h('th', {}, 'Menu'), h('th', {}, 'Terjual'), h('th', {}, 'Nilai'))), h('tbody', {}, ml.map(([n, c]) => h('tr', {}, h('td', { 'data-label': 'Menu' }, n), h('td', { 'data-label': 'Terjual' }, c.q), h('td', { 'data-label': 'Nilai' }, rp(c.v))))))) : empty('Belum ada data penjualan.')));
    m.append(g);
  }
  function download(name, text, type) { const u = URL.createObjectURL(new Blob([text], { type })), a = h('a', { href: u, download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000) }
  const csvC = v => { v = String(v ?? ''); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"' };
  function csv(os) { if (!os.length) return toast('Tidak ada data untuk diekspor', 1); download(`pesanan-${rFrom}_${rTo}.csv`, ['No,Waktu,Nama,HP,Pengambilan,Item,Total,Bayar,StatusBayar,Status'].concat(os.map(o => [o.no, o.time, o.name, o.phone, o.method || 'Ambil', o.items.map(i => i.name + ' x' + i.qty).join('; '), o.total, o.pay, o.payStatus, o.status].map(csvC).join(','))).join('\n'), 'text/csv') }

  /* ---------- PENGATURAN ---------- */
  function settingsV(m) {
    const S = sett(), f = h('form', { class: 'fm' });
    const inp = (lab, k, o = {}) => { const i = h(o.tag || 'input', { type: o.type, required: o.req ? '' : null, maxlength: o.max, rows: o.rows, min: o.min, max: o.mx, inputmode: o.im }); i.value = S[k] ?? ''; i.oninput = () => S[k] = o.num ? +i.value : i.value; return h('label', {}, lab, i) };
    const chk = (lab, k, hint) => { const c = h('input', { type: 'checkbox' }); c.checked = !!S[k]; c.onchange = () => S[k] = c.checked; return h('label', { class: 'ck' }, c, h('span', {}, lab, hint ? h('small', { class: 'mu' }, ' ' + hint) : null)) };
    f.append(h('h2', {}, 'Informasi Toko'), h('div', { class: 'two2' }, inp('Nama toko *', 'name', { req: 1, max: 60 }), inp('Nama pendek (judul kuning) *', 'name2', { req: 1, max: 30 })), inp('Tagline', 'tagline', { max: 80 }),
      inp('Nomor WhatsApp toko * (format 628xxxxxxxx)', 'wa', { req: 1, im: 'numeric', max: 16 }), inp('Alamat / lokasi', 'address', { max: 200 }), inp('Link Google Maps', 'maps', { type: 'url' }), inp('Tentang toko', 'about', { tag: 'textarea', rows: 4, max: 600 }),
      h('h2', {}, 'Jam Buka'), h('div', { class: 'two2' }, inp('Teks jam buka (tampilan)', 'hours', { max: 40 }), inp('Jam buka (0-23)', 'open', { type: 'number', num: 1, min: 0, mx: 23 }), inp('Jam tutup (1-24)', 'close', { type: 'number', num: 1, min: 0, mx: 24 })),
      chk('Tandai toko TUTUP sekarang', 'closed', '(menimpa jadwal jam buka)'),
      h('h2', {}, 'Pengambilan & Pembayaran'), chk('Aktifkan layanan Delivery', 'delivery'), inp('Catatan delivery (tampil ke pelanggan)', 'deliveryNote', { max: 120 }), inp('Informasi pembayaran (tampil di langkah Bayar)', 'payInfo', { tag: 'textarea', rows: 3, max: 300 }),
      imgField('Gambar QRIS', () => S.qris, v => S.qris = v, 'hero', 'Unggah gambar QRIS atau isi nama file di repo (default: qris.png).'), imgField('Foto Hero (halaman utama)', () => S.heroImg, v => S.heroImg = v, 'hero', 'Default: img/hero.webp. Jika file tidak ada, tampil ilustrasi.'),
      h('div', { class: 'row end' }, h('button', { type: 'button', class: 'chip', onclick: render }, 'Batalkan perubahan'), h('button', { class: 'btn red' }, 'Simpan Pengaturan')));
    f.onsubmit = e => {
      e.preventDefault(); S.wa = String(S.wa).replace(/\D/g, ''); if (!/^628\d{8,12}$/.test(S.wa)) return toast('Nomor WhatsApp harus berformat 628xxxxxxxxxx', 1);
      if (!(S.open >= 0 && S.open <= 23 && S.close >= 0 && S.close <= 24)) return toast('Jam buka/tutup tidak valid', 1); if (S.maps && !/^https?:\/\//.test(S.maps)) return toast('Link Maps harus diawali http(s)://', 1);
      if (Repo.save('settings', S)) { toast('Pengaturan disimpan'); render() }
    };
    m.append(panel('', f));
  }

  /* ---------- BACKUP ---------- */
  function backupV(m) {
    const used = (() => { let n = 0; try { for (const k of Object.keys(localStorage)) if (k.startsWith(K)) n += (localStorage[k].length + k.length) * 2 } catch (e) { } return n })();
    m.append(panel('Backup & Pemulihan', h('p', { class: 'mu' }, 'Semua data (menu, pesanan, inbox, pengaturan) hanya ada di browser ini. Lakukan backup rutin. Pemakaian penyimpanan: ' + (used / 1024).toFixed(1) + ' KB dari ± 5.000 KB.'),
      h('div', { class: 'row' }, h('button', { class: 'btn red', onclick: () => { const d = { app: 'martabak-masbejo', schema: SCHEMA, exported: new Date().toISOString() }; ['products', 'settings', 'orders', 'messages'].forEach(n => d[n] = Repo.get(n)); download(`backup-masbejo-${today()}.json`, JSON.stringify(d, null, 1), 'application/json'); toast('Backup diunduh') } }, '⇩ Unduh Backup Lengkap')),
      h('label', {}, 'Pulihkan dari file backup (.json)'), h('input', { type: 'file', accept: 'application/json,.json', onchange: ev => restore(ev.target.files[0]) })));
    m.append(panel('Terbitkan Menu & Pengaturan ke Semua Pengunjung', h('p', { class: 'mu' }, 'Perubahan admin hanya terlihat di browser ini. Untuk menampilkannya ke semua pengunjung tanpa server: unduh config.json, lalu unggah/ganti file tersebut di repo GitHub (satu folder dengan index.html). Foto yang diunggah lewat admin tidak ikut; simpan file fotonya di repo dan isi nama file pada menu.'),
      h('div', { class: 'row' }, h('button', { class: 'btn gold', onclick: () => { const ps = prods().map(p => ({ ...p, img: p.img && p.img.startsWith('data:') ? '' : p.img })), s = { ...sett() }; ['qris', 'heroImg'].forEach(k => { if (s[k] && s[k].startsWith('data:')) s[k] = DEF.settings[k] }); const skipped = prods().filter(p => p.img && p.img.startsWith('data:')).length; download('config.json', JSON.stringify({ products: ps, settings: s }, null, 1), 'application/json'); toast('config.json diunduh' + (skipped ? ` (${skipped} foto unggahan tidak disertakan)` : '')) } }, '⇩ Unduh config.json'),
        h('button', { class: 'chip', onclick: () => confirmD('Pakai config.json publik?', 'Edit menu & pengaturan di browser ini dihapus, lalu website memakai config.json di repo (atau default bawaan). Pesanan & inbox tidak disentuh.', 'Ya, Lanjutkan', () => { ls.del(K + 'products'); ls.del(K + 'settings'); toast('Edit lokal dihapus'); render() }, false) }, 'Buang edit lokal (pakai config.json)'))));
    m.append(panel('Zona Bahaya', h('p', { class: 'mu' }, 'Hapus semua data aplikasi di browser ini (menu, pesanan, inbox, pengaturan, keranjang). Unduh backup dulu.'),
      h('button', { class: 'btn dng', onclick: () => { const i = h('input', { placeholder: 'Ketik HAPUS' }); modal('Hapus semua data?', h('p', {}, 'Tindakan ini tidak bisa dibatalkan. Ketik ', h('b', {}, 'HAPUS'), ' untuk melanjutkan.'), i, h('div', { class: 'row end' }, h('button', { class: 'chip', onclick: () => dlg.close() }, 'Batal'), h('button', { class: 'btn dng', onclick: () => { if (i.value.trim() !== 'HAPUS') return toast('Ketik HAPUS dengan benar', 1); Repo.reset(); dlg.close(); toast('Semua data dihapus'); render() } }, 'Hapus Semua'))) } }, 'Hapus Semua Data')));
  }
  function restore(file) {
    if (!file) return; const fr = new FileReader();
    fr.onload = () => {
      let d; try { d = JSON.parse(fr.result) } catch (e) { return toast('File bukan JSON yang valid', 1) }
      if (!d || d.app !== 'martabak-masbejo' || !Array.isArray(d.products) || !Array.isArray(d.orders) || !Array.isArray(d.messages) || typeof d.settings !== 'object') return toast('File bukan backup Martabak Mas Bejo yang valid', 1);
      confirmD('Pulihkan backup?', `Data saat ini diganti: ${d.products.length} menu, ${d.orders.length} pesanan, ${d.messages.length} pesan. Disarankan unduh backup dulu.`, 'Pulihkan', () => { let ok = true; ['products', 'settings', 'orders', 'messages'].forEach(n => { if (ok) ok = Repo.save(n, d[n]) }); toast(ok ? 'Backup dipulihkan' : 'Gagal memulihkan', !ok); render() });
    };
    fr.readAsText(file);
  }

  /* ---------- Mulai ---------- */
  function start() {
    $('#login').hidden = true; $('#app').hidden = false; const k = location.hash.slice(1); tab = TABS.some(t => t[0] === k) ? k : 'dash'; render();
  }
  addEventListener('hashchange', () => { const k = location.hash.slice(1); if (!$('#app').hidden && TABS.some(t => t[0] === k) && k !== tab) { tab = k; render() } });
  window.mbReady.then(() => { if (authed()) start(); else $('#login').hidden = false });
})();
