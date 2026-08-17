import { CONFIG } from './config.js';
import { saveRemote } from './api.js';
import { calculateCashDeposit, CASH_DENOMINATIONS } from './calculators/cash.js';
import { calculateDiscount } from './calculators/discount.js';
import { calculateHpp } from './calculators/hpp.js';
import { calculateMarketplaceFee } from './calculators/marketplace.js';
import { calculateSellingPrice } from './calculators/selling-price.js';
import { calculatorHeader, numberField, resultMetric } from './components/templates.js';

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const catalog = [
  { code: 'CASH_DEPOSIT', title: 'Setoran Kas', desc: 'Pecahan, total, dan selisih kas', icon: 'payments' },
  { code: 'SELLING_PRICE', title: 'Harga & HPP', desc: 'Susun HPP dan rekomendasi harga', icon: 'sell' },
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
  SELLING_PRICE: {
    purpose: 'Menyusun HPP produk atau memakai HPP yang sudah tersedia, lalu menentukan harga jual berdasarkan target margin.',
    steps: ['Pilih Ringkas jika HPP sudah diketahui, atau Susun HPP untuk menjumlahkan komponen biaya.', 'Isi biaya lainnya dan target margin.', 'Pilih pembulatan Rp500 atau Rp1.000 di dalam card hasil.'],
    formula: 'HPP = Bahan + Kemasan + Tenaga kerja + Overhead\nTotal modal = HPP + Biaya lainnya\nHarga teoritis = Total modal ÷ (1 − Target margin)\nMargin aktual = (Harga rekomendasi − Total modal) ÷ Harga rekomendasi',
    note: 'Margin dihitung dari harga jual, bukan markup dari HPP. Harga rekomendasi dibulatkan ke atas agar target margin tidak turun.',
    example: 'HPP Rp4.000, biaya lain Rp0, dan margin 27% menghasilkan harga teoritis Rp5.479. Pembulatan Rp500 memberi rekomendasi Rp5.500 dan margin aktual 27,27%.'
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

const state = {
  active: 'CASH_DEPOSIT',
  currentResult: {},
  selling: {
    mode: 'QUICK',
    rounding: 500,
    quick: { hpp: 4000, otherCost: 0, targetMargin: 27 },
    builder: { materialCost: 2500, packagingCost: 500, laborCost: 500, overheadCost: 500, otherCost: 0, targetMargin: 27 }
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
  return `<div class="segmented-control" role="group" aria-label="Mode perhitungan Harga dan HPP">
    <button type="button" data-selling-mode="QUICK" class="${state.selling.mode === 'QUICK' ? 'active' : ''}" aria-pressed="${state.selling.mode === 'QUICK'}">Ringkas</button>
    <button type="button" data-selling-mode="BUILDER" class="${state.selling.mode === 'BUILDER' ? 'active' : ''}" aria-pressed="${state.selling.mode === 'BUILDER'}">Susun HPP</button>
  </div>`;
}

function sellingInputTemplate() {
  if (state.selling.mode === 'QUICK') {
    const values = state.selling.quick;
    return `<div class="pane-heading"><span>MODE RINGKAS</span><p>Gunakan jika HPP produk sudah tersedia.</p></div>
      <div class="selling-fields">
        ${numberField('hpp', 'HPP produk', values.hpp)}
        ${numberField('otherCost', 'Biaya lainnya', values.otherCost)}
        ${numberField('targetMargin', 'Target margin', values.targetMargin, '%', { max: 99.99, step: .01 })}
      </div>`;
  }

  const values = state.selling.builder;
  return `<div class="pane-heading"><span>MODE SUSUN HPP</span><p>Jumlahkan biaya yang membentuk satu unit produk.</p></div>
    <div class="hpp-fields">
      ${numberField('materialCost', 'Bahan baku', values.materialCost)}
      ${numberField('packagingCost', 'Kemasan', values.packagingCost)}
      ${numberField('laborCost', 'Tenaga kerja', values.laborCost)}
      ${numberField('overheadCost', 'Overhead', values.overheadCost)}
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
  $('#calculatorPanel').innerHTML = `${calculatorHeader('Harga & HPP', 'HARGA, HPP & MARGIN')}
    <div class="selling-layout">
      <section class="selling-input-pane">${sellingModeControl()}${sellingInputTemplate()}</section>
      ${sellingResultTemplate()}
    </div>`;

  $$('[data-selling-mode]').forEach(button => {
    button.addEventListener('click', () => {
      state.selling.mode = button.dataset.sellingMode;
      renderSellingPrice();
    });
  });
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

function openInfo() {
  const item = catalog.find(entry => entry.code === state.active);
  const guide = guides[state.active];
  setText('#infoTitle', item.title);
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
