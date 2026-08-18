function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundMoney(value) {
  return Math.round((asNumber(value) + Number.EPSILON) * 100) / 100;
}

export function calculateReceiptItem(item = {}) {
  const quantity = Math.max(0, asNumber(item.quantity));
  const amountProvided = item.amount !== '' && item.amount !== null && item.amount !== undefined;
  const unitPriceProvided = item.unitPrice !== '' && item.unitPrice !== null && item.unitPrice !== undefined;
  const preferAmount = item.priceSource === 'AMOUNT' || !unitPriceProvided;
  let unitPrice = Math.max(0, asNumber(item.unitPrice));
  let amount = Math.max(0, asNumber(item.amount));

  if (preferAmount && amountProvided && quantity > 0) {
    unitPrice = roundMoney(amount / quantity);
  } else if (unitPriceProvided) {
    amount = roundMoney(quantity * unitPrice);
  }

  return {
    ...item,
    quantity,
    unitPrice,
    amount,
    priceSource: preferAmount && amountProvided ? 'AMOUNT' : 'UNIT_PRICE'
  };
}

export function calculateReceipt(items = []) {
  const normalizedItems = items.map(calculateReceiptItem);
  return {
    items: normalizedItems,
    itemCount: normalizedItems.filter(item => item.amount > 0).length,
    totalQuantity: roundMoney(normalizedItems.reduce((total, item) => total + item.quantity, 0)),
    totalAmount: roundMoney(normalizedItems.reduce((total, item) => total + item.amount, 0))
  };
}

