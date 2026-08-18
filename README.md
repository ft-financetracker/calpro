# CalPro PWA

Calculator Pro — Finance Tracker by Qulaimun.

Versi frontend saat ini: **V4.2.0**.

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

Untuk database yang sudah berisi transaksi, jangan menjalankan ulang `setupCalProDatabase()` karena fungsi tersebut ditujukan untuk instalasi baru. Setelah menyalin source Apps Script V4.2.0, jalankan `migrateCalProV420()` satu kali untuk menambahkan master HPP Produksi dan memperbarui versi tanpa menghapus data lama.

## Modul kalkulator

- Setoran Kas: pecahan, total aktual, dan selisih terhadap catatan.
- Harga & HPP: mode Ringkas dan Susun HPP, margin, pembulatan, serta estimasi harga.
- HPP Produksi: estimasi jumlah produk, rincian bahan dan kemasan, biaya batch, serta HPP estimasi per produk.
- Diskon: harga akhir dari Harga Jual Awal dan nilai hemat pelanggan.
- Biaya Marketplace: total potongan, penerimaan bersih, dan biaya efektif.

Kalkulator Harga & HPP selalu membentuk `Total modal = HPP + Biaya lainnya` sebelum menerapkan target margin. Harga rekomendasi dibulatkan ke atas sesuai pilihan Rp500 atau Rp1.000. Rincian kontrak kalkulasi tersedia di `docs/CP-CALC-PRICE-001.md`.

Kalkulator HPP Produksi tidak menentukan jumlah produk secara otomatis. Pengguna mengisi estimasi jumlah produk, kemudian aplikasi menghitung `Biaya terpakai = Harga beli ÷ Jumlah isi × Jumlah dipakai` dan `HPP per produk = Total biaya produksi ÷ Estimasi jumlah produk`.

## Pengujian

Jalankan `node --test tests/*.test.mjs` untuk memeriksa seluruh rumus utama.
