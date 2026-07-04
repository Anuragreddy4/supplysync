/**
 * Format a number as Indian Rupees (₹) with proper digit grouping.
 * Example: formatINR(12500) → "₹12,500.00"
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
