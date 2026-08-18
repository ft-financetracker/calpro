# Bon & Catatan

**Document ID:** `CP-CALC-RECEIPT-001`  
**Version:** `4.4.0`

## Struktur item

Pengguna dapat mengisi `Nama Bon/Catatan` sebagai nama penyimpanan. Jika dikosongkan, aplikasi membuat nama otomatis berdasarkan tanggal dan waktu.

Setiap item ditampilkan sebagai satu kartu horizontal:

```text
Nama opsional | Qty | Harga satuan | Nominal | Hapus
```

## Kontrak perhitungan

```text
Nominal = Qty × Harga Satuan
```

Jika Harga Satuan kosong sementara Qty dan Nominal diisi:

```text
Harga Satuan = Nominal ÷ Qty
```

Total bon adalah jumlah seluruh nominal pada baris aktif.

## Penyimpanan

Tombol `Simpan Bon` menambahkan record dengan kode kalkulator `RECEIPT` ke penyimpanan lokal CalPro. Tab Riwayat memfilter record tersebut dan menyediakan action buka kembali atau hapus dari perangkat.

Tidak ada sheet baru dan tidak diperlukan migrasi database untuk V4.4.0.
