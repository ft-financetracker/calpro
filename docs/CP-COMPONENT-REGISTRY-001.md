# CalPro Component Registry

Version: 4.2.3

## Atoms

- `button`: primary, secondary, icon, disabled, hover, focus-visible.
- `number-field`: label, numeric input, optional suffix.
- `field-info-button`: tombol `i` ringkas untuk membuka rumus dan contoh sesuai kolom.
- `material-symbols-rounded`: icon system untuk seluruh UI.
- `status-badge`: status Sesuai, Kurang, atau Lebih.

## Molecules

- `search-field`: pencarian katalog kalkulator.
- `segmented-control`: pilihan mode Harga Jual, Susun HPP, atau HPP Produksi.
- `calculation-tips`: panduan kontekstual yang dapat dibuka dan ditutup pada setiap mode.
- `stepper`: pengaturan jumlah pecahan kas.
- `result-metric`: label dan nilai ringkas di dalam result card.
- `rounding-inline`: pilihan pembulatan Rp500 atau Rp1.000.
- `cost-item-row`: rincian harga beli, jumlah isi, jumlah dipakai, dan biaya terpakai.

## Organisms

- `app-header`: brand, navigasi desktop, dan status aplikasi.
- `calculator-card`: kartu katalog kalkulator.
- `calculator-tabs`: perpindahan modul di workspace.
- `result-card`: hasil utama, metrik, dan action terkait.
- `modal-dialog`: panduan kalkulator dan Tentang CalPro.
- `mobile-navigation`: lima menu dengan CTA Hitung berbentuk diamond.
- `production-cost-section`: kelompok rincian bahan baku atau kemasan dengan total biaya batch.
- `support-cost-card`: kalkulator bantuan tenaga kerja dan overhead untuk satu batch.

## Templates

- `calculator-panel`: header kalkulator, input, result card, dan action simpan.
- `selling-layout`: mode HPP, input harga, hasil, pembulatan, dan estimasi.
- `production-hpp-layout`: estimasi produksi, rincian biaya batch, biaya pendukung, dan hasil per produk.

## Aturan penggunaan

- Warna wajib memakai token di `css/tokens.css`.
- Heading memakai Montserrat, body memakai Inter, angka memakai Plus Jakarta Sans.
- Icon UI hanya memakai Google Material Symbols Rounded.
- Perubahan responsif dilakukan di `css/responsive.css` tanpa menduplikasi markup.
