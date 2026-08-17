# CalPro PWA

Calculator Pro — Finance Tracker by Qulaimun.

Versi frontend saat ini: **V5**.

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

## Rumus harga jual

Kalkulator Harga Jual selalu membentuk `Total modal = HPP + Biaya lainnya` sebelum menerapkan target margin. Harga rekomendasi kemudian dibulatkan ke atas sesuai pilihan Rp100, Rp500, atau Rp1.000. Rincian kontrak kalkulasi tersedia di `docs/CP-CALC-PRICE-001.md`.
