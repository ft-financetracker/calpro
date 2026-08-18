import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateCashDeposit } from '../js/calculators/cash.js';
import { calculateDiscount } from '../js/calculators/discount.js';
import { calculateHpp } from '../js/calculators/hpp.js';
import { calculateMarketplaceFee } from '../js/calculators/marketplace.js';
import { calculateProductionHpp } from '../js/calculators/production-hpp.js';

test('menyusun HPP dari empat komponen biaya', () => {
  const result = calculateHpp({ materialCost: 2500, packagingCost: 500, laborCost: 500, overheadCost: 500 });
  assert.equal(result.hpp, 4000);
});

test('HPP produksi memakai estimasi jumlah produk sebagai pembagi', () => {
  const result = calculateProductionHpp({
    estimatedQuantity: 20,
    materials: [
      { id: 1, name: 'Kulit lumpia', purchasePrice: 12000, purchaseQuantity: 20, usedQuantity: 20 },
      { id: 2, name: 'Bahan isian', purchasePrice: 30000, purchaseQuantity: 1000, usedQuantity: 800 }
    ],
    packaging: [
      { id: 3, name: 'Kemasan', purchasePrice: 25000, purchaseQuantity: 50, usedQuantity: 20 }
    ],
    laborCost: 10000,
    overheadCost: 6000
  });

  assert.equal(result.materialCost, 36000);
  assert.equal(result.packagingCost, 10000);
  assert.equal(result.totalProductionCost, 62000);
  assert.equal(result.hppPerProduct, 3100);
});

test('HPP produksi aman saat estimasi jumlah produk kosong', () => {
  const result = calculateProductionHpp({ estimatedQuantity: 0, laborCost: 10000 });
  assert.equal(result.totalProductionCost, 10000);
  assert.equal(result.hppPerProduct, 0);
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
