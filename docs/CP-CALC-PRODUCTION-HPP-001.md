# Kontrak Kalkulator HPP Produksi

**Document ID:** `CP-CALC-PRODUCTION-HPP-001`  
**Version:** `4.2.3`

## Tujuan

Menghitung HPP estimasi per produk melalui mode `HPP Produksi` di dalam modul `Harga & HPP`. CalPro tidak menentukan jumlah produk; pengguna mengisi sendiri estimasi jumlah produk.

## Input

- `estimatedQuantity`: estimasi jumlah produk, bilangan bulat lebih dari 0.
- `materials[]`: nama, harga beli, jumlah isi, dan jumlah dipakai.
- `packaging[]`: nama, harga beli, jumlah isi, dan jumlah dipakai.
- `laborRate`: tarif tenaga kerja per jam.
- `laborHours`: lama produksi satu batch dalam jam.
- `overhead`: rincian Gas/LPG, listrik, air, bensin/transport pembelian bahan, dan biaya pendukung lainnya.

Jumlah isi dan jumlah dipakai harus memakai satuan yang sama.

## Rumus

```text
Biaya terpakai item = Harga beli ÷ Jumlah isi × Jumlah dipakai
Total bahan         = Σ biaya terpakai bahan
Total kemasan       = Σ biaya terpakai kemasan
Tenaga kerja batch  = Tarif per jam × Lama produksi
Overhead batch      = Gas/LPG + Listrik + Air + Bensin bahan + Lainnya
Total produksi      = Bahan + Kemasan + Tenaga kerja + Overhead
HPP per produk      = Total produksi ÷ Estimasi jumlah produk
```

Jika estimasi jumlah produk 0 atau kosong, HPP per produk bernilai 0 dan tombol `Gunakan sebagai HPP` dinonaktifkan.

## Integrasi Harga & HPP

Tombol `Gunakan sebagai HPP` membulatkan HPP estimasi ke atas hingga rupiah penuh, lalu memindahkannya ke input `HPP per produk` pada mode Harga Jual di dalam modul yang sama.

Setiap input biaya pendukung memiliki tombol `i` yang membuka panduan kontekstual berisi tujuan, langkah hitung, rumus, catatan klasifikasi biaya, dan contoh praktik.
