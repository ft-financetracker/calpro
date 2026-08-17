import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateCashDeposit } from '../js/calculators/cash.js';
import { calculateDiscount } from '../js/calculators/discount.js';
import { calculateHpp } from '../js/calculators/hpp.js';
import { calculateMarketplaceFee } from '../js/calculators/marketplace.js';

test('menyusun HPP dari empat komponen biaya', () => {
  const result = calculateHpp({ materialCost: 2500, packagingCost: 500, laborCost: 500, overheadCost: 500 });
  assert.equal(result.hpp, 4000);
});

test('diskon dihitung dari Harga Jual Awal', () => {
  const result = calculateDiscount({ sellingPrice: 250000, discountRate: 20 });
  assert.equal(result.finalPrice, 200000);
  assert.equal(result.savings, 50000);
});

test('marketplace menghitung total biaya, penerimaan, dan biaya efektif', () => {
  const result = calculateMarketplaceFee({ sellingPrice: 100000, serviceRate: 8, fixedCost: 1250 });
  assert.equal(result.totalCost, 9250);
  assert.equal(result.netRevenue, 90750);
  assert.equal(result.effectiveRate, 9.25);
});

test('setoran kas menjumlahkan pecahan dan membandingkan catatan', () => {
  const result = calculateCashDeposit([
    { value: 100000, quantity: 10 },
    { value: 50000, quantity: 4 },
    { value: 20000, quantity: 5 }
  ], 1300000);

  assert.equal(result.total, 1300000);
  assert.equal(result.difference, 0);
});
