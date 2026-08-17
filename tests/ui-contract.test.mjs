import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const appCss = fs.readFileSync(new URL('../css/app.css', import.meta.url), 'utf8');
const componentsCss = fs.readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');
const responsiveCss = fs.readFileSync(new URL('../css/responsive.css', import.meta.url), 'utf8');
const appJs = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');

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
