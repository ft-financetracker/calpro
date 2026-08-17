function asNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export function roundUp(value, step) {
  const safeValue = asNonNegativeNumber(value);
  const safeStep = Math.max(1, asNonNegativeNumber(step));
  return Math.ceil(safeValue / safeStep) * safeStep;
}

export function calculateSellingPrice({ hpp = 0, otherCost = 0, targetMargin = 0, rounding = 500 } = {}) {
  const safeHpp = asNonNegativeNumber(hpp);
  const safeOtherCost = asNonNegativeNumber(otherCost);
  const safeMargin = Math.min(asNonNegativeNumber(targetMargin), 99.99);
  const safeRounding = Math.max(1, asNonNegativeNumber(rounding));
  const totalCost = safeHpp + safeOtherCost;
  const theoreticalPrice = totalCost / (1 - safeMargin / 100);
  const recommendedPrice = roundUp(theoreticalPrice, safeRounding);
  const profit = recommendedPrice - totalCost;
  const actualMargin = recommendedPrice > 0 ? (profit / recommendedPrice) * 100 : 0;

  return {
    hpp: safeHpp,
    otherCost: safeOtherCost,
    totalCost,
    targetMargin: safeMargin,
    rounding: safeRounding,
    theoreticalPrice,
    recommendedPrice,
    actualMargin,
    estimatedLow: roundUp(theoreticalPrice, 100),
    estimatedHigh: roundUp(theoreticalPrice, 1000),
    profit
  };
}
