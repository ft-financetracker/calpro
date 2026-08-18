const operations = Object.freeze({
  add: (left, right) => left + right,
  subtract: (left, right) => left - right,
  multiply: (left, right) => left * right,
  divide: (left, right) => right === 0 ? Number.NaN : left / right
});

export function calculateBasicOperation(left, right, operator) {
  const operation = operations[operator];
  if (!operation) return Number(right) || 0;

  const result = operation(Number(left) || 0, Number(right) || 0);
  if (!Number.isFinite(result)) return Number.NaN;
  return Number(result.toFixed(10));
}

