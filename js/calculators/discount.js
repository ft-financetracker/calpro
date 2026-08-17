function asNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export function calculateDiscount({ sellingPrice = 0, discountRate = 0 } = {}) {
  const safeSellingPrice = asNonNegativeNumber(sellingPrice);
  const safeDiscountRate = Math.min(asNonNegativeNumber(discountRate), 100);
  const savings = safeSellingPrice * safeDiscountRate / 100;

  return {
    sellingPrice: safeSellingPrice,
    discountRate: safeDiscountRate,
    savings,
    finalPrice: safeSellingPrice - savings
  };
}
