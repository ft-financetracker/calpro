function asNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export function calculateMarketplaceFee({ sellingPrice = 0, serviceRate = 0, fixedCost = 0 } = {}) {
  const safeSellingPrice = asNonNegativeNumber(sellingPrice);
  const safeServiceRate = Math.min(asNonNegativeNumber(serviceRate), 100);
  const safeFixedCost = asNonNegativeNumber(fixedCost);
  const percentageCost = safeSellingPrice * safeServiceRate / 100;
  const totalCost = percentageCost + safeFixedCost;
  const netRevenue = safeSellingPrice - totalCost;
  const effectiveRate = safeSellingPrice > 0 ? totalCost / safeSellingPrice * 100 : 0;

  return {
    sellingPrice: safeSellingPrice,
    serviceRate: safeServiceRate,
    fixedCost: safeFixedCost,
    percentageCost,
    totalCost,
    netRevenue,
    effectiveRate
  };
}
