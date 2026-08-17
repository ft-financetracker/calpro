import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateSellingPrice } from '../js/calculators/selling-price.js';

test('menghitung margin berdasarkan harga jual dan membulatkan ke Rp500', () => {
  const result = calculateSellingPrice({ hpp: 4000, otherCost: 0, targetMargin: 27, rounding: 500 });

  assert.equal(Math.round(result.theoreticalPrice), 5479);
  assert.equal(result.recommendedPrice, 5500);
  assert.equal(Number(result.actualMargin.toFixed(2)), 27.27);
  assert.equal(result.estimatedLow, 5500);
  assert.equal(result.estimatedHigh, 6000);
});

test('biaya lainnya selalu masuk ke total modal sebelum margin dihitung', () => {
  const result = calculateSellingPrice({ hpp: 4000, otherCost: 1000, targetMargin: 20, rounding: 100 });

  assert.equal(result.totalCost, 5000);
  assert.equal(result.theoreticalPrice, 6250);
  assert.equal(result.recommendedPrice, 6300);
  assert.equal(result.profit, 1300);
});
