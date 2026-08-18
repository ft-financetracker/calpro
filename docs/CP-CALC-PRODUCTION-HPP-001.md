# Kontrak Kalkulator HPP Produksi

**Document ID:** `CP-CALC-PRODUCTION-HPP-001`  
**Version:** `4.2.0`

## Tujuan

Menghitung HPP estimasi per produk berdasarkan biaya yang digunakan dalam satu kali produksi. CalPro tidak menentukan jumlah produk; pengguna mengisi sendiri estimasi jumlah produk.

## Input

- `estimatedQuantity`: estimasi jumlah produk, bilangan bulat lebih dari 0.
- `materials[]`: nama, harga beli, jumlah isi, dan jumlah dipakai.
- `packaging[]`: nama, harga beli, jumlah isi, dan jumlah dipakai.
- `laborCost`: total tenaga kerja satu kali produksi.
- `overheadCost`: total overhead satu kali produksi.

Jumlah isi dan jumlah dipakai harus memakai satuan yang sama.

## Rumus

```text
Biaya terpakai item = Harga beli ÷ Jumlah isi × Jumlah dipakai
Total bahan         = Σ biaya terpakai bahan
Total kemasan       = Σ biaya terpakai kemasan
Total produksi      = Bahan + Kemasan + Tenaga kerja + Overhead
HPP per produk      = Total produksi ÷ Estimasi jumlah produk
```

Jika estimasi jumlah produk 0 atau kosong, HPP per produk bernilai 0 dan tombol `Gunakan sebagai HPP` dinonaktifkan.

## Integrasi Harga & HPP

Tombol `Gunakan sebagai HPP` membulatkan HPP estimasi ke atas hingga rupiah penuh, memindahkannya ke input `HPP produk` pada mode Ringkas, lalu membuka modul Harga & HPP.
