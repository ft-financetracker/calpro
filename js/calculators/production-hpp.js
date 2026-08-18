function asNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function calculateCostItems(items = []) {
  return items.map(item => {
    const purchasePrice = asNonNegativeNumber(item.purchasePrice);
    const purchaseQuantity = asNonNegativeNumber(item.purchaseQuantity);
    const usedQuantity = asNonNegativeNumber(item.usedQuantity);
    const usedCost = purchaseQuantity > 0 ? (purchasePrice / purchaseQuantity) * usedQuantity : 0;

    return {
      id: item.id,
      name: String(item.name || '').trim(),
      purchasePrice,
      purchaseQuantity,
      usedQuantity,
      usedCost
    };
  });
}

export function calculateProductionHpp({
  estimatedQuantity = 0,
  materials = [],
  packaging = [],
  laborRate,
  laborHours,
  laborCost = 0,
  overhead,
  overheadCost = 0
} = {}) {
  const quantity = Math.floor(asNonNegativeNumber(estimatedQuantity));
  const materialItems = calculateCostItems(materials);
  const packagingItems = calculateCostItems(packaging);
  const hasLaborBreakdown = laborRate !== undefined || laborHours !== undefined;
  const safeLaborRate = asNonNegativeNumber(laborRate);
  const safeLaborHours = asNonNegativeNumber(laborHours);
  const safeLaborCost = hasLaborBreakdown ? safeLaborRate * safeLaborHours : asNonNegativeNumber(laborCost);
  const overheadBreakdown = overhead && typeof overhead === 'object'
    ? Object.fromEntries(Object.entries(overhead).map(([key, value]) => [key, asNonNegativeNumber(value)]))
    : null;
  const safeOverheadCost = overheadBreakdown
    ? Object.values(overheadBreakdown).reduce((total, value) => total + value, 0)
    : asNonNegativeNumber(overheadCost);
  const materialCost = materialItems.reduce((total, item) => total + item.usedCost, 0);
  const packagingCost = packagingItems.reduce((total, item) => total + item.usedCost, 0);
  const totalProductionCost = materialCost + packagingCost + safeLaborCost + safeOverheadCost;
  const divide = value => quantity > 0 ? value / quantity : 0;

  return {
    estimatedQuantity: quantity,
    materials: materialItems,
    packaging: packagingItems,
    materialCost,
    packagingCost,
    laborRate: safeLaborRate,
    laborHours: safeLaborHours,
    laborCost: safeLaborCost,
    overheadBreakdown,
    overheadCost: safeOverheadCost,
    totalProductionCost,
    materialCostPerProduct: divide(materialCost),
    packagingCostPerProduct: divide(packagingCost),
    laborCostPerProduct: divide(safeLaborCost),
    overheadCostPerProduct: divide(safeOverheadCost),
    hppPerProduct: divide(totalProductionCost)
  };
}
