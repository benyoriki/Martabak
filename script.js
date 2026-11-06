'use strict';
/* =========================================================
   Martabak Mas Bejo V2 — script.js
   Bagian 1: core bersama (dipakai index.html & admin.html)
   Bagian 2: toko / storefront (hanya saat data-page="shop")
   Data: localStorage, key awalan "mb1_" (TIDAK diubah dari V1).
   ========================================================= */
const SCHEMA = 2, K = 'mb1_', $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const rp = n => 'Rp' + Number(n || 0).toLocaleString('id-ID');
const today = () => new Date().toLocaleDateString('sv', { timeZone: 'Asia/Jakarta' });
const fmt = t => new Date(t).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const ST = ['Baru', 'Dikonfirmasi', 'Diproses', 'Siap Diambil', 'Selesai', 'Dibatalkan'];

/* localStorage aman (private mode / kuota penuh tidak membuat halaman crash) */
const ls = {
  get(k) { try { return localStorage.getItem(k) } catch (e) { return null } },
  set(k, v) { try { localStorage.setItem(k, v); return true } catch (e) { return false } },
  del(k) { try { localStorage.removeItem(k) } catch (e) { } }
};

/* Pembuat elemen DOM (aman dari XSS: teks selalu lewat textContent) */
const h = (t, a = {}, ...c) => {
  const e = document.createElement(t);
  for (const k in a) {
    if (k === 'class') { if (a[k]) e.className = a[k] }
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), a[k]);
    else if (a[k] != null && a[k] !== false) e.setAttribute(k, a[k]);
  }
  c.flat().forEach(x => { if (x != null && x !== false) e.append(x) });
  return e;
};
const icon = (id, s = 20) => { const n = 'http://www.w3.org/2000/svg', v = document.createElementNS(n, 'svg'), u = document.createElementNS(n, 'use'); v.setAttribute('width', s); v.setAttribute('height', s); v.setAttribute('class', 'ico'); v.setAttribute('aria-hidden', 'true'); u.setAttribute('href', '#i-' + id); v.append(u); return v };

/* ---------- Ilustrasi pengganti foto (dipakai bila file foto belum ada) ---------- */
function art(kind) {
  art.c = art.c || {};
  if (art.c[kind]) return art.c[kind];
  let s = kind.length * 7919 + 13;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const P = {
    choco: ['#3a1b0d', ['#1d0c05', '#7a4020', '#a8643a']], hero: ['#3a1b0d', ['#1d0c05', '#7a4020', '#a8643a']],
    mix: ['#4a2412', ['#1d0c05', '#f6dd8f', '#a8643a']], nutella: ['#5a2e15', ['#2b1209', '#8a4a22', '#3a1b0d']],
    nut: ['#7a4a22', ['#4a2412', '#c98a4a', '#e6b678']], cheese: ['#f2cf6a', ['#fff3c0', '#e0b24a', '#fffbe6']],
    egg: ['#e0a93a', ['#5f9d3a', '#d04a2a', '#8a5a1a']], meat: ['#b4622b', ['#5f9d3a', '#e8c24a', '#6b2f10']]
  };
  const [top, dots] = P[kind] || P.choco;
  let d = '';
  for (let i = 0; i < 46; i++) {
    const a = rnd() * 6.283, r = Math.sqrt(rnd()), x = 200 + Math.cos(a) * 128 * r, y = 164 + Math.sin(a) * 34 * r, ro = Math.floor(rnd() * 180);
    d += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="9" height="3.4" rx="1.7" fill="${dots[i % 3]}" transform="rotate(${ro} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><radialGradient id="g" cx=".5" cy=".3" r=".9"><stop offset="0" stop-color="#4a2c1b"/><stop offset="1" stop-color="#140b07"/></radialGradient><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7d98c"/><stop offset="1" stop-color="#bf7c22"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><ellipse cx="200" cy="236" rx="158" ry="22" fill="#000" opacity=".45"/><path d="M52 168h296v44q-148 40-296 0z" fill="url(#c)"/><path d="M60 184q140 30 280 0M60 198q140 30 280 0" stroke="#a8691a" stroke-width="2" fill="none" opacity=".6"/><ellipse cx="200" cy="166" rx="148" ry="46" fill="#d9a441"/><ellipse cx="200" cy="164" rx="138" ry="39" fill="${top}"/>${d}<ellipse cx="170" cy="150" rx="60" ry="9" fill="#fff" opacity=".07"/></svg>`;
  return art.c[kind] = 'data:image/svg+xml,' + encodeURIComponent(svg);
}
const kindOf = p => {
  const n = (p.name || '').toLowerCase();
  if (n.includes('nutella')) return 'nutella'; if (n.includes('kacang')) return 'nut'; if (n.includes('mix')) return 'mix';
  if (n.includes('daging')) return 'meat'; if (n.includes('telur')) return 'egg';
  if (n.includes('keju') && !n.includes('cokelat')) return 'cheese'; if (p.cat === 'Asin') return 'egg'; return 'choco';
};
const FALLBACK_NOTE = 'Ilustrasi sementara — unggah foto asli lewat Admin';
/* <img> dengan fallback ilustrasi tanpa loop error */
const pic = (src, kind, alt, o = {}) => h('img', {
  src: src || art(kind), alt, width: o.w || 400, height: o.h || 300, loading: o.eager ? 'eager' : 'lazy', decoding: 'async', class: o.cls,
  fetchpriority: o.eager ? 'high' : null,
  onerror: e => { if (!e.target.dataset.fb) { e.target.dataset.fb = 1; e.target.src = art(kind) } }
});

/* ---------- Data default (identik dengan V1; tidak ada data dihapus) ---------- */
const mkP = (i, n, c, d, p, pr, best) => ({ id: 'P' + i, name: n, cat: c, desc: d, price: p, promo: pr, promoEnd: pr ? '2026-12-31' : '', img: '', on: true, best, stock: true, order: i });
const DEF = {
  products: [mkP(1, 'Martabak Cokelat Keju', 'Manis', 'Meses cokelat & keju melimpah', 28000, 25000, true), mkP(2, 'Martabak Keju Susu', 'Manis', 'Keju parut dan susu kental manis', 25000, 0, false), mkP(3, 'Martabak Kacang Cokelat', 'Manis', 'Kacang sangrai dan cokelat', 22000, 0, false), mkP(4, 'Martabak Nutella', 'Manis', 'Olesan hazelnut cokelat', 30000, 0, true), mkP(5, 'Martabak Telur Spesial', 'Asin', 'Telur bebek, daun bawang, bumbu rempah', 30000, 0, true), mkP(6, 'Martabak Telur Ayam', 'Asin', 'Telur ayam gurih', 28000, 0, false), mkP(7, 'Martabak Daging', 'Asin', 'Isi daging cincang berbumbu', 32000, 0, false), mkP(8, 'Martabak Mix Spesial', 'Spesial', 'Manis dan asin dalam satu loyang', 35000, 0, true)],
  settings: { name: 'Martabak Mas Bejo', name2: 'Mas Bejo', tagline: 'Manisnya Bikin Nagih!', wa: '628988995637', address: 'Pujasera (alamat demo)', hours: '17.00 - 00.00', open: 17, close: 24, maps: 'https://www.google.com/maps/search/?api=1&query=Pujasera', about: 'Martabak Mas Bejo menyajikan martabak manis dan asin dengan pilihan topping lengkap, dibuat saat kamu pesan. (Teks demo, bisa diubah admin.)', promoTitle: 'PROMO SPESIAL MAS BEJO', promoText: 'Cek menu bertanda promo. (Data demo)', qris: 'qris.png', heroImg: 'img/hero.webp',
    /* kunci baru V2 (opsional, otomatis terisi default) */
    payInfo: '', delivery: false, deliveryNote: '', closed: false },
  orders: [], messages: []
};
const CFG = {}; /* diisi dari config.json bila ada */
const Repo = {
  /* Prioritas data: localStorage (hasil edit admin di perangkat ini) > config.json (publik, di repo) > default bawaan */
  get(n) {
    const base = { ...DEF.settings, ...(CFG.settings || {}) };
    try {
      const v = JSON.parse(ls.get(K + n));
      if (v != null) return n === 'settings' ? (m => { ['qris', 'heroImg'].forEach(k => { if (!m[k]) m[k] = base[k] || DEF.settings[k] }); if (m.heroImg === 'hero.jpg') m.heroImg = DEF.settings.heroImg; return m })({ ...base, ...v }) : v;
    } catch (e) { }
    if (n === 'settings') return base;
    return structuredClone(CFG[n] ?? DEF[n] ?? {});
  },
  save(n, v) {
    if (ls.set(K + n, JSON.stringify(v))) { ls.set(K + 'schema', SCHEMA); return true }
    alert('Penyimpanan browser penuh. Kecilkan ukuran foto atau hapus data lama (Admin → Backup).'); return false;
  },
  put(n, item) { const l = this.get(n), i = l.findIndex(x => x.id === item.id); i < 0 ? l.push(item) : l[i] = item; return this.save(n, l) },
  del(n, id) { return this.save(n, this.get(n).filter(x => x.id !== id)) },
  reset() { try { Object.keys(localStorage).filter(k => k.startsWith(K) && k !== K + 'theme').forEach(k => localStorage.removeItem(k)) } catch (e) { } }
};
/* Foto produk: foto upload admin > file di repo (nama sama seperti V1) > ilustrasi */
const FILES = { P1: 'img/manis-cokelat-keju.webp', P2: 'img/manis-keju-susu.webp', P3: 'img/manis-kacang-cokelat.webp', P4: 'img/manis-nutella.webp', P5: 'img/asin-telur-spesial.webp', P6: 'img/asin-umum.webp', P7: 'img/asin-daging-sapi.webp', P8: 'img/mix-spesial.webp' };
const pimg = p => p.img || FILES[p.id] || '';
/* Galeri rasa (foto dari poster menu). key = kata kunci pencocokan ke nama menu */
const GAL = [['Manis', [['Cokelat Keju', 'manis-cokelat-keju', 'cokelat keju'], ['Keju Susu', 'manis-keju-susu', 'keju susu'], ['Kacang Cokelat', 'manis-kacang-cokelat', 'kacang cokelat'], ['Nutella', 'manis-nutella', 'nutella'], ['Oreo Cokelat', 'manis-oreo-cokelat', 'oreo'], ['Pandan Keju', 'manis-pandan-keju', 'pandan']]], ['Asin', [['Telur Spesial', 'asin-telur-spesial', 'telur spesial'], ['Daging Sapi', 'asin-daging-sapi', 'daging'], ['Kornet Keju', 'asin-kornet-keju', 'kornet'], ['Ayam Pedas', 'asin-ayam-pedas', 'ayam pedas'], ['Sosis Keju', 'asin-sosis-keju', 'sosis'], ['Kebab Spesial', 'asin-kebab-spesial', 'kebab']]]];
const promoOn = p => p.promo > 0 && p.promo < p.price && (!p.promoStart || p.promoStart <= today()) && (!p.promoEnd || p.promoEnd >= today());
const price = p => promoOn(p) ? p.promo : p.price;
const waLink = (num, m) => `https://wa.me/${String(num).replace(/\D/g, '')}?text=${encodeURIComponent(m)}`;
function toast(t, bad) { const e = h('div', { class: 'toast' + (bad ? ' bad' : ''), role: 'status' }, t); document.body.append(e); setTimeout(() => e.remove(), 2000) }
function theme() {
  const t = ls.get(K + 'theme') || 'dark'; document.documentElement.dataset.theme = t;
  const b = $('#themeBtn'); b && b.addEventListener('click', () => { const n = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = n; ls.set(K + 'theme', n) });
}
theme();
const isOpenNow = S => {
  if (S.closed) return false;
  const hr = +new Date().toLocaleString('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', hour12: false }) % 24;
  return S.open < S.close ? hr >= S.open && hr < S.close : hr >= S.open || hr < S.close;
};
/* klik di luar dialog = tutup (hanya bila mousedown & klik terjadi di backdrop) */
function dialogs() {
  $$('[data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());
  $$('dialog').forEach(d => { let dn = false; d.addEventListener('mousedown', e => dn = e.target === d); d.addEventListener('click', e => { if (dn && e.target === d) d.close(); dn = false }) });
}

/* ---------- PWA (install) ---------- */
function pwa() {
  let dp = window.__dp || null, card = null; const btns = () => $$('.inst'), st = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
  if (st) { btns().forEach(b => b.hidden = true); return }
  btns().forEach(b => b.hidden = false);
  const ua = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(ua), and = /Android/.test(ua), inapp = /FBAN|FBAV|Instagram|Line\/|MicroMessenger|TikTok|; wv\)/.test(ua);
  const steps = inapp ? ['Ketuk menu ⋮ di pojok layar', 'Pilih "Buka di Chrome" atau "Buka di browser"', 'Lalu ketuk Pasang Aplikasi lagi'] : ios ? ['Ketuk tombol Bagikan di Safari', 'Pilih "Tambah ke Layar Utama"', 'Ketuk Tambah'] : and ? ['Ketuk menu ⋮ di Chrome', 'Pilih "Instal aplikasi" atau "Tambahkan ke layar utama"', 'Ketuk Instal'] : ['Buka di Chrome atau Edge', 'Klik ikon instal di ujung kanan bilah alamat', 'Klik Instal'];
  const hideCard = () => { if (card) { card.remove(); card = null } };
  const guide = () => {
    let d = $('#pwaD'); if (!d) { d = h('dialog', { id: 'pwaD' }); document.body.append(d); let dn = false; d.addEventListener('mousedown', e => dn = e.target === d); d.addEventListener('click', e => { if (dn && e.target === d) d.close(); dn = false }) }
    d.replaceChildren(h('div', { class: 'dc' }, h('button', { class: 'x', onclick: () => d.close(), 'aria-label': 'Tutup' }, '✕'), h('img', { class: 'pl', src: 'logo.png', width: 72, height: 72, alt: '' }), h('h3', {}, 'Pasang Aplikasi'), h('ol', { class: 'pst' }, steps.map(s => h('li', {}, s))), h('p', { class: 'info' }, 'Jika muncul "Tidak dapat membuka aplikasi" atau tombol tidak bereaksi: hapus ikon aplikasi lama dari layar utama, muat ulang halaman, lalu pasang lagi.'), h('button', { class: 'btn gold', onclick: () => d.close() }, 'Mengerti'))); d.showModal();
  };
  const go = async () => { if (!dp) { guide(); return } try { dp.prompt(); const r = await dp.userChoice; if (r.outcome === 'accepted') btns().forEach(b => b.hidden = true) } catch (e) { guide() } dp = null; window.__dp = null; hideCard() };
  btns().forEach(b => b.onclick = go);
  const offer = () => {
    if (card || !dp || +ls.get(K + 'pwaNo') > Date.now()) return;
    setTimeout(() => {
      if (card || !dp) return; const adm = document.body.dataset.page === 'admin';
      card = h('div', { class: 'pwa' }, h('img', { src: 'logo.png', width: 56, height: 56, alt: '' }), h('div', {}, h('b', {}, adm ? 'Pasang Admin Mas Bejo' : 'Pasang Aplikasi Mas Bejo'), h('small', {}, 'Buka lebih cepat dari layar utama, tampil layar penuh.')), h('button', { class: 'btn gold sm', onclick: go }, 'Pasang'), h('button', { class: 'pwx', onclick: () => { ls.set(K + 'pwaNo', Date.now() + 3 * 864e5); hideCard() }, 'aria-label': 'Nanti' }, '✕'));
      document.body.append(card);
    }, 3600);
  };
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); dp = e; window.__dp = e; offer() });
  addEventListener('appinstalled', () => { btns().forEach(b => b.hidden = true); hideCard() });
  offer();
}
pwa();
/* Loading screen: tampil tepat 4 detik sejak halaman dibuka / dimuat ulang (hanya index.html) */
(function () {
  const l = document.getElementById('loader'); if (!l) return;
  setTimeout(() => { l.classList.add('off'); document.documentElement.classList.remove('ld'); setTimeout(() => l.remove(), 700) }, Math.max(0, 4000 - performance.now()));
})();
/* config.json opsional: cara menerbitkan menu/pengaturan ke semua pengunjung tanpa server (lihat README) */
window.mbReady = fetch('config.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(c => { if (c && typeof c === 'object') { if (Array.isArray(c.products)) CFG.products = c.products; if (c.settings && typeof c.settings === 'object') CFG.settings = c.settings } }).catch(() => { });
if (document.body.dataset.page === 'shop') window.mbReady.then(shop);

/* =========================================================
   TOKO (storefront)
   ========================================================= */
function shop() {
  const S = Repo.get('settings');
  $$('[data-s]').forEach(e => e.textContent = S[e.dataset.s] || '');
  $$('.wa').forEach(a => { a.href = waLink(S.wa, 'Halo ' + S.name + ', saya ingin memesan.'); a.target = '_blank'; a.rel = 'noopener' });
  $('#maps').href = S.maps;
  /* hero: foto admin/hero.jpg, jika tidak ada → ilustrasi */
  const hero = $('#heroImg'); hero.onerror = () => { if (!hero.dataset.fb) { hero.dataset.fb = 1; hero.src = art('hero') } }; hero.src = S.heroImg || art('hero');
  const open = isOpenNow(S);
  $$('.status').forEach(e => { e.textContent = open ? '● Buka sekarang' : '● Tutup'; e.classList.toggle('closed', !open) });
  if (!open) $('#closedBar').hidden = false;
  /* nav mobile */
  const nav = $('#nav'); $('#burger').onclick = () => { const o = nav.classList.toggle('open'); $('#burger').setAttribute('aria-expanded', o) };
  nav.addEventListener('click', e => { if (e.target.closest('a,button')) nav.classList.remove('open') });
  $('#searchBtn').onclick = () => { $('#menu').scrollIntoView(); setTimeout(() => $('#q').focus({ preventScroll: true }), 350) };
  /* bottom nav aktif mengikuti scroll */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) $$('.bnav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id)) }), { rootMargin: '-45% 0px -50% 0px' });
    ['home', 'menu', 'promo', 'lokasi'].forEach(id => { const e = document.getElementById(id); e && io.observe(e) });
  }

  /* ---- Keranjang ---- */
  let cart = Repo.get('cart'); if (Array.isArray(cart) || typeof cart !== 'object') cart = {};
  const prodsAll = () => Repo.get('products');
  const prods = () => prodsAll().filter(p => p.on).sort((a, b) => a.order - b.order);
  const pm = () => Object.fromEntries(prodsAll().map(p => [p.id, p]));
  const items = () => { const m = pm(); return Object.keys(cart).filter(id => m[id] && m[id].on !== false).map(id => ({ id, name: m[id].name, qty: cart[id], price: price(m[id]), img: m[id].img || '', kind: kindOf(m[id]) })) };
  const sum = a => a.reduce((x, i) => x + i.price * i.qty, 0);
  const count = () => items().reduce((a, b) => a + b.qty, 0);
  const saveCart = () => {
    const m = pm(); Object.keys(cart).forEach(id => { if (!m[id]) delete cart[id] });
    Repo.save('cart', cart); const it = items(), n = it.reduce((a, b) => a + b.qty, 0);
    $$('.cbadge').forEach(b => { b.textContent = n; b.hidden = !n });
    $('#cartBar').hidden = !n; document.body.classList.toggle('hasCart', n > 0); $('#cartTot').textContent = n + ' item · ' + rp(sum(it));
  };
  const add = (p, q = 1) => { cart[p.id] = (cart[p.id] || 0) + q; saveCart(); toast(p.name + ' masuk keranjang') };

  /* ---- Katalog ---- */
  let cat = 'Semua', q = ''; const cats = ['Semua', 'Manis', 'Asin', 'Promo', 'Terlaris'], qty = {};
  const drawCats = () => $('#cats').replaceChildren(...cats.map(c => h('button', { class: 'chip' + (c === cat ? ' on' : ''), 'aria-pressed': c === cat, onclick: () => { cat = c; drawCats(); drawMenu() } }, c)));
  const stepper = (get, set) => {
    const v = h('output', {}, get());
    return h('div', { class: 'qty' }, h('button', { type: 'button', 'aria-label': 'Kurangi', onclick: () => { set(Math.max(1, get() - 1)); v.textContent = get() } }, '−'), v, h('button', { type: 'button', 'aria-label': 'Tambah', onclick: () => { set(Math.min(99, get() + 1)); v.textContent = get() } }, '+'));
  };
  function badges(p) { const pr = promoOn(p); return pr ? h('span', { class: 'bdg promo' }, 'Promo') : p.best ? h('span', { class: 'bdg best' }, '★ Terlaris') : null }
  function drawMenu() {
    const g = $('#grid'); g.replaceChildren();
    const list = prods().filter(p => (p.name + ' ' + p.desc).toLowerCase().includes(q) && (cat === 'Semua' || (cat === 'Promo' ? promoOn(p) : cat === 'Terlaris' ? p.best : cat === 'Asin' ? p.cat !== 'Manis' : p.cat === cat)));
    if (!list.length) g.append(h('p', { class: 'empty' }, 'Menu tidak ditemukan. Coba kata kunci atau kategori lain.'));
    list.forEach((p, i) => {
      const pr = price(p), on = promoOn(p); qty[p.id] = qty[p.id] || 1;
      g.append(h('article', { class: 'card' },
        h('button', { class: 'ph', type: 'button', 'aria-label': 'Detail ' + p.name, onclick: () => detail(p) }, pic(pimg(p), kindOf(p), p.name, { eager: i < 4 }), badges(p)),
        h('div', { class: 'cb' }, h('h3', {}, p.name), h('p', { class: 'ds' }, p.desc),
          h('div', { class: 'pr' }, h('b', {}, rp(pr)), on ? h('s', {}, rp(p.price)) : null),
          h('div', { class: 'ca' }, p.stock ? stepper(() => qty[p.id], v => qty[p.id] = v) : null,
            h('button', { class: 'btn red cartb', disabled: p.stock ? null : '', 'aria-label': 'Tambah ' + p.name + ' ke keranjang', onclick: () => { add(p, qty[p.id]); qty[p.id] = 1; drawMenu() } }, p.stock ? [icon('cart', 18), h('span', {}, 'Tambah')] : 'Habis')))));
    });
  }
  function detail(p) {
    const d = $('#prodD'), pr = price(p), on = promoOn(p); let n = 1;
    $('#prodC').replaceChildren(h('button', { class: 'x', 'data-close': '', 'aria-label': 'Tutup', onclick: () => d.close() }, '✕'),
      h('div', { class: 'ph big' }, pic(pimg(p), kindOf(p), p.name, { eager: true, w: 600, h: 450 }), badges(p)),
      h('h3', {}, p.name), h('p', { class: 'mu' }, p.cat + ' · ' + p.desc), h('div', { class: 'pr lg' }, h('b', {}, rp(pr)), on ? h('s', {}, rp(p.price)) : null, on && p.promoEnd ? h('small', {}, 'Promo s/d ' + p.promoEnd) : null),
      p.stock ? h('div', { class: 'row' }, stepper(() => n, v => n = v), h('button', { class: 'btn red grow', onclick: () => { add(p, n); d.close() } }, 'Tambah ke Keranjang')) : h('p', { class: 'info' }, 'Menu ini sedang habis.'));
    d.showModal();
  }
  function drawPromo() {
    const l = prods().filter(promoOn), box = $('#promoList'); box.replaceChildren();
    $('#promoEmpty').hidden = l.length > 0;
    l.forEach(p => box.append(h('div', { class: 'pc' }, pic(pimg(p), kindOf(p), p.name, { w: 200, h: 150 }), h('div', {}, h('b', {}, p.name), h('span', { class: 'pr' }, h('b', {}, rp(price(p))), ' ', h('s', {}, rp(p.price))), h('small', {}, 'Hemat ' + rp(p.price - price(p)) + (p.promoEnd ? ' · s/d ' + p.promoEnd : ''))), h('button', { class: 'btn gold sm', onclick: () => add(p) }, '+ Keranjang'))));
  }
  const setCat = c => { cat = c; q = ''; $('#q').value = ''; drawCats(); drawMenu(); $('#menu').scrollIntoView() };
  $$('[data-cat]').forEach(b => b.onclick = () => setCat(b.dataset.cat));
  $$('.sh img,.about img').forEach(i => i.addEventListener('error', () => { if (!i.dataset.fb) { i.dataset.fb = 1; i.src = art(i.dataset.kind || 'hero') } }));
  function drawGallery() {
    const box = $('#gallery'); if (!box) return; box.replaceChildren();
    GAL.forEach(([g, list]) => box.append(h('div', { class: 'gg' }, h('h3', {}, 'Martabak ', h('em', {}, g)), h('div', { class: 'gt' }, list.map(([n, f, k]) => {
      const p = prods().find(x => x.name.toLowerCase().includes(k)), im = pic('img/' + f + '.webp', g === 'Manis' ? 'choco' : 'egg', 'Martabak ' + n, { w: 440, h: 270 });
      const lab = h('span', { class: 'gl' }, h('b', {}, n), h('small', {}, p ? (p.stock ? rp(price(p)) : 'Habis') : 'Tanya admin'));
      return p ? h('button', { class: 'gi', type: 'button', onclick: () => detail(p), 'aria-label': 'Lihat ' + n }, im, lab) : h('a', { class: 'gi', href: waLink(S.wa, `Halo ${S.name}, apakah martabak ${n} tersedia? Berapa harganya?`), target: '_blank', rel: 'noopener', 'aria-label': 'Tanya ' + n + ' via WhatsApp' }, im, lab);
    })))));
  }
  const bp = prods().find(p => p.best && p.stock) || prods().find(p => p.stock), bs = $('#bs');
  if (bp && bs) bs.replaceChildren(pic(pimg(bp), kindOf(bp), bp.name, { w: 120, h: 90, cls: 'bsi' }), h('div', { class: 'bst' }, h('small', {}, bp.best ? '★ Terlaris' : 'Pilihan'), h('b', {}, bp.name), h('span', {}, rp(price(bp)))), h('button', { class: 'btn red', type: 'button', onclick: () => add(bp), 'aria-label': 'Tambah ' + bp.name + ' ke keranjang' }, '+'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting || en.boundingClientRect.top < 0) { en.target.classList.add('in'); io.unobserve(en.target) } }), { rootMargin: '0px 0px -6% 0px' }), rvs = $$('.feat .fg4>div,.sh,.steps3>li,.loc>div,.pbox,.about,.ctab,#gallery .gg');
    rvs.forEach(e => { e.classList.add('rv'); io.observe(e) });
    setTimeout(() => rvs.forEach(e => e.classList.add('in')), 8000); /* pengaman: tidak ada konten yang tetap tersembunyi */
  }
  const live = prods(); if (live.length) $('#fromPrice').textContent = rp(Math.min(...live.map(price))); else $('#fromWrap').hidden = true;
  $('#q').oninput = e => { q = e.target.value.toLowerCase().trim(); drawMenu() };

  /* ---- Checkout ---- */
  let C = { name: '', phone: '', note: '', pay: 'QRIS', method: 'Ambil', address: '' }, last = null;
  try { const c = JSON.parse(ls.get(K + 'cust')); if (c) { C.name = c.name || ''; C.phone = c.phone || '' } } catch (e) { }
  const body = $('#stepBody'), nb = (...b) => h('div', { class: 'row end' }, b), back = n => h('button', { class: 'chip', type: 'button', onclick: () => go(n) }, '‹ Kembali');
  function go(n) { $$('#steps li').forEach((li, i) => { li.className = i + 1 < n ? 'ok' : i + 1 === n ? 'on' : '' }); body.replaceChildren(); [null, s1, s2, s3, s4][n](body); $('#cartD').scrollTop = 0; $('#cartC').scrollTop = 0 }
  function s1(b) {
    const it = items();
    it.forEach(i => {
      const ch = d => () => { cart[i.id] += d; if (cart[i.id] < 1) delete cart[i.id]; saveCart(); go(1) };
      b.append(h('div', { class: 'li' }, pic(i.img || FILES[i.id], i.kind, i.name, { w: 64, h: 64, cls: 'th' }), h('div', { class: 'lt' }, h('b', {}, i.name), h('small', {}, rp(i.price) + ' × ' + i.qty), h('b', { class: 'subt' }, rp(i.price * i.qty))),
        h('div', { class: 'qty' }, h('button', { onclick: ch(-1), 'aria-label': 'Kurangi' }, '−'), h('output', {}, i.qty), h('button', { onclick: ch(1), 'aria-label': 'Tambah' }, '+')),
        h('button', { class: 'del', onclick: () => { delete cart[i.id]; saveCart(); go(1) }, 'aria-label': 'Hapus ' + i.name }, '✕')));
    });
    if (!it.length) b.append(h('p', { class: 'empty' }, 'Keranjang masih kosong. Pilih menu favoritmu dulu.'));
    const ta = h('textarea', { maxlength: 200, placeholder: 'Contoh: potong 8 bagian, tanpa keju…', rows: 2 }); ta.value = C.note; ta.oninput = () => C.note = ta.value;
    b.append(h('label', {}, 'Catatan pesanan (opsional)', ta), h('p', { class: 'tot' }, 'Total pembayaran ', h('b', {}, rp(sum(it)))),
      nb(h('button', { class: 'chip', type: 'button', onclick: () => $('#cartD').close() }, '+ Tambah menu'), h('button', { class: 'btn red', disabled: it.length ? null : '', onclick: () => go(2) }, 'Lanjut isi data')));
  }
  function s2(b) {
    const n = h('input', { required: '', maxlength: 60, placeholder: 'Nama kamu', autocomplete: 'name' }), p = h('input', { type: 'tel', required: '', inputmode: 'tel', placeholder: '08xxxxxxxxxx', autocomplete: 'tel' }), ad = h('textarea', { rows: 3, maxlength: 250, placeholder: 'Alamat lengkap + patokan' });
    n.value = C.name; p.value = C.phone; ad.value = C.address;
    const adw = h('label', { hidden: C.method !== 'Delivery' || !S.delivery }, 'Alamat pengantaran', ad);
    const mo = (v, t, d) => { const r = h('input', { type: 'radio', name: 'mt', value: v }); r.checked = C.method === v; r.onchange = () => { C.method = v; adw.hidden = v !== 'Delivery'; $$('.opt.mt').forEach(o => o.classList.toggle('on', o.querySelector('input').checked)) }; return h('label', { class: 'opt mt' + (C.method === v ? ' on' : '') }, r, h('span', {}, h('b', {}, t), h('small', {}, d))) };
    if (!S.delivery) C.method = 'Ambil';
    const f = h('form', {}, h('label', {}, 'Nama lengkap *', n), h('label', {}, 'Nomor WhatsApp *', p),
      h('p', { class: 'lbl' }, 'Metode pengambilan'), mo('Ambil', 'Ambil di tempat', 'Datang langsung ke lokasi'), S.delivery ? mo('Delivery', 'Delivery', S.deliveryNote || 'Diantar ke alamat kamu (ongkir dikonfirmasi admin)') : h('p', { class: 'info' }, 'Pengambilan: ambil sendiri di lokasi. Layanan antar belum aktif.'),
      adw, nb(back(1), h('button', { class: 'btn red' }, 'Lanjut pembayaran')));
    f.onsubmit = e => {
      e.preventDefault(); const nm = n.value.trim(), ph = p.value.trim();
      if (nm.length < 2) { alert('Isi nama minimal 2 huruf.'); return }
      if (!/^(\+62|62|0)8[0-9]{8,12}$/.test(ph.replace(/[\s-]/g, ''))) { alert('Nomor HP tidak valid. Contoh: 08123456789'); return }
      if (C.method === 'Delivery' && ad.value.trim().length < 8) { alert('Isi alamat pengantaran dengan lengkap.'); return }
      C.name = nm; C.phone = ph; C.address = ad.value.trim(); ls.set(K + 'cust', JSON.stringify({ name: nm, phone: ph })); go(3);
    };
    b.append(f);
  }
  function s3(b) {
    const it = items(), opt = (v, t, d) => { const r = h('input', { type: 'radio', name: 'pay', value: v }); r.checked = C.pay === v; r.onchange = () => { C.pay = v; go(3) }; return h('label', { class: 'opt' + (C.pay === v ? ' on' : '') }, r, h('span', {}, h('b', {}, t), h('small', {}, d))) };
    b.append(h('p', { class: 'info' }, C.name + ' · ' + C.phone + ' · ' + (C.method === 'Delivery' ? 'Delivery: ' + C.address : 'Ambil di tempat')),
      ...it.map(i => h('div', { class: 'ln' }, h('span', {}, i.name + ' ×' + i.qty), h('b', {}, rp(i.price * i.qty)))), h('p', { class: 'tot' }, 'Total ', h('b', {}, rp(sum(it)))),
      opt('QRIS', 'QRIS', 'Scan dari e-wallet atau m-banking. Admin memverifikasi pembayaran secara manual.'), opt('COD', C.method === 'Delivery' ? 'Bayar saat diantar' : 'Bayar di Tempat', C.method === 'Delivery' ? 'Bayar tunai ke kurir saat pesanan tiba.' : 'Bayar tunai saat pesanan diambil.'),
      ...(S.payInfo ? [h('p', { class: 'info pre' }, S.payInfo)] : []), nb(back(2), h('button', { class: 'btn red', onclick: place }, 'Buat Pesanan')));
  }
  function place() {
    const it = items(); if (!it.length) { go(1); return }
    const d = today().replaceAll('-', ''), os = Repo.get('orders');
    const seq = os.filter(x => (x.no || '').includes(d)).reduce((m, x) => Math.max(m, +(x.no.split('-')[2]) || 0), 0) + 1;
    const o = { id: uid(), no: `MB-${d}-${String(seq).padStart(3, '0')}`, time: new Date().toISOString(), name: C.name, phone: C.phone, items: it.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })), total: sum(it), pay: C.pay, payStatus: C.pay === 'QRIS' ? 'Menunggu Pembayaran' : 'Belum Dibayar', status: 'Baru', note: C.note.trim(), method: C.method, address: C.method === 'Delivery' ? C.address : '', demo: true };
    if (!Repo.put('orders', o)) return; last = o; cart = {}; C.note = ''; saveCart(); go(4);
  }
  const msg = o => `HALO ${S.name.toUpperCase()}\n\nSaya ingin memesan:\n\nNomor Pesanan: ${o.no}\nNama: ${o.name}\nNomor HP: ${o.phone}\nPengambilan: ${o.method === 'Delivery' ? 'Delivery' : 'Ambil di tempat'}${o.method === 'Delivery' ? '\nAlamat: ' + o.address : ''}\n\n${o.items.map((i, n) => `${n + 1}. ${i.name} x${i.qty} — ${rp(i.price * i.qty)}`).join('\n')}\n\nTotal: ${rp(o.total)}\nPembayaran: ${o.pay === 'QRIS' ? 'QRIS' : o.method === 'Delivery' ? 'Bayar saat diantar' : 'Bayar di Tempat'}\nCatatan: ${o.note || '-'}\n\nMohon konfirmasi pesanan saya. Terima kasih.`;
  function s4(b) {
    const o = last, det = h('div', { class: 'det', hidden: true }, ...o.items.map(i => h('div', { class: 'ln' }, h('span', {}, i.name + ' ×' + i.qty), h('b', {}, rp(i.price * i.qty)))), h('p', { class: 'mu' }, (o.method === 'Delivery' ? 'Delivery · ' + o.address : 'Ambil di tempat') + (o.note ? ' · Catatan: ' + o.note : '')));
    b.append(h('div', { class: 'okmark', 'aria-hidden': 'true' }, '✓'), h('h3', { class: 'ctr' }, 'Pesanan Tercatat'), h('div', { class: 'okbox' }, h('small', {}, 'Nomor Pesanan'), h('b', {}, o.no)), h('p', { class: 'tot' }, 'Total ', h('b', {}, rp(o.total))),
      h('p', { class: 'info' }, 'Langkah terakhir: tekan "Kirim Pesanan ke WhatsApp" agar admin menerima dan memproses pesananmu. Pesanan baru dianggap masuk setelah pesan WhatsApp terkirim.'));
    if (o.pay === 'QRIS') {
      const qr = S.qris ? pic(S.qris, 'hero', 'QRIS pembayaran', { w: 240, h: 240, eager: true, cls: 'qris' }) : null;
      if (qr) qr.onerror = () => { const x = h('div', { class: 'ph0' }, 'QRIS belum diunggah admin. Hubungi admin lewat WhatsApp.'); qr.replaceWith(x) };
      b.append(h('p', {}, 'Scan QRIS ini, bayar sesuai total, lalu tekan "Saya Sudah Membayar".'), qr || h('div', { class: 'ph0' }, 'QRIS belum diunggah admin. Hubungi admin lewat WhatsApp.'),
        h('button', { class: 'btn red wide', onclick: e => { const l = Repo.get('orders'), x = l.find(i => i.id === o.id); if (x) { x.payStatus = 'Menunggu Verifikasi'; Repo.save('orders', l) } e.target.disabled = true; e.target.textContent = 'Menunggu verifikasi admin' } }, 'Saya Sudah Membayar'));
    } else b.append(h('p', { class: 'info' }, o.method === 'Delivery' ? 'Siapkan pembayaran tunai saat pesanan tiba.' : 'Siapkan pembayaran tunai saat pesanan diambil.'));
    b.append(h('button', { class: 'btn ghost wide', onclick: e => { det.hidden = !det.hidden; e.target.textContent = det.hidden ? 'Lihat Detail Pesanan' : 'Sembunyikan Detail' } }, 'Lihat Detail Pesanan'), det,
      h('a', { class: 'btn green wide', href: waLink(S.wa, msg(o)), target: '_blank', rel: 'noopener' }, 'Kirim Pesanan ke WhatsApp'),
      h('button', { class: 'chip wide', onclick: () => { $('#cartD').close(); go(1) } }, 'Kembali ke Beranda'));
  }
  const openCart = () => { go(1); $('#cartD').showModal() };
  $$('.cartOpen').forEach(b => b.onclick = e => { e.preventDefault(); openCart() });
  $('#cartBar').onclick = openCart;
  dialogs();

  /* ---- Login admin (demo, client-side; bukan keamanan produksi) ---- */
  const enter = () => { try { sessionStorage.setItem('mbAdmin', '1') } catch (e) { } location.href = 'admin.html' };
  $$('.loginB').forEach(b => b.onclick = () => { nav.classList.remove('open'); $('#loginD').showModal() }); $('#demoBtn').onclick = enter;
  $('#loginF').onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); if (f.get('e').trim().toLowerCase() === 'admin@masbejo.demo' && f.get('p') === 'admin123') enter(); else alert('Email atau password salah. Coba tombol Akun Demo.') };

  /* ---- Chat admin ---- */
  const chatMsg = f => `Halo ${S.name}, saya ${f.get('name')} (${f.get('phone')}).\n${f.get('text')}`;
  $('#chatBtn').onclick = () => { $('#chatOk').hidden = true; $('#chatD').showModal() };
  $('#chatF').onsubmit = e => {
    e.preventDefault(); const f = new FormData(e.target);
    if (Repo.put('messages', { id: uid(), name: f.get('name').trim(), phone: f.get('phone').trim(), text: f.get('text').trim(), time: new Date().toISOString(), status: 'Baru' })) { e.target.reset(); $('#chatOk').textContent = 'Pesan tersimpan di browser ini. Untuk balasan cepat, kirim juga lewat WhatsApp.'; $('#chatOk').hidden = false }
  };
  $('#chatWa').onclick = e => { const form = $('#chatF'); if (!form.checkValidity()) { e.preventDefault(); form.reportValidity(); return } e.currentTarget.href = waLink(S.wa, chatMsg(new FormData(form))) };

  /* ---- Mulai ---- */
  drawPromo(); drawCats(); drawMenu(); drawGallery(); saveCart();
}
