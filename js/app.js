import { CONFIG } from './config.js';
import { saveRemote } from './api.js';
import { calculateCashDeposit, CASH_DENOMINATIONS } from './calculators/cash.js';
import { calculateDiscount } from './calculators/discount.js';
import { calculateHpp } from './calculators/hpp.js';
import { calculateMarketplaceFee } from './calculators/marketplace.js';
import { calculateProductionHpp } from './calculators/production-hpp.js';
import { calculateSellingPrice } from './calculators/selling-price.js';
import { calculatorHeader, costItemRow, numberField, resultMetric, tipsDisclosure } from './components/templates.js';

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const catalog = [
  { code: 'CASH_DEPOSIT', title: 'Setoran Kas', desc: 'Pecahan, total, dan selisih kas', icon: 'payments' },
  { code: 'SELLING_PRICE', title: 'Harga & HPP', desc: 'Harga jual, HPP per unit, dan produksi', icon: 'sell' },
  { code: 'DISCOUNT', title: 'Diskon', desc: 'Harga akhir dan nilai hemat', icon: 'percent' },
  { code: 'MARKETPLACE_FEE', title: 'Biaya Marketplace', desc: 'Potongan dan penerimaan bersih', icon: 'storefront' }
];

const guides = {
  CASH_DEPOSIT: {
    purpose: 'Menghitung total uang fisik berdasarkan pecahan, lalu membandingkannya dengan nominal setoran pada catatan.',
    steps: ['Isi jumlah lembar atau keping pada setiap nominal.', 'Masukkan setoran menurut catatan.', 'Periksa total aktual, selisih, dan status kas.'],
    formula: 'Total aktual = Σ (nominal × jumlah)\nSelisih = Total aktual − Setoran catatan',
    note: 'Selisih positif berarti uang lebih. Selisih negatif berarti uang kurang.',
    example: 'Rp100.000 × 10 + Rp50.000 × 4 + Rp20.000 × 5 = Rp1.300.000. Jika catatan juga Rp1.300.000, statusnya Sesuai.'
  },
  DISCOUNT: {
    purpose: 'Menghitung harga yang dibayar pelanggan setelah diskon dari Harga Jual Awal—bukan dari HPP produk.',
    steps: ['Masukkan Harga Jual Awal.', 'Isi persentase diskon.', 'Lihat Harga Setelah Diskon dan nominal yang dihemat pelanggan.'],
    formula: 'Nilai diskon = Harga Jual Awal × Diskon\nHarga setelah diskon = Harga Jual Awal − Nilai diskon',
    note: 'Bandingkan harga setelah diskon dengan HPP secara terpisah bila ingin memastikan penjualan tetap untung.',
    example: 'Harga jual awal Rp250.000 dengan diskon 20% menghasilkan harga akhir Rp200.000 dan pelanggan hemat Rp50.000.'
  },
  MARKETPLACE_FEE: {
    purpose: 'Menghitung uang bersih yang diterima penjual setelah biaya layanan persentase dan biaya tetap marketplace.',
    steps: ['Masukkan harga jual di marketplace.', 'Isi persentase biaya layanan.', 'Tambahkan biaya tetap per transaksi bila ada.', 'Periksa total biaya dan persentase biaya efektif.'],
    formula: 'Biaya persentase = Harga jual × Biaya layanan\nTotal biaya = Biaya persentase + Biaya tetap\nPenerimaan bersih = Harga jual − Total biaya\nBiaya efektif = Total biaya ÷ Harga jual',
    note: 'Biaya efektif dapat lebih besar daripada biaya layanan karena sudah memasukkan biaya tetap.',
    example: 'Harga Rp100.000, layanan 8%, dan biaya tetap Rp1.250 menghasilkan total biaya Rp9.250, penerimaan Rp90.750, dan biaya efektif 9,25%.'
  }
};

const sellingGuides = {
  QUICK: {
    title: 'Harga Jual',
    purpose: 'Menentukan harga jual ketika HPP per produk sudah diketahui.',
    steps: ['Masukkan HPP satu produk.', 'Tambahkan biaya penjualan lain per produk bila ada.', 'Isi target margin.', 'Pilih pembulatan Rp500 atau Rp1.000.'],
    formula: 'Total modal = HPP + Biaya penjualan lainnya\nHarga teoritis = Total modal ÷ (1 − Target margin)\nMargin aktual = (Harga rekomendasi − Total modal) ÷ Harga rekomendasi',
    note: 'Gunakan HPP per produk, bukan total biaya satu kali produksi. Margin dihitung dari harga jual, bukan markup dari modal.',
    example: 'HPP Rp3.830 dan margin 27% menghasilkan harga teoritis Rp5.247. Pembulatan Rp500 memberi rekomendasi Rp5.500.'
  },
  BUILDER: {
    title: 'Susun HPP',
    purpose: 'Menjumlahkan komponen biaya per produk dan langsung menentukan harga jual.',
    steps: ['Masukkan bahan baku per produk.', 'Masukkan kemasan, tenaga kerja, dan overhead per produk.', 'Tambahkan biaya penjualan lainnya per produk.', 'Isi margin dan pilih pembulatan.'],
    formula: 'HPP per produk = Bahan + Kemasan + Tenaga kerja + Overhead\nHarga teoritis = (HPP + Biaya penjualan lainnya) ÷ (1 − Target margin)',
    note: 'Seluruh kolom pada mode ini adalah biaya per satu produk. Jangan memasukkan total biaya satu batch.',
    example: 'Bahan Rp2.130 + kemasan Rp900 + tenaga kerja Rp500 + overhead Rp300 menghasilkan HPP Rp3.830.'
  },
  PRODUCTION: {
    title: 'HPP Produksi',
    purpose: 'Menghitung HPP estimasi per produk dari seluruh biaya dalam satu kali produksi.',
    steps: ['Isi estimasi jumlah produk.', 'Tambahkan rincian bahan dan kemasan berdasarkan pembelian serta pemakaian.', 'Isi total tenaga kerja dan overhead satu batch.', 'Gunakan hasilnya sebagai HPP untuk menghitung harga jual.'],
    formula: 'Biaya terpakai = Harga beli ÷ Jumlah isi × Jumlah dipakai\nTenaga kerja batch = Tarif per jam × Lama produksi\nOverhead batch = Gas + Listrik + Air + Bensin bahan + Lainnya\nHPP per produk = Total produksi ÷ Estimasi jumlah produk',
    note: 'Tenaga kerja adalah nilai waktu yang dipakai untuk satu batch, bukan langsung memasukkan gaji bulanan. Tekan tombol i di samping judul kolom untuk melihat rumus dan contoh pengisiannya.',
    example: 'Bu Rina membuat 20 lumpia selama 2 jam. Tarif kerja Rp15.000/jam menghasilkan tenaga kerja Rp30.000. LPG Rp4.400, listrik Rp1.500, air Rp500, dan bensin membeli bahan Rp2.500 menghasilkan overhead Rp8.900.'
  }
};

const fieldGuides = {
  laborRate: {
    title: 'Tarif tenaga kerja per jam',
    purpose: 'Memberikan nilai yang wajar untuk setiap satu jam kerja produksi, termasuk bila usaha masih dikerjakan sendiri.',
    steps: ['Jika sudah memiliki tarif harian, bagi tarif tersebut dengan jam kerja sehari.', 'Jika memakai gaji bulanan, bagi gaji dengan total jam kerja bulanan.', 'Masukkan hasilnya sebagai tarif per jam.'],
    formula: 'Tarif per jam = Gaji bulanan ÷ Jam kerja bulanan',
    note: 'Jangan langsung memasukkan seluruh gaji bulanan karena satu batch hanya memakai sebagian waktu kerja.',
    example: 'Gaji Rp2.400.000 ÷ 200 jam kerja = Rp12.000 per jam.'
  },
  laborHours: {
    title: 'Lama produksi satu batch',
    purpose: 'Mengukur waktu yang benar-benar digunakan untuk menyelesaikan satu kali produksi.',
    steps: ['Mulai hitung dari persiapan bahan.', 'Tambahkan waktu memasak atau merakit.', 'Tambahkan waktu pengemasan yang dikerjakan dalam batch tersebut.'],
    formula: 'Tenaga kerja batch = Tarif per jam × Lama produksi',
    note: 'Waktu menunggu tanpa aktivitas dapat dikurangi jika pekerja mengerjakan pekerjaan produktif lain.',
    example: 'Tarif Rp15.000/jam × 2 jam produksi = Rp30.000 per batch.'
  },
  gasCost: {
    title: 'Gas/LPG per batch',
    purpose: 'Mengalokasikan biaya isi ulang LPG hanya untuk bagian yang digunakan dalam satu batch.',
    steps: ['Catat harga isi ulang tabung.', 'Perkirakan tabung tersebut dapat dipakai untuk berapa batch atau berapa jam.', 'Bagi harga isi ulang berdasarkan pemakaian tersebut.'],
    formula: 'Biaya LPG batch = Harga isi ulang ÷ Jumlah batch pemakaian',
    note: 'Jika lebih mudah memakai waktu: Harga isi ulang ÷ Total jam pemakaian × Jam produksi.',
    example: 'LPG Rp22.000 digunakan untuk 5 batch → Rp22.000 ÷ 5 = Rp4.400 per batch.'
  },
  electricityCost: {
    title: 'Listrik per batch',
    purpose: 'Menghitung listrik berdasarkan daya alat dan lama alat digunakan.',
    steps: ['Lihat daya watt pada label alat.', 'Catat lama alat digunakan.', 'Gunakan tarif per kWh dari tagihan atau token listrik.'],
    formula: 'Biaya = Watt ÷ 1.000 × Jam penggunaan × Tarif per kWh',
    note: 'Jika ada beberapa alat, hitung masing-masing lalu jumlahkan.',
    example: '500 watt ÷ 1.000 × 2 jam × Rp1.500 = Rp1.500 per batch.'
  },
  waterCost: {
    title: 'Air per batch',
    purpose: 'Mengalokasikan air yang dipakai untuk mencuci bahan, memasak, dan membersihkan peralatan produksi.',
    steps: ['Untuk PDAM, gunakan tagihan bulanan yang berkaitan dengan produksi.', 'Tentukan estimasi jumlah batch per bulan.', 'Bagi tagihan produksi dengan jumlah batch.'],
    formula: 'Biaya air batch = Tagihan air produksi ÷ Batch per bulan',
    note: 'Jika menggunakan air galon: Harga galon ÷ Isi liter × Liter yang dipakai.',
    example: 'Tagihan air produksi Rp60.000 ÷ 20 batch = Rp3.000 per batch.'
  },
  fuelCost: {
    title: 'Bensin/transport bahan',
    purpose: 'Menghitung bahan bakar yang digunakan khusus untuk membeli atau mengambil bahan produksi.',
    steps: ['Hitung jarak pulang-pergi.', 'Gunakan konsumsi kendaraan dalam km per liter.', 'Kalikan kebutuhan liter dengan harga bensin.'],
    formula: 'Biaya bensin = Jarak PP ÷ Km per liter × Harga per liter',
    note: 'Bensin mengantar pesanan masuk biaya penjualan. Bensin pribadi tidak masuk HPP.',
    example: '10 km ÷ 40 km/liter × Rp10.000 = Rp2.500 per batch.'
  },
  otherOverhead: {
    title: 'Overhead lainnya',
    purpose: 'Menampung biaya produksi lain seperti sewa, penyusutan alat, perawatan, dan kebersihan.',
    steps: ['Catat biaya bulanan atau tahunan.', 'Ubah menjadi biaya bulanan bila diperlukan.', 'Bagi dengan estimasi jumlah batch per bulan.'],
    formula: 'Biaya per batch = Biaya bulanan ÷ Batch per bulan',
    note: 'Masukkan hanya biaya yang berkaitan dengan proses produksi.',
    example: 'Penyusutan alat Rp25.000/bulan ÷ 20 batch = Rp1.250 per batch.'
  }
};

const state = {
  active: 'CASH_DEPOSIT',
  currentResult: {},
  selling: {
    mode: 'QUICK',
    rounding: 500,
    quick: { hpp: 4000, otherCost: 0, targetMargin: 27 },
    builder: { materialCost: 2500, packagingCost: 500, laborCost: 500, overheadCost: 500, otherCost: 0, targetMargin: 27 }
  },
  production: {
    estimatedQuantity: 20,
    materials: [
      { id: 1, name: 'Kulit lumpia', purchasePrice: 12000, purchaseQuantity: 20, usedQuantity: 20 },
      { id: 2, name: 'Bahan isian', purchasePrice: 30000, purchaseQuantity: 1000, usedQuantity: 800 }
    ],
    packaging: [
      { id: 3, name: 'Kemasan', purchasePrice: 25000, purchaseQuantity: 50, usedQuantity: 20 }
    ],
    laborRate: 15000,
    laborHours: 2,
    laborCost: 30000,
    overhead: { gasCost: 4400, electricityCost: 1500, waterCost: 500, fuelCost: 2500, otherCost: 0 },
    overheadCost: 8900,
    nextItemId: 4
  }
};

function setText(selector, value) {
  const element = $(selector);
  if (element) element.textContent = value;
}

function formatPriceRange(low, high) {
  return low === high ? rupiah.format(low) : `${rupiah.format(low)} – ${rupiah.format(high)}`;
}

function renderCatalog(items = catalog) {
  $('#calculatorGrid').innerHTML = items.map(item => `
    <button type="button" class="calculator-card ${item.code === state.active ? 'active' : ''}" data-code="${item.code}" aria-pressed="${item.code === state.active}">
      <span class="material-symbols-rounded" aria-hidden="true">${item.icon}</span>
      <span><b>${item.title}</b><small>${item.desc}</small></span>
      <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
    </button>`).join('');
  setText('#resultCount', `${items.length} kalkulator ditemukan`);
  $$('.calculator-card').forEach(button => { button.addEventListener('click', () => selectCalculator(button.dataset.code, true)); });
}

function renderTabs() {
  $('#calculatorTabs').innerHTML = catalog.map(item => `<button type="button" class="${item.code === state.active ? 'active' : ''}" data-code="${item.code}" aria-pressed="${item.code === state.active}">${item.title}</button>`).join('');
  $$('#calculatorTabs button').forEach(button => { button.addEventListener('click', () => selectCalculator(button.dataset.code)); });
}

function filterCatalog(term) {
  const query = term.trim().toLowerCase();
  return query ? catalog.filter(item => `${item.title} ${item.desc} ${item.code}`.toLowerCase().includes(query)) : catalog;
}

function selectCalculator(code, scroll = false) {
  state.active = code;
  renderCatalog(filterCatalog($('#calculatorSearch').value));
  renderTabs();
  renderCalculator();
  if (scroll) $('#workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function bindInfoButtons() {
  $$('[data-info]').forEach(button => { button.addEventListener('click', openInfo); });
  $$('[data-field-info]').forEach(button => { button.addEventListener('click', () => openFieldInfo(button.dataset.fieldInfo)); });
}

function bindInputCalculation(callback) {
  $$('#calculatorPanel input').forEach(input => { input.addEventListener('input', callback); });
}

function renderCalculator() {
  if (state.active === 'CASH_DEPOSIT') return renderCash();
  if (state.active === 'SELLING_PRICE') return renderSellingPrice();
  if (state.active === 'DISCOUNT') return renderDiscount();
  return renderMarketplace();
}

function renderCash() {
  const initialQuantities = [10, 4, 5, 0, 0, 0, 0, 0];
  $('#calculatorPanel').innerHTML = `${calculatorHeader('Kalkulator Setoran', 'KAS & SETORAN', { showReset: true })}
    <div class="cash-grid">
      ${CASH_DENOMINATIONS.map((denomination, index) => `<div class="cash-row">
        <b>${rupiah.format(denomination)}</b>
        <div class="stepper">
          <button type="button" data-step="-1" aria-label="Kurangi jumlah ${rupiah.format(denomination)}">−</button>
          <input class="cash-quantity" type="number" min="0" step="1" data-piece="${denomination}" inputmode="numeric" aria-label="Jumlah ${rupiah.format(denomination)}" value="${initialQuantities[index] || ''}">
          <button type="button" data-step="1" aria-label="Tambah jumlah ${rupiah.format(denomination)}">+</button>
        </div>
        <output>${rupiah.format(0)}</output>
      </div>`).join('')}
    </div>
    <div class="target-field">${numberField('cashTarget', 'Setoran menurut catatan', 1300000)}</div>
    <section class="result-card cash-result-card" aria-live="polite">
      <div class="result-card-main">
        <div class="result-primary"><span>Total aktual</span><strong id="cashTotal"></strong><small>Berdasarkan nominal dan jumlah yang diinput</small></div>
        <div class="result-metrics">${resultMetric('Selisih dari catatan', 'cashDifference', { highlight: true })}</div>
        <em class="status-badge" id="cashState"></em>
      </div>
    </section>`;

  $$('.stepper button').forEach(button => {
    button.addEventListener('click', () => {
      const input = button.parentElement.querySelector('input');
      input.value = Math.max(0, (Number(input.value) || 0) + Number(button.dataset.step));
      calculateCash();
    });
  });
  bindInputCalculation(calculateCash);
  $('#resetCash').addEventListener('click', () => {
    $$('.cash-quantity').forEach(input => { input.value = ''; });
    calculateCash();
  });
  bindInfoButtons();
  calculateCash();
}

function calculateCash() {
  const denominations = $$('.cash-quantity').map(input => ({ value: Number(input.dataset.piece), quantity: Number(input.value) || 0 }));
  const result = calculateCashDeposit(denominations, $('#cashTarget').value);

  result.rows.forEach((row, index) => {
    const output = $$('.cash-row output')[index];
    if (output) output.textContent = rupiah.format(row.subtotal);
  });
  setText('#cashTotal', rupiah.format(result.total));
  setText('#cashDifference', rupiah.format(result.difference));
  setText('#cashState', result.difference === 0 ? 'Sesuai' : result.difference < 0 ? 'Kurang' : 'Lebih');
  $('#cashState').classList.toggle('warning', result.difference !== 0);

  state.currentResult = {
    input: { target: result.target, denominations: result.rows.map(({ value, quantity }) => ({ value, quantity })) },
    result: { total: result.total, difference: result.difference },
    title: 'Setoran Kas'
  };
}

function sellingModeControl() {
  return `<div class="segmented-control selling-mode-control" role="group" aria-label="Mode perhitungan Harga dan HPP">
    <button type="button" data-selling-mode="QUICK" class="${state.selling.mode === 'QUICK' ? 'active' : ''}" aria-pressed="${state.selling.mode === 'QUICK'}">Harga Jual</button>
    <button type="button" data-selling-mode="BUILDER" class="${state.selling.mode === 'BUILDER' ? 'active' : ''}" aria-pressed="${state.selling.mode === 'BUILDER'}">Susun HPP</button>
    <button type="button" data-selling-mode="PRODUCTION" class="${state.selling.mode === 'PRODUCTION' ? 'active' : ''}" aria-pressed="${state.selling.mode === 'PRODUCTION'}">HPP Produksi</button>
  </div>`;
}

function bindSellingModeButtons() {
  $$('[data-selling-mode]').forEach(button => {
    button.addEventListener('click', () => {
      state.selling.mode = button.dataset.sellingMode;
      renderSellingPrice();
    });
  });
}

function sellingTipsTemplate() {
  const tips = {
    QUICK: [
      { title: 'HPP produk', description: 'Masukkan HPP untuk satu produk. Gunakan hasil HPP Produksi jika sebelumnya menghitung satu batch.', formula: 'Contoh: Rp76.600 ÷ 20 produk = Rp3.830' },
      { title: 'Biaya penjualan lainnya', description: 'Biaya per produk setelah produksi, seperti admin pembayaran tetap, subsidi promosi, atau komisi penjualan.', formula: 'Biaya per produk = Total biaya penjualan ÷ Produk terjual' },
      { title: 'Target margin', description: 'Persentase laba dari harga jual. Margin berbeda dengan markup.', formula: 'Harga teoritis = Total modal ÷ (1 − margin)' }
    ],
    BUILDER: [
      { title: 'Semua biaya harus per produk', description: 'Bahan, kemasan, tenaga kerja, dan overhead tidak boleh diisi dengan total satu batch.', formula: 'Biaya per produk = Total biaya batch ÷ Jumlah produk' },
      { title: 'Tenaga kerja per produk', description: 'Hitung upah satu kali produksi lalu bagi jumlah produk yang dihasilkan.', formula: 'Rp10.000 ÷ 20 produk = Rp500' },
      { title: 'Overhead per produk', description: 'Gabungkan gas, listrik, dan air yang dialokasikan untuk satu batch, lalu bagi jumlah produk.', formula: 'Rp6.000 ÷ 20 produk = Rp300' }
    ],
    PRODUCTION: [
      { title: 'Estimasi jumlah produk', description: 'Jumlah ditentukan pengguna dan menjadi pembagi seluruh biaya produksi. Gunakan estimasi yang realistis.', formula: 'HPP = Total biaya produksi ÷ Estimasi produk' },
      { title: 'Bahan dan kemasan', description: 'Jumlah isi dan jumlah dipakai harus memakai satuan yang sama: lembar, gram, ml, atau buah.', formula: 'Harga beli ÷ Jumlah isi × Jumlah dipakai' },
      { title: 'Tenaga kerja satu batch', description: 'Bukan langsung gaji bulanan. Gunakan tarif per jam dikali waktu pembuatan satu batch. Jika dikerjakan sendiri, waktu pemilik tetap memiliki nilai.', formula: 'Rp15.000/jam × 2 jam = Rp30.000' },
      { title: 'Jika pegawai digaji bulanan', description: 'Ubah gaji bulanan menjadi tarif per jam, lalu kalikan waktu produksi batch.', formula: 'Rp2.400.000 ÷ 200 jam = Rp12.000/jam' },
      { title: 'Overhead satu batch', description: 'Isi gas/LPG, listrik, air, bensin bahan, dan biaya pendukung lain yang benar-benar dipakai untuk batch tersebut.', formula: 'LPG Rp4.400 + listrik Rp1.500 + air Rp500 + bensin Rp2.500 = Rp8.900' },
      { title: 'Cerita praktik: Bu Rina', description: 'Bu Rina membuat 20 lumpia selama 2 jam. Nilai kerjanya Rp30.000 dan overhead batch Rp8.900. Kedua biaya tetap dibagi ke 20 produk.', formula: '(Rp30.000 + Rp8.900) ÷ 20 = Rp1.945/produk' }
    ]
  };
  return tipsDisclosure(`Tips ${sellingGuides[state.selling.mode].title}`, tips[state.selling.mode]);
}

function sellingInputTemplate() {
  if (state.selling.mode === 'QUICK') {
    const values = state.selling.quick;
    return `<div class="pane-heading"><span>MODE HARGA JUAL</span><p>Gunakan jika HPP per produk sudah tersedia.</p></div>
      <div class="selling-fields">
        ${numberField('hpp', 'HPP per produk', values.hpp)}
        ${numberField('otherCost', 'Biaya penjualan lainnya', values.otherCost)}
        ${numberField('targetMargin', 'Target margin', values.targetMargin, '%', { max: 99.99, step: .01 })}
      </div>`;
  }

  const values = state.selling.builder;
  return `<div class="pane-heading"><span>MODE SUSUN HPP</span><p>Masukkan seluruh komponen biaya untuk satu produk, bukan satu batch.</p></div>
    <div class="hpp-fields">
      ${numberField('materialCost', 'Bahan baku per produk', values.materialCost)}
      ${numberField('packagingCost', 'Kemasan per produk', values.packagingCost)}
      ${numberField('laborCost', 'Tenaga kerja per produk', values.laborCost)}
      ${numberField('overheadCost', 'Overhead per produk', values.overheadCost)}
    </div>
    <div class="hpp-total-note"><span>HPP produk tersusun</span><b id="hppBuildValue"></b></div>
    <div class="supplementary-fields">
      ${numberField('otherCost', 'Biaya penjualan lainnya', values.otherCost)}
      ${numberField('targetMargin', 'Target margin', values.targetMargin, '%', { max: 99.99, step: .01 })}
    </div>`;
}

function sellingResultTemplate() {
  return `<section class="result-card price-result-card" aria-live="polite">
    <div class="result-card-main">
      <div class="result-primary"><span>Harga rekomendasi</span><strong id="sellingResultValue"></strong><small>HPP dan biaya lainnya sudah diperhitungkan</small></div>
      <div class="result-metrics">
        ${resultMetric('Harga teoritis', 'theoreticalValue')}
        ${resultMetric('Margin aktual', 'actualMarginValue', { highlight: true })}
        ${resultMetric('Total modal', 'totalCostValue')}
        ${resultMetric('Estimasi laba', 'profitValue')}
      </div>
    </div>
    <div class="result-toolbar">
      <div class="rounding-inline"><span>Pembulatan</span>${[500, 1000].map(value => `<button type="button" class="${value === state.selling.rounding ? 'active' : ''}" data-rounding="${value}" aria-pressed="${value === state.selling.rounding}">${rupiah.format(value)}</button>`).join('')}</div>
      <div class="estimate-inline"><span class="material-symbols-rounded" aria-hidden="true">query_stats</span><span>Estimasi harga jual</span><b id="estimateValue"></b></div>
    </div>
  </section>`;
}

function renderSellingPrice() {
  if (state.selling.mode === 'PRODUCTION') return renderProductionHpp();
  $('#calculatorPanel').innerHTML = `${calculatorHeader('Harga & HPP', 'HARGA, HPP & MARGIN')}
    ${sellingModeControl()}
    <div class="selling-layout">
      <section class="selling-input-pane">${sellingInputTemplate()}</section>
      ${sellingResultTemplate()}
    </div>
    ${sellingTipsTemplate()}`;

  bindSellingModeButtons();
  $$('[data-rounding]').forEach(button => {
    button.addEventListener('click', () => {
      state.selling.rounding = Number(button.dataset.rounding);
      $$('[data-rounding]').forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      calculateSelling();
    });
  });
  bindInputCalculation(calculateSelling);
  bindInfoButtons();
  calculateSelling();
}

function readSellingInput() {
  if (state.selling.mode === 'QUICK') {
    state.selling.quick = {
      hpp: Number($('#hpp').value) || 0,
      otherCost: Number($('#otherCost').value) || 0,
      targetMargin: Number($('#targetMargin').value) || 0
    };
    return { hpp: state.selling.quick.hpp, otherCost: state.selling.quick.otherCost, targetMargin: state.selling.quick.targetMargin, components: null };
  }

  state.selling.builder = {
    materialCost: Number($('#materialCost').value) || 0,
    packagingCost: Number($('#packagingCost').value) || 0,
    laborCost: Number($('#laborCost').value) || 0,
    overheadCost: Number($('#overheadCost').value) || 0,
    otherCost: Number($('#otherCost').value) || 0,
    targetMargin: Number($('#targetMargin').value) || 0
  };
  const hpp = calculateHpp(state.selling.builder);
  setText('#hppBuildValue', rupiah.format(hpp.hpp));
  return { hpp: hpp.hpp, otherCost: state.selling.builder.otherCost, targetMargin: state.selling.builder.targetMargin, components: hpp };
}

function calculateSelling() {
  const input = readSellingInput();
  const result = calculateSellingPrice({ ...input, rounding: state.selling.rounding });

  setText('#sellingResultValue', rupiah.format(result.recommendedPrice));
  setText('#theoreticalValue', rupiah.format(Math.round(result.theoreticalPrice)));
  setText('#actualMarginValue', `${percent.format(result.actualMargin)}%`);
  setText('#totalCostValue', rupiah.format(result.totalCost));
  setText('#profitValue', rupiah.format(result.profit));
  setText('#estimateValue', formatPriceRange(result.estimatedLow, result.estimatedHigh));

  state.currentResult = {
    input: {
      mode: state.selling.mode,
      hpp: result.hpp,
      hppComponents: input.components,
      otherCost: result.otherCost,
      totalCost: result.totalCost,
      targetMargin: result.targetMargin,
      rounding: result.rounding
    },
    result: {
      theoreticalPrice: result.theoreticalPrice,
      recommendedPrice: result.recommendedPrice,
      actualMargin: result.actualMargin,
      estimatedLow: result.estimatedLow,
      estimatedHigh: result.estimatedHigh,
      profit: result.profit
    },
    title: 'Harga & HPP'
  };
}

function productionCostGroup(group, title, description, items, totalId) {
  return `<section class="production-cost-section" data-cost-group="${group}">
    <header class="production-section-header">
      <div><h3>${title}</h3><p>${description}</p></div>
      <button type="button" class="button button-secondary production-add-button" data-add-cost="${group}">
        <span class="material-symbols-rounded" aria-hidden="true">add</span>Tambah
      </button>
    </header>
    <div class="cost-item-list">
      ${items.length ? items.map(item => costItemRow(group, item)).join('') : '<p class="cost-empty-state">Belum ada rincian biaya. Tekan Tambah untuk membuat baris baru.</p>'}
    </div>
    <footer class="production-section-total"><span>Total ${title.toLowerCase()}</span><b id="${totalId}">Rp0</b></footer>
  </section>`;
}

function productionResultTemplate() {
  return `<section class="result-card production-result-card" aria-live="polite">
    <div class="result-card-main">
      <div class="result-primary"><span>HPP estimasi per produk</span><strong id="productionHppValue"></strong><small>Total biaya produksi dibagi estimasi jumlah produk</small></div>
      <div class="result-metrics">
        ${resultMetric('Bahan per produk', 'materialPerProductValue')}
        ${resultMetric('Kemasan per produk', 'packagingPerProductValue')}
        ${resultMetric('Tenaga kerja per produk', 'laborPerProductValue')}
        ${resultMetric('Overhead per produk', 'overheadPerProductValue')}
      </div>
    </div>
    <div class="result-toolbar production-result-toolbar">
      <div class="production-result-facts">
        <span><small>Total biaya produksi</small><b id="productionTotalValue"></b></span>
        <span><small>Estimasi hasil</small><b id="productionQuantityValue"></b></span>
      </div>
      <button type="button" class="button button-primary" id="useProductionHpp">
        Gunakan sebagai HPP<span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
      </button>
    </div>
  </section>`;
}

function renderProductionHpp() {
  const values = state.production;
  $('#calculatorPanel').innerHTML = `${calculatorHeader('Harga & HPP', 'HARGA, HPP & PRODUKSI')}
    ${sellingModeControl()}
    <div class="mode-introduction"><span class="eyebrow">MODE HPP PRODUKSI</span><h3>Hitung biaya satu kali produksi</h3><p>Masukkan estimasi jumlah produk dan seluruh biaya yang digunakan dalam satu batch.</p></div>
    <section class="production-estimate-card">
      <div class="pane-heading"><span>DASAR PERHITUNGAN</span><h3>Estimasi jumlah produk</h3><p>Jumlah ini ditentukan sendiri oleh pengguna dan menjadi pembagi seluruh biaya produksi.</p></div>
      <div>
        ${numberField('estimatedQuantity', 'Estimasi jumlah produk', values.estimatedQuantity, 'produk', { min: 1, step: 1 })}
        <p class="production-quantity-note" id="productionQuantityNote">Gunakan estimasi yang paling realistis.</p>
      </div>
    </section>
    <div class="production-cost-list">
      ${productionCostGroup('materials', 'Bahan baku', 'Harga beli, jumlah isi, dan jumlah yang dipakai.', values.materials, 'materialBatchValue')}
      ${productionCostGroup('packaging', 'Kemasan', 'Gunakan satuan pembelian dan pemakaian yang sama.', values.packaging, 'packagingBatchValue')}
    </div>
    <section class="production-support-costs">
      <div class="pane-heading"><span>BIAYA PENDUKUNG</span><h3>Dibantu hitung per batch</h3><p>Isi dasar perhitungannya; CalPro akan membentuk total tenaga kerja dan overhead.</p></div>
      <div class="support-cost-grid">
        <article class="support-cost-card">
          <header><span class="material-symbols-rounded" aria-hidden="true">schedule</span><div><h4>Tenaga kerja batch</h4><p>Nilai waktu untuk menyelesaikan satu kali produksi.</p></div></header>
          <div class="field-grid two-columns support-fields">
            ${numberField('productionLaborRate', 'Tarif per jam', values.laborRate, '', { helpKey: 'laborRate' })}
            ${numberField('productionLaborHours', 'Lama produksi', values.laborHours, 'jam', { step: 0.25, helpKey: 'laborHours' })}
          </div>
          <div class="support-total"><span>Total tenaga kerja</span><b id="productionLaborTotalValue"></b></div>
        </article>
        <article class="support-cost-card">
          <header><span class="material-symbols-rounded" aria-hidden="true">bolt</span><div><h4>Overhead batch</h4><p>Biaya pendukung yang digunakan selama produksi.</p></div></header>
          <div class="field-grid support-overhead-fields">
            ${numberField('productionGasCost', 'Gas/LPG', values.overhead.gasCost, '', { helpKey: 'gasCost' })}
            ${numberField('productionElectricityCost', 'Listrik', values.overhead.electricityCost, '', { helpKey: 'electricityCost' })}
            ${numberField('productionWaterCost', 'Air', values.overhead.waterCost, '', { helpKey: 'waterCost' })}
            ${numberField('productionFuelCost', 'Bensin/transport', values.overhead.fuelCost, '', { helpKey: 'fuelCost' })}
            ${numberField('productionOtherOverhead', 'Lainnya', values.overhead.otherCost, '', { helpKey: 'otherOverhead' })}
          </div>
          <div class="support-total"><span>Total overhead</span><b id="productionOverheadTotalValue"></b></div>
        </article>
      </div>
    </section>
    ${sellingTipsTemplate()}
    ${productionResultTemplate()}`;

  bindSellingModeButtons();
  $$('[data-add-cost]').forEach(button => {
    button.addEventListener('click', () => {
      readProductionState();
      const group = button.dataset.addCost;
      state.production[group].push({ id: state.production.nextItemId++, name: '', purchasePrice: 0, purchaseQuantity: 1, usedQuantity: 0 });
      renderProductionHpp();
    });
  });
  $$('[data-remove-cost]').forEach(button => {
    button.addEventListener('click', () => {
      const item = button.closest('[data-cost-item]');
      const group = button.closest('[data-cost-group]').dataset.costGroup;
      readProductionState();
      state.production[group] = state.production[group].filter(entry => entry.id !== Number(item.dataset.itemId));
      renderProductionHpp();
    });
  });
  bindInputCalculation(calculateProduction);
  bindInfoButtons();
  $('#useProductionHpp').addEventListener('click', useProductionHpp);
  calculateProduction();
}

function readProductionCostItems(group) {
  return $$(`[data-cost-group="${group}"] [data-cost-item]`).map(item => ({
    id: Number(item.dataset.itemId),
    name: item.querySelector('[data-cost-field="name"]').value,
    purchasePrice: Number(item.querySelector('[data-cost-field="purchasePrice"]').value) || 0,
    purchaseQuantity: Number(item.querySelector('[data-cost-field="purchaseQuantity"]').value) || 0,
    usedQuantity: Number(item.querySelector('[data-cost-field="usedQuantity"]').value) || 0
  }));
}

function readProductionState() {
  state.production.estimatedQuantity = Number($('#estimatedQuantity')?.value) || 0;
  state.production.materials = readProductionCostItems('materials');
  state.production.packaging = readProductionCostItems('packaging');
  state.production.laborRate = Number($('#productionLaborRate')?.value) || 0;
  state.production.laborHours = Number($('#productionLaborHours')?.value) || 0;
  state.production.laborCost = state.production.laborRate * state.production.laborHours;
  state.production.overhead = {
    gasCost: Number($('#productionGasCost')?.value) || 0,
    electricityCost: Number($('#productionElectricityCost')?.value) || 0,
    waterCost: Number($('#productionWaterCost')?.value) || 0,
    fuelCost: Number($('#productionFuelCost')?.value) || 0,
    otherCost: Number($('#productionOtherOverhead')?.value) || 0
  };
  state.production.overheadCost = Object.values(state.production.overhead).reduce((total, value) => total + value, 0);
  return state.production;
}

function calculateProduction() {
  const result = calculateProductionHpp(readProductionState());
  [...result.materials.map(item => ['materials', item]), ...result.packaging.map(item => ['packaging', item])].forEach(([group, item]) => {
    setText(`[data-cost-output="${group}-${item.id}"]`, rupiah.format(Math.round(item.usedCost)));
  });
  setText('#materialBatchValue', rupiah.format(Math.round(result.materialCost)));
  setText('#packagingBatchValue', rupiah.format(Math.round(result.packagingCost)));
  setText('#productionHppValue', rupiah.format(Math.ceil(result.hppPerProduct)));
  setText('#materialPerProductValue', rupiah.format(Math.ceil(result.materialCostPerProduct)));
  setText('#packagingPerProductValue', rupiah.format(Math.ceil(result.packagingCostPerProduct)));
  setText('#laborPerProductValue', rupiah.format(Math.ceil(result.laborCostPerProduct)));
  setText('#overheadPerProductValue', rupiah.format(Math.ceil(result.overheadCostPerProduct)));
  setText('#productionTotalValue', rupiah.format(Math.round(result.totalProductionCost)));
  setText('#productionQuantityValue', `${result.estimatedQuantity} produk`);
  setText('#productionLaborTotalValue', rupiah.format(Math.round(result.laborCost)));
  setText('#productionOverheadTotalValue', rupiah.format(Math.round(result.overheadCost)));

  const quantityInput = $('#estimatedQuantity');
  const quantityValid = result.estimatedQuantity > 0;
  quantityInput.setAttribute('aria-invalid', String(!quantityValid));
  setText('#productionQuantityNote', quantityValid ? 'Gunakan estimasi yang paling realistis.' : 'Estimasi jumlah produk wajib lebih dari 0.');
  $('#productionQuantityNote').classList.toggle('is-error', !quantityValid);
  $('#useProductionHpp').disabled = !quantityValid || result.totalProductionCost <= 0;

  state.currentResult = {
    input: {
      mode: 'PRODUCTION',
      estimatedQuantity: result.estimatedQuantity,
      materials: result.materials,
      packaging: result.packaging,
      laborRate: state.production.laborRate,
      laborHours: state.production.laborHours,
      laborCost: result.laborCost,
      overheadBreakdown: state.production.overhead,
      overheadCost: result.overheadCost
    },
    result: {
      materialCost: result.materialCost,
      packagingCost: result.packagingCost,
      totalProductionCost: result.totalProductionCost,
      materialCostPerProduct: result.materialCostPerProduct,
      packagingCostPerProduct: result.packagingCostPerProduct,
      laborCostPerProduct: result.laborCostPerProduct,
      overheadCostPerProduct: result.overheadCostPerProduct,
      hppPerProduct: result.hppPerProduct
    },
    title: 'HPP Produksi'
  };
}

function useProductionHpp() {
  const hpp = Math.ceil(state.currentResult.result?.hppPerProduct || 0);
  if (!hpp) return;
  state.selling.quick.hpp = hpp;
  state.selling.mode = 'QUICK';
  selectCalculator('SELLING_PRICE', true);
  toast(`HPP ${rupiah.format(hpp)} dipindahkan ke Harga & HPP`);
}

function standardResultCard({ label, valueId, helper, metrics }) {
  return `<section class="result-card standard-result-card" aria-live="polite">
    <div class="result-card-main">
      <div class="result-primary"><span>${label}</span><strong id="${valueId}"></strong><small>${helper}</small></div>
      <div class="result-metrics">${metrics.join('')}</div>
    </div>
  </section>`;
}

function renderDiscount() {
  $('#calculatorPanel').innerHTML = `${calculatorHeader('Kalkulator Diskon', 'PROMO & HARGA JUAL')}
    <div class="field-grid two-columns">
      ${numberField('sellingPrice', 'Harga Jual Awal', 250000)}
      ${numberField('discountRate', 'Diskon', 20, '%', { max: 100, step: .01 })}
    </div>
    ${standardResultCard({
      label: 'Harga setelah diskon',
      valueId: 'discountResultValue',
      helper: 'Harga yang dibayar pelanggan',
      metrics: [resultMetric('Pelanggan hemat', 'savingsValue'), resultMetric('Persentase diskon', 'discountRateValue')]
    })}`;
  bindInputCalculation(calculateDiscountResult);
  bindInfoButtons();
  calculateDiscountResult();
}

function calculateDiscountResult() {
  const result = calculateDiscount({ sellingPrice: $('#sellingPrice').value, discountRate: $('#discountRate').value });
  setText('#discountResultValue', rupiah.format(result.finalPrice));
  setText('#savingsValue', rupiah.format(result.savings));
  setText('#discountRateValue', `${percent.format(result.discountRate)}%`);
  state.currentResult = {
    input: { sellingPrice: result.sellingPrice, discountRate: result.discountRate },
    result: { finalPrice: result.finalPrice, savings: result.savings },
    title: 'Harga Setelah Diskon'
  };
}

function renderMarketplace() {
  $('#calculatorPanel').innerHTML = `${calculatorHeader('Biaya Marketplace', 'FEE & PENERIMAAN BERSIH')}
    <p class="calculator-description">Hitung potongan platform agar Anda mengetahui uang bersih yang benar-benar diterima.</p>
    <div class="field-grid">
      ${numberField('sellingPrice', 'Harga jual', 100000)}
      ${numberField('serviceRate', 'Biaya layanan', 8, '%', { max: 100, step: .01 })}
      ${numberField('fixedCost', 'Biaya tetap per transaksi', 1250)}
    </div>
    ${standardResultCard({
      label: 'Penerimaan bersih',
      valueId: 'marketplaceResultValue',
      helper: 'Harga jual setelah seluruh biaya marketplace',
      metrics: [resultMetric('Total biaya', 'marketplaceCostValue'), resultMetric('Biaya efektif', 'effectiveRateValue')]
    })}`;
  bindInputCalculation(calculateMarketplaceResult);
  bindInfoButtons();
  calculateMarketplaceResult();
}

function calculateMarketplaceResult() {
  const result = calculateMarketplaceFee({ sellingPrice: $('#sellingPrice').value, serviceRate: $('#serviceRate').value, fixedCost: $('#fixedCost').value });
  setText('#marketplaceResultValue', rupiah.format(result.netRevenue));
  setText('#marketplaceCostValue', rupiah.format(result.totalCost));
  setText('#effectiveRateValue', `${percent.format(result.effectiveRate)}%`);
  state.currentResult = {
    input: { sellingPrice: result.sellingPrice, serviceRate: result.serviceRate, fixedCost: result.fixedCost },
    result: { percentageCost: result.percentageCost, totalCost: result.totalCost, netRevenue: result.netRevenue, effectiveRate: result.effectiveRate },
    title: 'Penerimaan Bersih Marketplace'
  };
}

function openFieldInfo(key) {
  const guide = fieldGuides[key];
  if (!guide) return;
  setText('#infoTitle', guide.title);
  setText('#infoPurpose', guide.purpose);
  $('#infoSteps').innerHTML = guide.steps.map(step => `<li>${step}</li>`).join('');
  setText('#infoFormula', guide.formula);
  setText('#infoNote', guide.note);
  setText('#infoExample', guide.example);
  $('#infoDialog').showModal();
}

function openInfo() {
  const item = catalog.find(entry => entry.code === state.active);
  const guide = state.active === 'SELLING_PRICE' ? sellingGuides[state.selling.mode] : guides[state.active];
  setText('#infoTitle', state.active === 'SELLING_PRICE' ? `${item.title} · ${guide.title}` : item.title);
  setText('#infoPurpose', guide.purpose);
  $('#infoSteps').innerHTML = guide.steps.map(step => `<li>${step}</li>`).join('');
  setText('#infoFormula', guide.formula);
  setText('#infoNote', guide.note);
  setText('#infoExample', guide.example);
  $('#infoDialog').showModal();
}

function openAbout() {
  $('#aboutDialog').showModal();
}

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  window.clearTimeout(toast.timeoutId);
  toast.timeoutId = window.setTimeout(() => element.classList.remove('show'), 2300);
}

function buildRecord() {
  return {
    calculationId: `CAL-${Date.now()}`,
    requestId: crypto.randomUUID ? crypto.randomUUID() : `REQ-${Date.now()}`,
    tenantId: CONFIG.tenantId,
    userId: CONFIG.userId,
    appId: CONFIG.appId,
    calculatorCode: state.active,
    ...state.currentResult,
    status: 'ACTIVE',
    syncStatus: 'PENDING',
    createdAt: new Date().toISOString()
  };
}

function saveLocal(message = 'Draft tersimpan di perangkat') {
  const records = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
  const record = buildRecord();
  records.unshift(record);
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(records.slice(0, 100)));
  toast(message);
  return record;
}

function setMobileNavigationActive(target) {
  $$('[data-mobile-nav]').forEach(item => item.classList.toggle('active', item === target));
}

function bindGlobalEvents() {
  $('#calculatorSearch').addEventListener('input', event => renderCatalog(filterCatalog(event.target.value)));
  $('#saveDraft').addEventListener('click', () => saveLocal());
  $('#saveCalculation').addEventListener('click', async () => {
    const record = saveLocal('Disimpan lokal, sedang sinkronisasi');
    try {
      const response = await saveRemote(record);
      toast(response.pending ? 'Menunggu URL Apps Script' : 'Perhitungan tersinkron');
    } catch {
      toast('Offline: data aman di perangkat');
    }
  });

  $$('[data-scroll]').forEach(button => { button.addEventListener('click', () => $('#' + button.dataset.scroll).scrollIntoView({ behavior: 'smooth' })); });
  $$('a[href="#beranda"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      const mobileHome = $('[data-mobile-nav="home"]');
      if (mobileHome) setMobileNavigationActive(mobileHome);
    });
  });
  $$('[data-open-help]').forEach(button => { button.addEventListener('click', openInfo); });
  $$('[data-open-about]').forEach(button => { button.addEventListener('click', openAbout); });
  $$('[data-close-dialog]').forEach(button => { button.addEventListener('click', () => button.closest('dialog').close()); });
  $$('.modal-dialog').forEach(dialog => { dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }); });
  $('#mobileCalculate').addEventListener('click', () => {
    $('#workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => $('#calculatorPanel input')?.focus({ preventScroll: true }), 450);
  });
  $$('[data-mobile-nav]').forEach(link => { link.addEventListener('click', () => setMobileNavigationActive(link)); });
}

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));

renderCatalog();
renderTabs();
renderCalculator();
bindGlobalEvents();
