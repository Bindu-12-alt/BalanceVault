'use strict';
/**
 * Money utilities — integer paise arithmetic only.
 * 1 INR = 100 paise.
 * Never use floating-point math for financial calculations.
 */

/**
 * Convert rupees (user-facing) to paise (storage).
 * Accepts string or number; validates two decimal places max.
 */
const rupeesToPaise = (rupees) => {
  const str = String(rupees).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(str)) {
    throw new Error(`Invalid amount: ${str}`);
  }
  const parts = str.split('.');
  const whole = BigInt(parts[0]) * 100n;
  const fraction = parts[1]
    ? BigInt(parts[1].padEnd(2, '0'))
    : 0n;
  const result = whole + fraction;
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('Amount too large');
  }
  return Number(result);
};

/**
 * Convert paise (storage) to rupees string for display.
 */
const paiseToRupees = (paise) => {
  const p = BigInt(Math.round(paise));
  const whole = p / 100n;
  const fraction = p % 100n;
  return `${whole}.${String(fraction).padStart(2, '0')}`;
};

/**
 * Format paise as currency string.
 */
const formatCurrency = (paise) => `₹${paiseToRupees(paise)}`;

/**
 * Validate that an amount in paise is positive and within sane limits.
 */
const validateAmount = (paise) => {
  if (!Number.isInteger(paise)) throw new Error('Amount must be an integer (paise)');
  if (paise <= 0) throw new Error('Amount must be positive');
  if (paise > 10_000_000_00) throw new Error('Amount exceeds maximum transfer limit (₹1,00,00,000)'); // 1 crore
  return true;
};

module.exports = { rupeesToPaise, paiseToRupees, formatCurrency, validateAmount };
