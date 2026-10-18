# Martabak Mas Bejo — Website & Sistem Pemesanan (Prototipe Demo)

Prototipe **frontend** (HTML/CSS/JS murni). Bukan sistem produksi.

## Menjalankan & upload
1. Upload semua file ke **root** repository GitHub → Settings → Pages → Deploy from branch (`main` / root).
2. Lokal: `python -m http.server` lalu buka `http://localhost:8000`.
3. Admin: `/admin.html` — demo `admin` / `admin123` (ganti di `admin.js`; ini BUKAN keamanan nyata).

## Uji cepat
Tambah menu ke keranjang → checkout (QRIS / COD) → buka admin pada browser yang sama → ubah status → ekspor CSV. Edit menu, foto, harga promo, pengaturan, dan reset data demo ada di admin.

## Batasan (jujur)
- Data di `localStorage`: hanya ada di browser & origin yang sama. **Tidak sinkron antar perangkat**, tidak ada notifikasi real-time ke admin.
- `wa.me` hanya membuka WhatsApp dengan teks siap kirim; pelanggan tetap menekan kirim.
- QRIS: tidak ada verifikasi otomatis. Admin mengunggah QRIS resmi dan mengonfirmasi pembayaran manual. Tanpa unggahan, tampil placeholder.
- Foto disimpan terkompresi (JPEG) di localStorage, bukan IndexedDB.
- Login admin hanya demo. Jangan simpan data sensitif.

## Migrasi Firebase
Semua akses data lewat objek `Repo` di `script.js` (`get/save/put/del`) + versi skema. Ganti implementasinya dengan Firestore, login dengan Firebase Auth, foto dengan Storage, dan atur Security Rules. Jangan taruh secret/service account di frontend.
