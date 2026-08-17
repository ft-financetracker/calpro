import { CONFIG } from './config.js';
import { saveRemote } from './api.js';
import { calculateSellingPrice } from './calculators/selling-price.js';

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const catalog = [
  { code: 'CASH_DEPOSIT', title: 'Setoran Kas', desc: 'Hitung pecahan dan selisih kas', icon: 'payments' },
  { code: 'SELLING_PRICE', title: 'Harga Jual', desc: 'HPP, biaya, margin & rekomendasi', icon: 'sell' },
  { code: 'DISCOUNT', title: 'Diskon', desc: 'Harga akhir dan nilai hemat', icon: 'percent' },
  { code: 'MARKETPLACE_FEE', title: 'Biaya Marketplace', desc: 'Fee dan penerimaan bersih', icon: 'storefront' }
];

const guides = {
  CASH_DEPOSIT: {
    steps: ['Masukkan jumlah lembar pada setiap pecahan.', 'Isi total setoran menurut catatan.', 'Periksa status sesuai, kurang, atau lebih.'],
    formula: 'Total aktual = Σ (pecahan × jumlah lembar)\nSelisih = Total aktual − Setoran catatan',
    note: 'Selisih positif berarti uang lebih; selisih negatif berarti uang kurang.'
  },
  SELLING_PRICE: {
    steps: ['Masukkan HPP produk.', 'Tambahkan biaya lainnya yang ikut membentuk modal.', 'Isi target margin lalu pilih kelipatan pembulatan harga.'],
    formula: 'Total modal = HPP + Biaya lainnya\nHarga teoritis = Total modal ÷ (1 − target margin)\nMargin aktual = (Harga rekomendasi − Total modal) ÷ Harga rekomendasi',
    note: 'Margin dihitung dari harga jual, bukan markup atas HPP. Harga rekomendasi selalu dibulatkan ke atas sesuai pilihan.'
  },
  DISCOUNT: {
    steps: ['Masukkan harga awal.', 'Isi persentase diskon.', 'Lihat harga akhir dan nominal penghematan.'],
    formula: 'Nilai diskon = Harga awal × persentase\nHarga akhir = Harga awal − Nilai diskon',
    note: 'Persentase ditulis sebagai angka, misalnya 20 untuk diskon 20%.'
  },
  MARKETPLACE_FEE: {
    steps: ['Masukkan harga jual produk.', 'Isi persentase layanan dan biaya tetap.', 'Lihat penerimaan bersih setelah biaya.'],
    formula: 'Total biaya = (Harga jual × fee) + biaya tetap\nPenerimaan bersih = Harga jual − Total biaya',
    note: 'Gunakan fee sesuai kategori dan program marketplace yang aktif.'
  }
};

let active = 'CASH_DEPOSIT';
let currentResult = {};
let sellingRounding = 500;

function numberField(id, label, value, suffix = '') {
  return `<label class="number-field"><span>${label}</span><div><input id="${id}" type="number" min="0" inputmode="decimal" value="${value}">${suffix ? `<b>${suffix}</b>` : ''}</div></label>`;
}

function renderCatalog(items = catalog) {
  $('#calculatorGrid').innerHTML = items.map(item => `
    <button class="calculator-card ${item.code === active ? 'active' : ''}" data-code="${item.code}">
      <i class="material-symbols-rounded">${item.icon}</i>
      <span><b>${item.title}</b><small>${item.desc}</small></span>
      <em class="material-symbols-rounded">arrow_forward</em>
    </button>`).join('');
  $('#resultCount').textContent = `${items.length} kalkulator ditemukan`;
  $$('.calculator-card').forEach(button => { button.onclick = () => selectCalculator(button.dataset.code, true); });
}

function renderTabs() {
  $('#calculatorTabs').innerHTML = catalog.map(item => `<button class="${item.code === active ? 'active' : ''}" data-code="${item.code}">${item.title}</button>`).join('');
  $$('#calculatorTabs button').forEach(button => { button.onclick = () => selectCalculator(button.dataset.code); });
}

function filterCatalog(term) {
  const query = term.trim().toLowerCase();
  return query ? catalog.filter(item => `${item.title} ${item.desc} ${item.code}`.toLowerCase().includes(query)) : catalog;
}

function selectCalculator(code, scroll = false) {
  active = code;
  renderCatalog(filterCatalog($('#calculatorSearch').value));
  renderTabs();
  renderCalculator();
  if (scroll) $('#workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function header(title, kicker) {
  return `<header class="calculator-header"><div><span class="eyebrow">${kicker}</span><h2>${title}</h2></div><div class="header-tools"><button class="icon-button" data-info aria-label="Lihat panduan dan rumus"><span class="material-symbols-rounded">info</span></button>${active === 'CASH_DEPOSIT' ? '<button class="button button-secondary" id="resetCash">Reset</button>' : ''}</div></header>`;
}

function bindInfoButtons() {
  $$('[data-info]').forEach(button => { button.onclick = openInfo; });
}

function renderCalculator() {
  if (active === 'CASH_DEPOSIT') return renderCash();
  if (active === 'SELLING_PRICE') return renderSellingPrice();

  const data = active === 'DISCOUNT'
    ? { title: 'Kalkulator Diskon', a: ['amount', 'Harga awal', 250000], b: ['rate', 'Besaran diskon', 20] }
    : { title: 'Biaya Marketplace', a: ['amount', 'Harga jual', 100000], b: ['rate', 'Biaya layanan', 8], c: ['cost', 'Biaya tetap', 1250] };

  $('#calculatorPanel').innerHTML = `${header(data.title, 'CALPRO SMART ENGINE')}
    <div class="field-grid">${numberField(...data.a)}${numberField(...data.b, '%')}${data.c ? numberField(...data.c) : ''}</div>
    <section class="result-panel" aria-live="polite"><span id="resultLabel"></span><strong id="resultValue"></strong><small>Dihitung otomatis saat input berubah</small></section>
    <div class="result-details"><span id="detailLabel"></span><span>Persentase<b id="rateValue"></b></span></div>`;
  $$('#calculatorPanel input').forEach(input => { input.oninput = calculateStandard; });
  bindInfoButtons();
  calculateStandard();
}

function renderSellingPrice() {
  $('#calculatorPanel').innerHTML = `${header('Kalkulator Harga Jual', 'HARGA & MARGIN')}
    <div class="selling-layout">
      <section class="selling-input-pane">
        <div class="pane-heading"><span>INPUT PERHITUNGAN</span><p>Masukkan biaya dengan lengkap agar rekomendasi tidak terlalu rendah.</p></div>
        <div class="selling-fields">
          ${numberField('amount', 'HPP produk', 4000)}
          ${numberField('cost', 'Biaya lainnya', 0)}
          ${numberField('rate', 'Target margin', 27, '%')}
        </div>
        <fieldset class="rounding-control">
          <legend>Pembulatan harga</legend>
          <p>Harga rekomendasi dibulatkan ke atas.</p>
          <div class="rounding-options">
            ${[100, 500, 1000].map(value => `<button type="button" class="${value === sellingRounding ? 'active' : ''}" data-rounding="${value}">${rupiah.format(value)}</button>`).join('')}
          </div>
        </fieldset>
      </section>
      <section class="selling-result-pane" aria-live="polite">
        <span class="result-kicker">HARGA REKOMENDASI</span>
        <strong id="resultValue"></strong>
        <small>Sudah termasuk HPP dan biaya lainnya</small>
        <div class="price-summary-grid">
          <span>Harga teoritis<b id="theoreticalValue"></b></span>
          <span>Margin aktual<b id="actualMarginValue"></b></span>
          <span>Total modal<b id="totalCostValue"></b></span>
          <span>Estimasi laba<b id="profitValue"></b></span>
        </div>
        <div class="estimate-strip"><span class="material-symbols-rounded">query_stats</span><span>Estimasi harga jual<small>Rentang praktis dari pembulatan Rp100–Rp1.000</small></span><b id="estimateValue"></b></div>
      </section>
    </div>`;

  $$('#calculatorPanel input').forEach(input => { input.oninput = calculateSelling; });
  $$('.rounding-options button').forEach(button => {
    button.onclick = () => {
      sellingRounding = Number(button.dataset.rounding);
      $$('.rounding-options button').forEach(item => item.classList.toggle('active', item === button));
      calculateSelling();
    };
  });
  bindInfoButtons();
  calculateSelling();
}

function calculateSelling() {
  const result = calculateSellingPrice({
    hpp: $('#amount').value,
    otherCost: $('#cost').value,
    targetMargin: $('#rate').value,
    rounding: sellingRounding
  });

  $('#resultValue').textContent = rupiah.format(result.recommendedPrice);
  $('#theoreticalValue').textContent = rupiah.format(Math.round(result.theoreticalPrice));
  $('#actualMarginValue').textContent = `${percent.format(result.actualMargin)}%`;
  $('#totalCostValue').textContent = rupiah.format(result.totalCost);
  $('#profitValue').textContent = rupiah.format(result.profit);
  $('#estimateValue').textContent = `${rupiah.format(result.estimatedLow)} – ${rupiah.format(result.estimatedHigh)}`;
  currentResult = {
    input: {
      hpp: result.hpp,
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
    title: 'Harga Jual Rekomendasi'
  };
}

function calculateStandard() {
  const amount = +$('#amount').value || 0;
  const rate = +$('#rate').value || 0;
  const cost = $('#cost') ? +$('#cost').value || 0 : 0;
  let result = 0;
  let detail = 0;
  let label = '';
  let detailLabel = '';

  if (active === 'DISCOUNT') {
    detail = amount * rate / 100;
    result = amount - detail;
    label = 'Harga setelah diskon';
    detailLabel = 'Pelanggan hemat';
  } else {
    detail = amount * rate / 100 + cost;
    result = amount - detail;
    label = 'Penerimaan bersih';
    detailLabel = 'Total biaya';
  }

  $('#resultLabel').textContent = label;
  $('#resultValue').textContent = rupiah.format(result);
  $('#detailLabel').innerHTML = `${detailLabel}<b>${rupiah.format(detail)}</b>`;
  $('#rateValue').textContent = `${percent.format(rate)}%`;
  currentResult = { input: { amount, rate, cost }, result: { value: result, detail }, title: label };
}

function renderCash() {
  const pieces = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500];
  $('#calculatorPanel').innerHTML = `${header('Kalkulator Setoran', 'KAS & SETORAN')}
    <div class="cash-grid">${pieces.map((piece, index) => `<div class="cash-row"><span><small>PECAHAN</small><b>${rupiah.format(piece)}</b></span><div class="stepper"><button data-step="-1" aria-label="Kurangi">−</button><input data-piece="${piece}" inputmode="numeric" value="${index === 0 ? 10 : index === 1 ? 4 : index === 2 ? 5 : ''}"><button data-step="1" aria-label="Tambah">+</button></div><strong>Rp0</strong></div>`).join('')}</div>
    <div class="target-field">${numberField('cashTarget', 'Setoran menurut catatan', 1300000)}</div>
    <section class="cash-summary"><span>Total aktual<b id="cashTotal"></b></span><span>Selisih<b id="cashDifference"></b></span><em id="cashState"></em></section>`;
  $$('.stepper button').forEach(button => {
    button.onclick = () => {
      const input = button.parentElement.querySelector('input');
      input.value = Math.max(0, (+input.value || 0) + (+button.dataset.step));
      calculateCash();
    };
  });
  $$('.stepper input, #cashTarget').forEach(input => { input.oninput = calculateCash; });
  $('#resetCash').onclick = () => {
    $$('.stepper input').forEach(input => { input.value = ''; });
    calculateCash();
  };
  bindInfoButtons();
  calculateCash();
}

function calculateCash() {
  let total = 0;
  $$('.stepper input').forEach(input => {
    const subtotal = (+input.dataset.piece) * (+input.value || 0);
    total += subtotal;
    input.closest('.cash-row').querySelector('strong').textContent = rupiah.format(subtotal);
  });
  const target = +$('#cashTarget').value || 0;
  const difference = total - target;
  $('#cashTotal').textContent = rupiah.format(total);
  $('#cashDifference').textContent = rupiah.format(difference);
  $('#cashDifference').className = difference === 0 ? 'ok' : 'warn';
  $('#cashState').textContent = difference === 0 ? 'Sesuai' : difference < 0 ? 'Kurang' : 'Lebih';
  $('#cashState').className = difference === 0 ? 'good' : 'bad';
  currentResult = {
    input: { target, denominations: $$('.stepper input').map(input => ({ value: +input.dataset.piece, quantity: +input.value || 0 })) },
    result: { total, difference },
    title: 'Setoran Kas'
  };
}

function openInfo() {
  const item = catalog.find(entry => entry.code === active);
  const guide = guides[active];
  $('#infoTitle').textContent = item.title;
  $('#infoSteps').innerHTML = guide.steps.map(step => `<li>${step}</li>`).join('');
  $('#infoFormula').textContent = guide.formula;
  $('#infoNote').textContent = guide.note;
  $('#infoDialog').showModal();
}

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2200);
}

function buildRecord() {
  return {
    calculationId: `CAL-${Date.now()}`,
    requestId: crypto.randomUUID(),
    tenantId: CONFIG.tenantId,
    userId: CONFIG.userId,
    appId: CONFIG.appId,
    calculatorCode: active,
    ...currentResult,
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

$('#calculatorSearch').oninput = event => renderCatalog(filterCatalog(event.target.value));
$('#saveDraft').onclick = () => saveLocal();
$('#saveCalculation').onclick = async () => {
  const record = saveLocal('Disimpan lokal, sedang sinkronisasi');
  try {
    const response = await saveRemote(record);
    toast(response.pending ? 'Menunggu URL Apps Script' : 'Perhitungan tersinkron');
  } catch {
    toast('Offline: data aman di perangkat');
  }
};
$$('[data-scroll]').forEach(button => { button.onclick = () => $('#' + button.dataset.scroll).scrollIntoView({ behavior: 'smooth' }); });
$('#heroInfo').onclick = openInfo;
$('#heroHistory').onclick = () => toast('Riwayat tersimpan setelah perhitungan disimpan');
$('#closeInfo').onclick = () => $('#infoDialog').close();
$('#mobileInfo').onclick = openInfo;
$('#infoDialog').onclick = event => { if (event.target === $('#infoDialog')) $('#infoDialog').close(); };
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));

renderCatalog();
renderTabs();
renderCalculator();
