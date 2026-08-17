function asNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export function calculateHpp({ materialCost = 0, packagingCost = 0, laborCost = 0, overheadCost = 0 } = {}) {
  const components = {
    materialCost: asNonNegativeNumber(materialCost),
    packagingCost: asNonNegativeNumber(packagingCost),
    laborCost: asNonNegativeNumber(laborCost),
    overheadCost: asNonNegativeNumber(overheadCost)
  };

  return {
    ...components,
    hpp: Object.values(components).reduce((total, value) => total + value, 0)
  };
}
