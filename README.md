# CalPro PWA

Calculator Pro — Finance Tracker by Qulaimun.

Versi frontend saat ini: **V4.4.0**.

## Menjalankan frontend

Gunakan static server, misalnya `npx serve .`; jangan membuka `index.html` langsung karena ES modules dan Service Worker memerlukan HTTP.

## Menyiapkan database

1. Buat Spreadsheet kosong bernama `CalPro Database`.
2. Salin ID Spreadsheet ke `apps-script/Config.gs`.
3. Buat Apps Script project dan salin seluruh file dari folder `apps-script`.
4. Jalankan `setupCalProDatabase()` satu kali.
5. Deploy sebagai Web App.
6. Masukkan URL deployment ke `js/config.js`.
7. Publikasikan folder frontend melalui GitHub Pages.

V4.4.0 tidak memerlukan migrasi Spreadsheet atau deployment Apps Script baru. Riwayat Bon & Catatan dan urutan Menu Cepat menggunakan penyimpanan lokal CalPro. Jangan menjalankan ulang `setupCalProDatabase()` pada database yang sudah berisi transaksi.

## Modul kalkulator

- Kas & Setoran: pecahan, total aktual, dan selisih terhadap catatan.
- Harga & HPP: tiga mode—Harga Jual, Susun HPP, dan HPP Produksi—serta tips kontekstual pada setiap mode.
- Kalkulator Diskon: harga akhir dari Harga Jual Awal dan nilai hemat pelanggan.
- Fee Marketplace: total potongan, penerimaan bersih, dan biaya efektif.
- Kalkulator Pintar: operasi standar, persen kontekstual, memori, akar, kuadrat, kebalikan, keyboard, Riwayat Cepat, dan tips perhitungan.
- Bon & Catatan: nama penyimpanan, item satu baris per kartu, total otomatis, penyimpanan lokal, dan riwayat yang dapat dibuka kembali.

Kalkulator Harga & HPP selalu membentuk `Total modal = HPP + Biaya lainnya` sebelum menerapkan target margin. Harga rekomendasi dibulatkan ke atas sesuai pilihan Rp500 atau Rp1.000. Rincian kontrak kalkulasi tersedia di `docs/CP-CALC-PRICE-001.md`.

Mode HPP Produksi tidak menentukan jumlah produk secara otomatis. Pengguna mengisi estimasi jumlah produk, kemudian aplikasi menghitung `Biaya terpakai = Harga beli ÷ Jumlah isi × Jumlah dipakai` dan `HPP per produk = Total biaya produksi ÷ Estimasi jumlah produk`.

Tenaga kerja batch dihitung dari `Tarif per jam × Lama produksi`. Overhead batch dibantu melalui rincian Gas/LPG, listrik, air, bensin/transport pembelian bahan, dan biaya pendukung lainnya. Tombol `i` di samping setiap judul biaya membuka rumus, langkah, serta contoh pengisian tanpa memenuhi layar utama. Pada layar sampai 800 px, rincian bahan ditampilkan sebagai kartu ringkas dengan Harga, Isi, dan Dipakai dalam satu baris.

Pada Bon & Catatan, rumus utama adalah `Nominal = Qty × Harga Satuan`. Jika Harga Satuan dikosongkan tetapi Qty dan Nominal diisi, aplikasi menghitung balik `Harga Satuan = Nominal ÷ Qty`. Setiap item tetap berupa satu kartu horizontal pada desktop maupun mobile. Nama penyimpanan dapat diisi pengguna; jika kosong, aplikasi membentuk nama berdasarkan tanggal dan waktu.

Menu Pengaturan memungkinkan pengguna mengubah urutan kartu dan tab kalkulator dengan tombol naik/turun. Preferensi disimpan pada perangkat tanpa mengubah kode modul atau data perhitungan.

## Pengujian

Jalankan `node --test tests/*.test.mjs` untuk memeriksa seluruh rumus utama.
