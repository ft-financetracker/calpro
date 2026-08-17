# CALPRO SELLING PRICE CALCULATION

**Document ID:** `CP-CALC-PRICE-001`  
**Version:** `1.1.0`  
**Status:** `LOCKED`

## Input

- HPP produk langsung, atau komponen HPP: bahan baku, kemasan, tenaga kerja, dan overhead
- Biaya lainnya
- Target margin
- Kelipatan pembulatan: Rp500 atau Rp1.000

## Rumus

```text
HPP                 = Bahan + Kemasan + Tenaga kerja + Overhead
Total modal         = HPP + Biaya lainnya
Harga teoritis      = Total modal / (1 - target margin)
Harga rekomendasi   = Harga teoritis dibulatkan ke atas
Estimasi laba       = Harga rekomendasi - Total modal
Margin aktual       = Estimasi laba / Harga rekomendasi
```

Margin menggunakan dasar harga jual, bukan markup terhadap HPP.

## Contoh terkunci

```text
HPP                 Rp4.000
Biaya lainnya       Rp0
Target margin       27%
Pembulatan          Rp500

Harga teoritis      Rp5.479
Harga rekomendasi   Rp5.500
Margin aktual       27,27%
Estimasi harga jual Rp5.500–Rp6.000
```
