import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const appCss = fs.readFileSync(new URL('../css/app.css', import.meta.url), 'utf8');
const componentsCss = fs.readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');
const responsiveCss = fs.readFileSync(new URL('../css/responsive.css', import.meta.url), 'utf8');
const appJs = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const templatesJs = fs.readFileSync(new URL('../js/components/templates.js', import.meta.url), 'utf8');

test('hero memakai CTA terpisah di kanan dan bukan dekorasi lama', () => {
  assert.match(html, /class="hero-actions"/);
  assert.doesNotMatch(html, /hero-decoration/);
  assert.match(responsiveCss, /\.hero-actions\s*\{[^}]*min-width:\s*120px/s);
});

test('hero dan result card tidak memakai motif garis berulang', () => {
  assert.doesNotMatch(`${appCss}\n${componentsCss}\n${responsiveCss}`, /repeating-linear-gradient/);
});

test('spinner bawaan input angka disembunyikan', () => {
  assert.match(componentsCss, /input\[type="number"\]::\-webkit-inner-spin-button/);
  assert.match(componentsCss, /appearance:\s*textfield/);
});

test('toolbar hasil mobile mempertahankan label kiri dan tombol kanan', () => {
  assert.match(responsiveCss, /\.rounding-inline\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto\s+auto/s);
});

test('Beranda selalu menuju posisi paling atas', () => {
  assert.match(appJs, /a\[href="#beranda"\]/);
  assert.match(appJs, /window\.scrollTo\(\{\s*top:\s*0/);
});

test('Harga & HPP menggabungkan tiga mode dalam satu modul', () => {
  assert.doesNotMatch(appJs, /code: 'PRODUCTION_HPP'/);
  assert.match(appJs, /code: 'SELLING_PRICE'/);
  assert.match(appJs, /data-selling-mode="QUICK"/);
  assert.match(appJs, /data-selling-mode="BUILDER"/);
  assert.match(appJs, /data-selling-mode="PRODUCTION"/);
  assert.match(appJs, />Harga Jual</);
  assert.match(appJs, /Gunakan sebagai HPP/);
});

test('setiap mode Harga & HPP memiliki tips dan panduan kontekstual', () => {
  assert.match(appJs, /Tips Harga Jual|sellingTipsTemplate/);
  assert.match(appJs, /Tenaga kerja satu batch/);
  assert.match(appJs, /Overhead satu batch/);
  assert.match(appJs, /sellingGuides\[state\.selling\.mode\]/);
});

test('HPP Produksi membimbing biaya pendukung dan menjaga kartu mobile ringkas', () => {
  assert.match(appJs, /productionLaborRate/);
  assert.match(appJs, /productionLaborHours/);
  assert.match(appJs, /productionGasCost/);
  assert.match(appJs, /Cerita praktik: Bu Rina/);
  assert.match(responsiveCss, /@media \(max-width: 800px\)[\s\S]*\.cost-item\s*\{[^}]*grid-template-columns:\s*repeat\(3,/);
});

test('kolom biaya pendukung menyediakan tombol info rumus yang kontekstual', () => {
  assert.match(templatesJs, /data-field-info="\$\{options\.helpKey\}"/);
  assert.match(appJs, /function openFieldInfo\(key\)/);
  assert.match(appJs, /data-field-info/);
  assert.match(appJs, /helpKey: 'laborRate'/);
  assert.match(appJs, /helpKey: 'gasCost'/);
  assert.match(appJs, /helpKey: 'electricityCost'/);
  assert.match(appJs, /helpKey: 'waterCost'/);
  assert.match(appJs, /helpKey: 'fuelCost'/);
  assert.match(appJs, /productionFuelCost/);
  assert.match(componentsCss, /\.field-info-button/);
});

test('dua modul baru ditambahkan tanpa memisahkan mode Harga dan HPP', () => {
  assert.match(appJs, /code: 'BASIC_CALCULATOR'/);
  assert.match(appJs, /code: 'RECEIPT'/);
  assert.match(appJs, />Buat Bon</);
  assert.match(appJs, />Riwayat</);
  assert.match(appJs, /data-selling-mode="PRODUCTION"/);
});

test('item bon tetap satu kartu satu baris dan dipadatkan pada mobile', () => {
  assert.match(templatesJs, /class="receipt-item"/);
  assert.match(componentsCss, /\.receipt-item\s*\{[^}]*grid-template-columns:/s);
  assert.match(responsiveCss, /@media \(max-width: 640px\)[\s\S]*\.receipt-item\s*\{[^}]*grid-template-columns:/);
  assert.doesNotMatch(responsiveCss, /\.receipt-item\s*\{[^}]*overflow-x:\s*auto/s);
});

test('bon mendukung kalkulasi terbalik dan riwayat lokal', () => {
  assert.match(appJs, /Harga satuan kosong \+ Nominal diisi/);
  assert.match(appJs, /function saveReceiptRecord\(/);
  assert.match(appJs, /calculatorCode === 'RECEIPT'/);
  assert.match(appJs, /data-load-receipt/);
  assert.match(appJs, /data-delete-receipt/);
});
