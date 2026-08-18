import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateBasicOperation, calculateBasicUnary, calculateContextualPercent } from '../js/calculators/basic.js';
import { calculateReceipt, calculateReceiptItem } from '../js/calculators/receipt.js';

test('Kalkulator Pintar menghitung empat operasi dasar', () => {
  assert.equal(calculateBasicOperation(125000, 75000, 'add'), 200000);
  assert.equal(calculateBasicOperation(250000, 50000, 'subtract'), 200000);
  assert.equal(calculateBasicOperation(25, 8, 'multiply'), 200);
  assert.equal(calculateBasicOperation(200, 8, 'divide'), 25);
  assert.equal(Number.isNaN(calculateBasicOperation(10, 0, 'divide')), true);
});

test('Kalkulator Pintar menyediakan fungsi cepat', () => {
  assert.equal(calculateBasicUnary(144, 'sqrt'), 12);
  assert.equal(calculateBasicUnary(12, 'square'), 144);
  assert.equal(calculateBasicUnary(4, 'reciprocal'), 0.25);
  assert.equal(Number.isNaN(calculateBasicUnary(-9, 'sqrt')), true);
});

test('persen pintar memakai angka pertama untuk operasi tambah dan kurang', () => {
  assert.equal(calculateContextualPercent(250000, 15, 'add'), 37500);
  assert.equal(calculateBasicOperation(250000, 37500, 'add'), 287500);
  assert.equal(calculateContextualPercent(250000, 15, 'multiply'), 0.15);
});

test('Bon menghitung nominal dari qty dikali harga satuan', () => {
  const item = calculateReceiptItem({ quantity: 5, unitPrice: 20000, amount: '' });
  assert.equal(item.amount, 100000);
  assert.equal(item.unitPrice, 20000);
});

test('Bon membantu harga satuan ketika hanya qty dan nominal yang diisi', () => {
  const item = calculateReceiptItem({ quantity: 5, unitPrice: '', amount: 100000 });
  assert.equal(item.unitPrice, 20000);
  assert.equal(item.amount, 100000);
  assert.equal(item.priceSource, 'AMOUNT');
});

test('Bon menjumlahkan seluruh nominal dan total qty', () => {
  const result = calculateReceipt([
    { quantity: 2, unitPrice: 15000, amount: '' },
    { quantity: 3, unitPrice: '', amount: 60000 }
  ]);
  assert.equal(result.totalAmount, 90000);
  assert.equal(result.totalQuantity, 5);
  assert.equal(result.itemCount, 2);
});
