/**
 * Math utilities for safe calculations in milk dashboard sums/totals.
 * Ensures NaN/null/undefined handling, precision, consistent formatting.
 */

export function safeNumber(val: any): number {
  if (val == null) return 0;
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
}

export function safeSum(array: any[], key?: string): number {
  if (!Array.isArray(array) || array.length === 0) return 0;
  return array.reduce((sum: number, item: any) => {
    const value = key ? safeNumber(item[key]) : safeNumber(item);
    return sum + value;
  }, 0);
}

export function safeMultiply(a: any, b: any): number {
  return safeNumber(a) * safeNumber(b);
}

export function safeRound(num: any, decimals: number = 0): number {
  const n = safeNumber(num);
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

export function formatCurrency(num: any, currency: string = 'RWF'): string {
  return safeNumber(num).toLocaleString('en-RW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

export function formatLiters(num: any): string {
  const n = safeNumber(num);
  return n.toLocaleString('en-RW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }) + 'L';
}

/**
 * Safe total amount formatter for milk records.
 */
export function formatAmount(num: any): string {
  return formatCurrency(num);
}

// Export all for easy import
export * from './math';
