function asNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export const CASH_DENOMINATIONS = Object.freeze([100000, 50000, 20000, 10000, 5000, 2000, 1000, 500]);

export function calculateCashDeposit(denominations = [], target = 0) {
  const rows = denominations.map(item => {
    const value = asNonNegativeNumber(item.value);
    const quantity = Math.floor(asNonNegativeNumber(item.quantity));
    return { value, quantity, subtotal: value * quantity };
  });
  const total = rows.reduce((sum, item) => sum + item.subtotal, 0);
  const safeTarget = asNonNegativeNumber(target);

  return { rows, target: safeTarget, total, difference: total - safeTarget };
}
