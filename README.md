# Martabak Mas Bejo — V2 (Premium Ordering System)

Situs statis (HTML + CSS + vanilla JS), siap GitHub Pages. Tanpa framework, tanpa backend.

## Cara deploy
Unggah **seluruh isi folder ini** ke root repo GitHub Pages (`benyoriki/Martabak`), menimpa file lama. Cache lama otomatis diganti (service worker `mb-v10`, query `?v=10`).

## Struktur & aset
| File | Fungsi |
|---|---|
| index.html, style.css, script.js | Toko: katalog, keranjang, checkout, chat, login |
| admin.html, admin.css, admin.js | Admin Command Center |
| sw.js, manifest*.json | PWA (network-first) |
| logo.png, favicon.png, icon-*.png | Aset dari ZIP asli (tidak diubah) |
| config.json (opsional, buat sendiri) | Menerbitkan menu/pengaturan ke semua pengunjung |

**Foto produk (V2.1)**: dipotong dari poster menu yang Anda kirim, disimpan sebagai WebP di folder `img/` (hero manis & asin, 12 foto rasa, mix, dan `asin-umum`), plus `preview.jpg` untuk pratinjau share. Resolusi mengikuti poster (≈1536 px), jadi foto asli beresolusi lebih tinggi akan lebih tajam: cukup timpa file dengan nama yang sama.
Pemetaan menu → foto: Cokelat Keju, Keju Susu, Kacang Cokelat, Nutella, Telur Spesial, Daging (=Daging Sapi) memakai foto yang sesuai; Telur Ayam memakai foto asin umum; Mix Spesial memakai gabungan separuh manis + separuh asin (bukan foto asli).
Rasa di poster yang belum ada di daftar menu (Oreo Cokelat, Pandan Keju, Kornet Keju, Ayam Pedas, Sosis Keju, Kebab Spesial) tampil di bagian "Semua Pilihan Rasa" dengan tombol *Tanya admin* (WhatsApp). Tambahkan sebagai menu lewat Admin → Menu (isi nama file mis. `img/manis-oreo-cokelat.webp`) setelah harga ditentukan.
Aset yang masih belum ada: `qris.png` (QRIS menampilkan pesan "belum diunggah" sampai diunggah di Admin → Pengaturan).

## Penting: batas arsitektur
Semua data (menu, pesanan, inbox, pengaturan) ada di **localStorage browser masing-masing**.
- Pesanan dari HP pelanggan **tidak** muncul di admin pada perangkat lain. Pesanan resmi masuk lewat tombol **Kirim Pesanan ke WhatsApp**; UI sudah menyatakan hal ini.
- Edit admin hanya terlihat di browser admin. Untuk menerbitkannya: Admin → Backup → **Unduh config.json**, unggah ke repo.
- Login admin adalah demo di sisi browser (`admin@masbejo.demo` / `admin123`), bukan keamanan produksi. Kunci localStorage `mb1_*` tidak diubah.

## Perubahan
- Redesign penuh (Dark Chocolate + Red + Gold, font Outfit), header compact, bottom nav + sticky cart bar di HP, safe-area Android.
- Katalog: kartu dengan label, stepper jumlah, detail produk, kategori (Semua/Manis/Asin/Promo/Terlaris), pencarian.
- Checkout 4 langkah: catatan, nama, WhatsApp, Ambil di tempat / Delivery (diaktifkan admin), alamat, QRIS/Tunai, ringkasan, pesan WhatsApp rapi dengan nomor pesanan.
- Admin: Dashboard (statistik dari data nyata, grafik 7 hari), Pesanan (alur Konfirmasi → Proses → Siap → Selesai / Batal), Menu (tambah/edit/hapus/urutkan/foto), Promo (harga, periode), Inbox, Pelanggan, Laporan (+CSV), Pengaturan, Backup/Restore, toggle toko buka/tutup.
- Field baru bersifat opsional dan kompatibel data lama: `method`, `address`, `promoStart`, `payInfo`, `delivery`, `closed`.

## Bug ditemukan & diperbaiki
1. `admin.js` dipanggil admin.html tetapi **tidak ada di ZIP** → dashboard blank. Ditulis ulang dari skema data (fitur admin lama yang tak terlihat di kode bisa terlewat; jika punya admin.js asli, kirimkan untuk dibandingkan).
2. Semua foto produk/hero/QRIS 404 → fallback ilustrasi, tanpa gambar rusak.
3. Loader dipaksa 3 detik → kini hilang saat halaman siap.
4. Nomor pesanan bisa bentrok setelah ada yang terhapus → memakai nomor urut maksimum.
5. Cabang kode mati di tombol keranjang dihapus; service worker didaftarkan dua kali.
6. `localStorage` tanpa try/catch pada tema/PWA → dibungkus aman.
7. Tutup dialog saat drag dari input keluar kotak → hanya klik backdrop.
8. Chat WhatsApp kini memvalidasi form sebelum membuka WA.

## Diuji (Playwright, Chromium, 390px & 1440px)
33 pemeriksaan lulus: katalog, filter, pencarian, keranjang, checkout (ambil & delivery), nomor pesanan, tautan WhatsApp, chat, login, seluruh tab admin, alur status pesanan, CRUD menu, promo, pengaturan (nomor WA tidak berubah), tanpa scroll horizontal, tanpa error JS.

## Belum dapat diuji
- Foto asli (file tidak ada), tampilan di perangkat Android fisik, pemasangan PWA, pengiriman WhatsApp sungguhan, Google Fonts (diblokir di sandbox; ada fallback font sistem), dan deploy langsung di GitHub Pages.
