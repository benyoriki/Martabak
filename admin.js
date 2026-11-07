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
  const mq = matchMedia('(max-width:820px)'), PRIMARY = ['dash', 'orders', 'menu', 'inbox'];
  function drawTabs() {
    const c = counts(), mob = mq.matches, bd = k => k === 'orders' && c.o ? h('i', { class: 'nb' }, c.o) : k === 'inbox' && c.m ? h('i', { class: 'nb' }, c.m) : null;
    const list = mob ? TABS.filter(t => PRIMARY.includes(t[0])) : TABS;
    const btns = list.map(([k, t, i]) => h('button', { class: k === tab ? 'on' : '', 'aria-current': k === tab ? 'page' : null, onclick: () => go(k) }, ico(i), h('span', {}, t), bd(k)));
    if (mob) btns.push(h('button', { class: !PRIMARY.includes(tab) ? 'on' : '', onclick: moreD }, ico('menu'), h('span', {}, 'Lainnya')));
    $('#tabs').replaceChildren(...btns);
    const n = c.o + c.m; $('#bn').hidden = !n; $('#bn').textContent = n;
    const S = sett(); $('#stSw').checked = !S.closed; $('#stLbl').textContent = S.closed ? 'Tutup (manual)' : 'Buka';
    const lp = $('#livePill'); if (lp) lp.hidden = !live;
  }
  function moreD() { modal('Menu Lainnya', h('div', { class: 'more' }, TABS.filter(t => !PRIMARY.includes(t[0])).map(([k, t, i]) => h('button', { class: k === tab ? 'on' : '', onclick: () => { dlg.close(); go(k) } }, ico(i, 26), h('span', {}, t))))) }
  mq.addEventListener('change', drawTabs);
  function go(k) { tab = k; location.hash = k; render(); window.scrollTo(0, 0) }
  function render() {
    $('#ttl').textContent = TABS.find(t => t[0] === tab)[1]; drawTabs(); $('#np').hidden = true;
    main.replaceChildren(); ({ dash, orders: ordersV, menu: menuV, promo: promoV, inbox: inboxV, cust: custV, report: reportV, settings: settingsV, backup: backupV })[tab](main);
  }
  $('#stSw').onchange = e => { const S = sett(); S.closed = !e.target.checked; Repo.save('settings', S); render(); toast(S.closed ? 'Toko ditandai TUTUP di website' : 'Toko ditandai BUKA di website') };
  $('#bell').onclick = () => {
    const np = $('#np'); if (!np.hidden) { np.hidden = true; return }
    const no = orders().filter(o => o.status === 'Baru').sort((a, b) => b.time.localeCompare(a.time)), pv = orders().filter(o => o.status !== 'Baru' && valid(o) && o.payStatus === 'Menunggu Verifikasi'), nm = msgs().filter(x => x.status === 'Baru').sort((a, b) => b.time.localeCompare(a.time));
    const it = (e, t, sub, fn) => h('button', { class: 'nl', onclick: () => { np.hidden = true; fn() } }, h('span', { class: 'ne' }, e), h('span', {}, h('b', {}, t), h('small', {}, sub)));
    const rows = [...no.slice(0, 5).map(o => it('🛒', 'Pesanan baru ' + o.no, o.name + ' · ' + rp(o.total) + ' · ' + ago(o.time), () => { go('orders'); orderD(o.id) })), ...pv.slice(0, 3).map(o => it('💳', 'Verifikasi pembayaran', o.no + ' · ' + o.name + ' · ' + rp(o.total), () => { go('orders'); orderD(o.id) })), ...nm.slice(0, 4).map(x => it('✉️', 'Pesan dari ' + x.name, x.text.slice(0, 60) + ' · ' + ago(x.time), () => { openMsg = x.id; go('inbox') }))];
    np.replaceChildren(h('b', { class: 'nh' }, 'Notifikasi', h('small', {}, rows.length ? ' · ' + (no.length + pv.length + nm.length) + ' baru' : '')), ...(rows.length ? rows : [h('p', { class: 'mu' }, 'Tidak ada notifikasi baru.')])); np.hidden = false;
  };
  /* sinkron bila toko (tab lain) menulis data baru */
  addEventListener('storage', e => { if (e.key && e.key.startsWith(K) && !dlg.open && !$('#app').hidden && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) render() });

  /* ---------- Komponen ---------- */
  const panel = (title, ...c) => h('section', { class: 'pn' }, title ? h('h2', {}, title) : null, ...c);
  const stat = (i, label, val, sub, cl) => h('div', { class: 'sc ' + (cl || '') }, h('span', { class: 'sci' }, ico(i, 22)), h('div', {}, h('small', {}, label), h('b', {}, val), sub ? h('em', {}, sub) : null));
  const empty = t => h('p', { class: 'empty' }, t);
  const kfmt = n => n >= 1e6 ? (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'jt' : n >= 1e3 ? Math.round(n / 1e3) + 'rb' : String(n);
  function lastDays(n) { const r = []; for (let i = n - 1; i >= 0; i--) r.push(new Date(Date.now() - i * 864e5).toLocaleDateString('sv', { timeZone: 'Asia/Jakarta' })); return r }
  let live = false;
  const ago = t => { const s = Math.max(0, (Date.now() - new Date(t)) / 1000); if (s < 60) return 'baru saja'; if (s < 3600) return Math.floor(s / 60) + ' mnt lalu'; if (s < 86400) return Math.floor(s / 3600) + ' jam lalu'; return Math.floor(s / 86400) + ' hari lalu' };
  const dlt = (a, b) => { if (!b) return a ? h('span', { class: 'dl up' }, 'baru') : h('span', { class: 'dl' }, '–'); const p = Math.round((a - b) / b * 100); return h('span', { class: 'dl ' + (p >= 0 ? 'up' : 'dn') }, (p >= 0 ? '▲ ' : '▼ ') + Math.abs(p) + '%') };
  function barChart(days, vals, label) {
    const NS = 'http://www.w3.org/2000/svg', W = 560, H = 220, L = 44, B = 30, T = 16, mx = Math.max(...vals, 1), sx = (W - L - 8) / days.length, ch = H - T - B, avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const el = (t, a, tx) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (tx != null) e.textContent = tx; return e };
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': label });
    [0, .5, 1].forEach(f => { const y = T + ch * (1 - f); svg.append(el('line', { x1: L, x2: W - 4, y1: y, y2: y, class: 'gl' }), el('text', { x: L - 6, y: y + 4, 'text-anchor': 'end', class: 'ax' }, kfmt(Math.round(mx * f)))) });
    days.forEach((d, i) => { const hh = ch * vals[i] / mx, x = L + i * sx + sx * .16, w = sx * .68, last = i === days.length - 1;
      const r = el('rect', { x, y: T + ch - hh, width: w, height: Math.max(hh, vals[i] ? 2 : 0), rx: 6, class: 'bc' + (last ? ' td' : '') }); r.append(el('title', {}, d + ': ' + rp(vals[i]))); svg.append(r);
      if (vals[i]) svg.append(el('text', { x: x + w / 2, y: T + ch - hh - 5, 'text-anchor': 'middle', class: 'vl' }, kfmt(vals[i])));
      svg.append(el('text', { x: x + w / 2, y: H - 10, 'text-anchor': 'middle', class: 'ax' + (last ? ' tdx' : '') }, last ? 'Hari ini' : new Date(d + 'T12:00:00+07:00').toLocaleDateString('id-ID', { weekday: 'short', timeZone: 'Asia/Jakarta' })));
    });
    if (avg) { const y = T + ch * (1 - avg / mx); svg.append(el('line', { x1: L, x2: W - 4, y1: y, y2: y, class: 'av' }), el('text', { x: W - 6, y: y - 4, 'text-anchor': 'end', class: 'avt' }, 'rata-rata ' + kfmt(Math.round(avg)))) }
    return svg;
  }

  /* ---------- DASHBOARD ---------- */
  function dash(m) {
    const os = orders(), S = sett(), ps = prods(), td = today(), yd = lastDays(2)[0], vo = os.filter(valid), ms = msgs();
    const sum = l => l.reduce((a, o) => a + o.total, 0), onDay = (l, d) => l.filter(o => dayOf(o.time) === d);
    const oT = onDay(vo, td), oY = onDay(vo, yd), omT = sum(onDay(os.filter(done), td)), omY = sum(onDay(os.filter(done), yd));
    const days = lastDays(7), vals = days.map(d => sum(onDay(os.filter(done), d))), w1 = vals.reduce((a, b) => a + b, 0);
    const prev = lastDays(14).slice(0, 7), w0 = sum(os.filter(o => done(o) && prev.includes(dayOf(o.time))));
    const nNew = os.filter(o => o.status === 'Baru').length, nVer = os.filter(o => valid(o) && o.payStatus === 'Menunggu Verifikasi').length, nMsg = ms.filter(x => x.status === 'Baru').length;
    const hr = +new Date().toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Jakarta' }) % 24, gr = hr < 11 ? 'Selamat pagi' : hr < 15 ? 'Selamat siang' : hr < 18 ? 'Selamat sore' : 'Selamat malam';
    const hasSim = os.some(o => o.sim) || ms.some(x => x.sim);
    m.append(h('section', { class: 'dh' }, h('div', {}, h('small', {}, new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })), h('h2', {}, gr + ', Mas Bejo 👋'), h('p', {}, nNew + nVer + nMsg ? `Ada ${nNew} pesanan baru${nVer ? ', ' + nVer + ' menunggu verifikasi bayar' : ''} dan ${nMsg} pesan belum dibaca.` : 'Semua beres — tidak ada yang menunggu tindakan.')),
      h('div', { class: 'dq' }, h('span', { class: 'chip sm st ' + (S.closed ? 'cl' : 'op') }, h('i', {}), S.closed ? 'Toko Tutup (manual)' : 'Toko Buka'), h('button', { class: 'btn red sm', onclick: () => { oFilter = 'Baru'; go('orders') } }, 'Proses Pesanan Baru'), h('button', { class: 'chip sm', onclick: () => go('menu') }, '+ Menu'), h('a', { class: 'chip sm', href: 'index.html' }, 'Lihat Website ›'))));
    if (hasSim) m.append(h('div', { class: 'simbar' }, h('span', {}, '🧪 Data simulasi aktif — angka di bawah mencakup data uji, bukan transaksi nyata.'), h('button', { class: 'chip sm', onclick: () => go('backup') }, 'Kelola Simulasi')));
    const kpi = (i, l, v, sub, cl) => h('div', { class: 'kpi ' + cl }, h('span', { class: 'sci' }, ico(i, 22)), h('small', {}, l), h('b', {}, v), h('em', {}, ...sub));
    m.append(h('div', { class: 'kpis' },
      kpi('wallet', 'Omzet Hari Ini', rp(omT), [dlt(omT, omY), ' vs kemarin'], 'y'), kpi('orders', 'Pesanan Hari Ini', oT.length, [dlt(oT.length, oY.length), ' vs kemarin'], 'b'),
      kpi('chart', 'Omzet 7 Hari', rp(w1), [dlt(w1, w0), ' vs minggu lalu'], 'g'), kpi('bell', 'Perlu Tindakan', nNew + nVer + nMsg, [nNew + ' pesanan · ' + nVer + ' bayar · ' + nMsg + ' pesan'], 'r')));
    const cnt = s => os.filter(o => o.status === s).length;
    m.append(panel('Alur Pesanan', h('div', { class: 'pipe' }, ST.slice(0, 5).map((s, i) => h('button', { class: 'ps ' + stCls(s), onclick: () => { oFilter = s; go('orders') } }, h('b', {}, cnt(s)), h('span', {}, s), i < 4 ? h('i', { class: 'ar' }, '›') : null)))));
    const g = h('div', { class: 'g2' });
    g.append(panel('Omzet 7 Hari Terakhir', h('div', { class: 'ph2' }, h('b', {}, rp(w1)), dlt(w1, w0), h('small', {}, ' dibanding 7 hari sebelumnya')), vals.some(Boolean) ? barChart(days, vals, 'Omzet pesanan selesai 7 hari terakhir') : empty('Belum ada pesanan selesai dalam 7 hari terakhir. Grafik dihitung dari pesanan berstatus Selesai.')));
    const top = {}; vo.forEach(o => o.items.forEach(i => { top[i.name] = (top[i.name] || 0) + i.qty })); const tl = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 6), tm = tl[0] ? tl[0][1] : 1;
    g.append(panel('Menu Terlaris', tl.length ? h('ol', { class: 'tp' }, tl.map(([n, q], i) => h('li', {}, h('em', {}, i + 1), h('span', {}, n), h('b', {}, q + ' pcs'), h('i', { style: `width:${Math.round(q / tm * 100)}%` })))) : empty('Belum ada pesanan.')));
    m.append(g);
    const hrs = Array(24).fill(0); vo.forEach(o => { hrs[+new Date(o.time).toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Jakarta' }) % 24]++ }); const hs = hrs.slice(15, 24), hm = Math.max(...hs, 1), pk = hs.indexOf(hm) + 15;
    const split = (a, b, la, lb) => { const t = a + b || 1, pa = Math.round(a / t * 100); return h('div', { class: 'split' }, h('div', { class: 'sb' }, h('i', { style: `width:${pa}%` })), h('div', { class: 'sl' }, h('span', {}, la + ' ', h('b', {}, a + ' (' + pa + '%)')), h('span', {}, lb + ' ', h('b', {}, b + ' (' + (100 - pa) + '%)')))) };
    const g3 = h('div', { class: 'g3' });
    g3.append(panel('Jam Sibuk', vo.length ? h('div', {}, h('div', { class: 'hb' }, hs.map((v, i) => h('div', { class: 'hc' + (i + 15 === pk ? ' pk' : '') }, h('i', { style: `height:${Math.max(4, Math.round(v / hm * 100))}%`, title: v + ' pesanan' }), h('small', {}, String(i + 15).padStart(2, '0'))))), h('p', { class: 'mu tiny' }, 'Paling ramai pukul ' + String(pk).padStart(2, '0') + '.00 (' + hm + ' pesanan, semua data).')) : empty('Belum ada data.')));
    g3.append(panel('Pembayaran & Pengambilan', vo.length ? h('div', {}, split(vo.filter(o => o.pay === 'QRIS').length, vo.filter(o => o.pay !== 'QRIS').length, 'QRIS', 'Tunai'), split(vo.filter(o => o.method !== 'Delivery').length, vo.filter(o => o.method === 'Delivery').length, 'Ambil', 'Delivery'), h('p', { class: 'mu tiny' }, 'Rata-rata nilai pesanan ' + rp(Math.round(sum(vo) / vo.length)))) : empty('Belum ada data.')));
    g3.append(panel('Ringkasan Toko', h('ul', { class: 'sm' }, h('li', {}, 'Menu aktif', h('b', {}, ps.filter(p => p.on).length + '/' + ps.length)), h('li', {}, 'Promo berlaku', h('b', {}, ps.filter(p => p.on && promoOn(p)).length)), h('li', {}, 'Total pesanan', h('b', {}, os.length)), h('li', {}, 'Pesanan selesai', h('b', {}, os.filter(done).length)), h('li', {}, 'Dibatalkan', h('b', {}, cnt('Dibatalkan'))), h('li', {}, 'Total pesan inbox', h('b', {}, ms.length)))));
    m.append(g3);
    const rec = os.slice().sort((a, b) => b.time.localeCompare(a.time)).slice(0, 6);
    const ev = []; os.forEach(o => { ev.push({ t: o.time, e: '🛒', x: 'Pesanan ' + o.no + ' dari ' + o.name, s: rp(o.total) }); (o.hist || []).slice(1).forEach(hh => ev.push({ t: hh.t, e: hh.s === 'Selesai' ? '✅' : hh.s === 'Dibatalkan' ? '⛔' : '🔄', x: o.no + ' → ' + hh.s, s: o.name })) }); ms.forEach(x => ev.push({ t: x.time, e: '✉️', x: 'Pesan dari ' + x.name, s: x.text.slice(0, 50) }));
    ev.sort((a, b) => b.t.localeCompare(a.t));
    const g4 = h('div', { class: 'g2' });
    g4.append(panel('Pesanan Terbaru', h('div', { class: 'rl' }, rec.length ? rec.map(o => h('button', { class: 'ro', onclick: () => { go('orders'); orderD(o.id) } }, h('span', { class: 'av2' }, (o.name || '?').slice(0, 1).toUpperCase()), h('span', { class: 'rm' }, h('b', {}, o.name, o.sim ? h('i', { class: 'simt' }, 'SIM') : null), h('small', {}, o.no + ' · ' + ago(o.time) + ' · ' + (o.method === 'Delivery' ? 'Delivery' : 'Ambil'))), h('span', { class: 'rr' }, h('b', {}, rp(o.total)), pill(o.status)))) : [empty('Belum ada pesanan. Pesanan dari website akan muncul di sini (pada browser yang sama).')]), rec.length ? h('div', { class: 'row end tiny' }, h('button', { class: 'chip sm', onclick: () => { oFilter = 'Semua'; go('orders') } }, 'Lihat semua ›')) : null));
    g4.append(panel('Aktivitas Terbaru', ev.length ? h('ul', { class: 'feed' }, ev.slice(0, 8).map(x => h('li', {}, h('span', { class: 'fe' }, x.e), h('span', {}, h('b', {}, x.x), h('small', {}, x.s + ' · ' + ago(x.t)))))) : empty('Belum ada aktivitas.')));
    m.append(g4);
  }
  /* ---------- PESANAN ---------- */
  function ordTable(list) {
    return h('div', { class: 'tw' }, h('table', { class: 'rk' }, h('thead', {}, h('tr', {}, ['No', 'Waktu', 'Pelanggan', 'Total', 'Bayar', 'Status', ''].map(t => h('th', {}, t)))),
      h('tbody', {}, list.map(o => h('tr', {}, h('td', { 'data-label': 'No' }, h('b', {}, o.no), o.sim ? h('i', { class: 'simt' }, 'SIM') : null), h('td', { 'data-label': 'Waktu' }, fmt(o.time)), h('td', { 'data-label': 'Pelanggan' }, o.name), h('td', { 'data-label': 'Total' }, rp(o.total)), h('td', { 'data-label': 'Bayar' }, o.payStatus || o.pay), h('td', { 'data-label': 'Status' }, pill(o.status)), h('td', {}, h('button', { class: 'btn gold sm', onclick: () => orderD(o.id) }, 'Detail')))))));
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
    const set = (patch, msgT) => { const l = orders(), x = l.find(i => i.id === id); Object.assign(x, patch); if (patch.status) (x.hist = x.hist || [{ t: x.time, s: 'Baru' }]).push({ t: new Date().toISOString(), s: patch.status }); if (Repo.save('orders', l)) { toast(msgT || 'Tersimpan'); render(); orderD(id) } };
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
    m.append(h('div', { class: 'rtb' }, h('div', { class: 'rd' }, h('label', {}, 'Dari', a), h('label', {}, 'Sampai', b)), h('div', { class: 'rpb' }, h('button', { class: 'btn red sm', onclick: ap }, 'Terapkan'), h('button', { class: 'chip sm', onclick: () => { rFrom = lastDays(7)[0]; rTo = today(); render() } }, '7 hari'), h('button', { class: 'chip sm', onclick: () => { rFrom = lastDays(30)[0]; rTo = today(); render() } }, '30 hari'), h('button', { class: 'chip sm', onclick: () => csv(os) }, '⇩ CSV'))));
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
    simPanel(m);
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

  /* ---------- SIMULASI (data uji, ditandai sim:true & bisa dihapus) ---------- */
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), pick = a => a[rnd(0, a.length - 1)];
  const NAMES = ['Budi Santoso', 'Siti Aminah', 'Rina Wijaya', 'Agus Pratama', 'Dewi Lestari', 'Fajar Nugroho', 'Maya Putri', 'Dimas Saputra', 'Intan Permata', 'Rizky Ramadhan', 'Ayu Ningsih', 'Hendra Kusuma', 'Lina Marlina', 'Yoga Prasetyo', 'Nadia Safitri', 'Bayu Aji', 'Citra Dewi', 'Eko Prabowo', 'Wulan Sari', 'Tono Hartono', 'Putri Anggraini', 'Joko Susilo'];
  const NOTES = ['', '', '', 'Tolong dipotong 8', 'Jangan terlalu manis', 'Extra keju ya', 'Bungkus rapi, buat hadiah', 'Telur bebek kalau ada', 'Tanpa cabai', 'Ambil jam 8 malam', 'Pedas level 2', 'Pakai toping tambahan'];
  const ADDR = ['Jl. Melati No. 12, RT 03/05', 'Perum Griya Asri Blok C4', 'Jl. Kenanga 7 (depan masjid)', 'Kos Putra Mawar, Jl. Anggrek 21', 'Jl. Pahlawan No. 88'];
  const MSGS = ['Kak, hari ini buka sampai jam berapa?', 'Bisa pesan 10 box untuk acara besok sore?', 'Ada promo untuk pembelian banyak?', 'Martabak telur spesial masih ada kak?', 'Bisa delivery ke perumahan Griya Asri?', 'Terima kasih, martabaknya enak banget!', 'Apakah bisa request topping oreo + keju?', 'Pesanan saya sudah sampai mana ya?', 'Bisa bayar pakai QRIS saat ambil?', 'Ada menu tanpa telur?'];
  const iso = (day, h, mi) => new Date(`${day}T${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:00+07:00`).toISOString();
  const phone = () => '08' + pick(['12', '13', '21', '52', '57', '78', '81', '95']) + String(rnd(1e6, 9999999));
  function mkOrder(time, status, seq, day) {
    const act = prods().filter(p => p.on && p.stock), n = rnd(1, 3), its = []; for (let i = 0; i < n; i++) { const p = pick(act); if (!its.some(x => x.id === p.id)) its.push({ id: p.id, name: p.name, qty: rnd(1, 3), price: price(p) }) }
    const total = its.reduce((a, i) => a + i.price * i.qty, 0), qris = Math.random() < .55, dl = Math.random() < .28, d = day.replace(/-/g, '');
    const pst = status === 'Selesai' ? 'Lunas' : status === 'Dibatalkan' ? (qris ? 'Menunggu Pembayaran' : 'Belum Dibayar') : (qris ? (status === 'Baru' ? 'Menunggu Pembayaran' : 'Lunas') : 'Belum Dibayar');
    const o = { id: 'sim' + uid() + seq, no: `MB-${d}-${String(900 + seq).padStart(3, '0')}`, time, name: pick(NAMES), phone: phone(), items: its, total, pay: qris ? 'QRIS' : 'Tunai', payStatus: pst, status, note: pick(NOTES), method: dl ? 'Delivery' : 'Ambil', address: dl ? pick(ADDR) : '', demo: true, sim: true };
    const flow = ['Baru', 'Dikonfirmasi', 'Diproses', 'Siap Diambil', 'Selesai'], t0 = new Date(time).getTime(), end = Math.min(Date.now(), t0 + 25 * 6e4);
    if (status === 'Dibatalkan') o.hist = [{ t: time, s: 'Baru' }, { t: new Date(Math.min(Date.now(), t0 + 6e5)).toISOString(), s: 'Dibatalkan' }];
    else { const k = flow.indexOf(status); o.hist = flow.slice(0, k + 1).map((s, i) => ({ t: new Date(t0 + (end - t0) * i / Math.max(1, k)).toISOString(), s })) }
    return o;
  }
  function genSim() {
    const days = lastDays(14), td = today(), nowH = +new Date().toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Jakarta' }) % 24, out = [], mm = []; let seq = 0;
    days.forEach(day => {
      const isT = day === td, wk = [0, 6].includes(new Date(day + 'T12:00:00+07:00').getDay()), cnt = isT ? 14 : wk ? rnd(26, 34) : rnd(16, 26), tl = [];
      for (let i = 0; i < cnt; i++) { let t; if (isT) { const mx = Date.now() - 3e5, mn = Math.max(new Date(day + 'T00:00:00+07:00').getTime(), mx - 6 * 36e5); t = new Date(mn + Math.random() * Math.max(1, mx - mn)).toISOString() } else { const hh = pick([17, 18, 18, 19, 19, 19, 20, 20, 21, 21, 22, 23]); t = iso(day, hh, rnd(0, 59)) } tl.push(t) }
      tl.sort();
      tl.forEach((t, i) => { let st = 'Selesai'; if (isT) { const left = tl.length - 1 - i; st = left < 4 ? 'Baru' : left < 6 ? 'Dikonfirmasi' : left < 8 ? 'Diproses' : left < 9 ? 'Siap Diambil' : (Math.random() < .08 ? 'Dibatalkan' : 'Selesai') } else if (Math.random() < .07) st = 'Dibatalkan'; out.push(mkOrder(t, st, ++seq, day)) });
    });
    const v = out.find(o => o.status === 'Dikonfirmasi' && o.pay === 'QRIS') || out.find(o => o.status === 'Dikonfirmasi'); if (v) { v.pay = 'QRIS'; v.payStatus = 'Menunggu Verifikasi' }
    for (let i = 0; i < 9; i++) { const nm = pick(NAMES), t = i < 3 ? new Date(Date.now() - rnd(2, 90) * 6e4).toISOString() : new Date(Date.now() - rnd(3, 120) * 36e5).toISOString(); mm.push({ id: 'sim' + uid() + i, name: nm, phone: phone(), text: MSGS[i % MSGS.length], time: t, status: i < 4 ? 'Baru' : 'Dibaca', sim: true }) }
    return { out, mm };
  }
  const simCount = () => ({ o: orders().filter(o => o.sim).length, m: msgs().filter(x => x.sim).length });
  function addSim() { const { out, mm } = genSim(), o = orders(), m = msgs(); if (Repo.save('orders', o.concat(out)) && Repo.save('messages', m.concat(mm))) { toast(`Simulasi dibuat: ${out.length} pesanan, ${mm.length} pesan`); render() } }
  function clearSim() { stopLive(); const ok = Repo.save('orders', orders().filter(o => !o.sim)) && Repo.save('messages', msgs().filter(x => !x.sim)); if (ok) { toast('Data simulasi dihapus. Data asli tidak tersentuh.'); render() } }
  let liveT = null;
  function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.setValueAtTime(.08, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .25); o.start(); o.stop(a.currentTime + .25) } catch (e) { } }
  function tick() {
    const r = Math.random(), l = orders();
    if (r < .5) { const o = mkOrder(new Date().toISOString(), 'Baru', rnd(100, 899), today()); o.hist = [{ t: o.time, s: 'Baru' }]; l.push(o); Repo.save('orders', l); toast('🛒 Pesanan baru ' + o.no + ' · ' + o.name + ' · ' + rp(o.total)) }
    else if (r < .75) { const m = msgs(); m.push({ id: 'sim' + uid(), name: pick(NAMES), phone: phone(), text: pick(MSGS), time: new Date().toISOString(), status: 'Baru', sim: true }); Repo.save('messages', m); toast('✉️ Pesan baru masuk') }
    else { const c = l.filter(o => o.sim && o.status === 'Baru' && o.pay === 'QRIS' && o.payStatus === 'Menunggu Pembayaran'); if (c.length) { const o = pick(c); o.payStatus = 'Menunggu Verifikasi'; Repo.save('orders', l); toast('💳 ' + o.name + ' mengirim bukti bayar (' + o.no + ')') } else { const m = msgs(); m.push({ id: 'sim' + uid(), name: pick(NAMES), phone: phone(), text: pick(MSGS), time: new Date().toISOString(), status: 'Baru', sim: true }); Repo.save('messages', m); toast('✉️ Pesan baru masuk') } }
    beep(); if (!dlg.open && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) render(); else drawTabs();
  }
  function startLive() { if (liveT) return; live = true; liveT = setInterval(tick, 8000); tick(); drawTabs(); toast('Simulator live aktif: aktivitas baru tiap ±8 detik') }
  function stopLive() { clearInterval(liveT); liveT = null; live = false; drawTabs() }
  function simPanel(m) {
    const c = simCount();
    m.append(panel('🧪 Simulasi & Data Uji', h('p', { class: 'mu' }, 'Isi website dengan data contoh seolah sudah berjalan: pesanan 14 hari terakhir (minggu ini + minggu lalu sebagai pembanding; berbagai status & pembayaran), pesan masuk, dan notifikasi. Semua data uji bertanda SIM dan bisa dihapus tanpa menyentuh data asli. Data tersimpan hanya di browser ini.'),
      h('p', {}, 'Saat ini: ', h('b', {}, c.o + ' pesanan simulasi'), ' dan ', h('b', {}, c.m + ' pesan simulasi'), '.'),
      h('div', { class: 'row' }, h('button', { class: 'btn red', onclick: () => c.o ? confirmD('Tambah simulasi lagi?', 'Data simulasi yang ada akan ditambah satu set baru. Hapus dulu bila ingin mulai bersih.', 'Tambah', addSim, false) : addSim() }, '▶ Buat Data Simulasi'),
        h('button', { class: 'btn ' + (live ? 'gold' : 'green'), onclick: () => { live ? stopLive() : startLive(); render() } }, live ? '■ Hentikan Simulator Live' : '⚡ Mulai Simulator Live'),
        h('button', { class: 'btn dng', disabled: c.o + c.m ? null : '', onclick: () => confirmD('Hapus semua data simulasi?', 'Hanya data bertanda SIM yang dihapus. Pesanan & pesan asli tetap aman.', 'Hapus Simulasi', clearSim) }, 'Hapus Data Simulasi')),
      h('small', { class: 'mu' }, 'Simulator live menambah pesanan/pesan/bukti bayar baru tiap ±8 detik selama halaman admin terbuka, lengkap dengan notifikasi dan bunyi.')));
  }

  /* ---------- Mulai ---------- */
  function start() {
    $('#login').hidden = true; $('#app').hidden = false; const k = location.hash.slice(1); tab = TABS.some(t => t[0] === k) ? k : 'dash'; render();
  }
  addEventListener('hashchange', () => { const k = location.hash.slice(1); if (!$('#app').hidden && TABS.some(t => t[0] === k) && k !== tab) { tab = k; render() } });
  window.mbReady.then(() => { if (authed()) start(); else $('#login').hidden = false });
})();
