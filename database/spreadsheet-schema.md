# CALPRO SPREADSHEET SCHEMA

**Document ID:** `CP-DATA-ARCH-001`  
**Status:** `LOCKED — INITIAL SCHEMA`

Database dibuat otomatis melalui `setupCalProDatabase()` pada Apps Script.

| Sheet | Fungsi |
|---|---|
| `APP_CONFIG` | Identitas dan versi aplikasi |
| `CALCULATOR_MASTER` | Katalog kalkulator |
| `BUSINESS_PROFILE` | Profil tenant/usaha |
| `PRODUCT_MASTER` | Produk, HPP, harga, dan stok |
| `CALCULATION_HISTORY` | Header input dan hasil kalkulasi |
| `CALCULATION_INPUT` | Detail input dinamis |
| `CASH_COUNT_DETAIL` | Detail pecahan kas |
| `USER_PREFERENCES` | Favorit dan preferensi user |
| `AUDIT_LOG` | Jejak aktivitas |
