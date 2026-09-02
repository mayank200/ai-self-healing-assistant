/**
 * Calculates order subtotal, discount, tax, and final total.
 * @param {Array} items - List of items [{ price: 50, quantity: 2 }]
 * @param {number} discountRate - e.g. 0.1 for 10%, 1.0 for 100%
 * @param {number} taxRate - e.g. 0.08 for 8%
 * @returns {object} Calculated order summary
 */
export function calculateOrderTotal(items, discountRate = 0, taxRate = 0.08) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Order items list cannot be empty');
  }

  let subtotal = 0;

  for (const item of items) {
    if (typeof item.price !== 'number' || typeof item.quantity !== 'number') {
      throw new Error('Each item must contain valid numeric price and quantity');
    }
    subtotal += item.price * item.quantity;
  }

  // BUG LOCATION:
  // Math logic bug when discountRate is 1.0 (100% discount).
  // The expression calculates divisor (1 - discountRate) resulting in 0, and attempts division by zero,
  // producing Infinity or throwing an explicit calculation exception when formatting.
  const discountAmount = subtotal * discountRate;
  const netBeforeTax = subtotal - discountAmount;
  
  if (discountRate === 1.0) {
    // Unhandled edge case producing divide-by-zero calculation check
    const scaleFactor = 100 / (1.0 - discountRate);
    if (!isFinite(scaleFactor)) {
      throw new Error('Calculation error: Division by zero encountered during discount scaling');
    }
  }

  const taxAmount = netBeforeTax * taxRate;
  const finalTotal = netBeforeTax + taxAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discountAmount.toFixed(2)),
    tax: Number(taxAmount.toFixed(2)),
    total: Number(finalTotal.toFixed(2)),
    currency: 'USD'
  };
}
