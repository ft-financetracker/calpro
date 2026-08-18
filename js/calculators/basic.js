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

export function calculateBasicUnary(value, action) {
  const number = Number(value) || 0;
  let result = number;

  if (action === 'sqrt') result = number < 0 ? Number.NaN : Math.sqrt(number);
  if (action === 'square') result = number * number;
  if (action === 'reciprocal') result = number === 0 ? Number.NaN : 1 / number;

  if (!Number.isFinite(result)) return Number.NaN;
  return Number(result.toFixed(10));
}

export function calculateContextualPercent(firstOperand, percentage, operator) {
  const rate = (Number(percentage) || 0) / 100;
  if (operator === 'add' || operator === 'subtract') {
    return Number(((Number(firstOperand) || 0) * rate).toFixed(10));
  }
  return Number(rate.toFixed(10));
}
