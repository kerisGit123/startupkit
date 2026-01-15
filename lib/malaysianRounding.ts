/**
 * Malaysian Tax Rounding Standard Utility
 * 
 * Official Malaysian rounding rules for bills:
 * - Last digit 1,2: Round DOWN to nearest 0 (e.g., 82.01 → 82.00, 82.02 → 82.00)
 * - Last digit 3,4: Round UP to nearest 5 (e.g., 82.03 → 82.05, 82.04 → 82.05)
 * - Last digit 6,7: Round DOWN to nearest 5 (e.g., 82.06 → 82.05, 82.07 → 82.05)
 * - Last digit 8,9: Round UP to nearest 10 (e.g., 82.08 → 82.10, 82.09 → 82.10)
 * - Last digit 0,5: No rounding needed (e.g., 82.00 → 82.00, 82.05 → 82.05)
 * 
 * Reference: Bank Negara Malaysia (Central Bank of Malaysia)
 * This rounding mechanism reduces the need for 1 sen coins while maintaining fairness.
 */

export interface RoundingResult {
  originalAmount: number;
  roundedAmount: number;
  adjustment: number;
  needsRounding: boolean;
}

/**
 * Apply Malaysian tax rounding standard to an amount
 * @param amount - The amount to round (in MYR)
 * @returns RoundingResult object with original, rounded amount, and adjustment
 */
export function applyMalaysianRounding(amount: number): RoundingResult {
  // Get the last digit of cents (e.g., 82.03 → 3, 82.07 → 7)
  const cents = Math.round(amount * 100) % 10;
  
  let roundedAmount = amount;
  
  // Apply rounding rules based on last digit
  if (cents === 1 || cents === 2) {
    // Round down to nearest 0 (e.g., 82.01 → 82.00, 82.02 → 82.00)
    roundedAmount = Math.floor(amount * 20) / 20;
  } else if (cents === 3 || cents === 4) {
    // Round up to nearest 5 (e.g., 82.03 → 82.05, 82.04 → 82.05)
    roundedAmount = Math.ceil(amount * 20) / 20;
  } else if (cents === 6 || cents === 7) {
    // Round down to nearest 5 (e.g., 82.06 → 82.05, 82.07 → 82.05)
    roundedAmount = Math.floor(amount * 20) / 20;
  } else if (cents === 8 || cents === 9) {
    // Round up to nearest 10 (e.g., 82.08 → 82.10, 82.09 → 82.10)
    roundedAmount = Math.ceil(amount * 20) / 20;
  }
  // If cents is 0 or 5, no rounding needed
  
  const adjustment = roundedAmount - amount;
  const needsRounding = Math.abs(adjustment) > 0.001;
  
  return {
    originalAmount: amount,
    roundedAmount: needsRounding ? roundedAmount : amount,
    adjustment: needsRounding ? adjustment : 0,
    needsRounding,
  };
}

/**
 * Format amount in MYR currency
 * @param amount - Amount to format
 * @param showCurrency - Whether to show "MYR" prefix (default: true)
 * @returns Formatted string (e.g., "MYR 82.05" or "82.05")
 */
export function formatMYR(amount: number, showCurrency: boolean = true): string {
  const formatted = amount.toFixed(2);
  return showCurrency ? `MYR ${formatted}` : formatted;
}

/**
 * Calculate totals with Malaysian rounding
 * @param subtotal - Subtotal amount
 * @param tax - Tax amount
 * @param discount - Discount amount
 * @param applyRounding - Whether to apply rounding (default: true)
 * @returns Object with all calculated amounts
 */
export function calculateTotalsWithRounding(
  subtotal: number,
  tax: number = 0,
  discount: number = 0,
  applyRounding: boolean = true
) {
  const totalBeforeRounding = subtotal + tax - discount;
  
  if (!applyRounding) {
    return {
      subtotal,
      tax,
      discount,
      totalBeforeRounding,
      roundingAdjustment: 0,
      total: totalBeforeRounding,
      needsRounding: false,
    };
  }
  
  const roundingResult = applyMalaysianRounding(totalBeforeRounding);
  
  return {
    subtotal,
    tax,
    discount,
    totalBeforeRounding,
    roundingAdjustment: roundingResult.adjustment,
    total: roundingResult.roundedAmount,
    needsRounding: roundingResult.needsRounding,
  };
}

/**
 * Test examples for Malaysian rounding
 * Uncomment to verify implementation
 */
/*
console.log("Malaysian Rounding Test Cases:");
console.log("82.01 →", applyMalaysianRounding(82.01)); // Should be 82.00
console.log("82.02 →", applyMalaysianRounding(82.02)); // Should be 82.00
console.log("82.03 →", applyMalaysianRounding(82.03)); // Should be 82.05
console.log("82.04 →", applyMalaysianRounding(82.04)); // Should be 82.05
console.log("82.05 →", applyMalaysianRounding(82.05)); // Should be 82.05 (no change)
console.log("82.06 →", applyMalaysianRounding(82.06)); // Should be 82.05
console.log("82.07 →", applyMalaysianRounding(82.07)); // Should be 82.05
console.log("82.08 →", applyMalaysianRounding(82.08)); // Should be 82.10
console.log("82.09 →", applyMalaysianRounding(82.09)); // Should be 82.10
console.log("82.10 →", applyMalaysianRounding(82.10)); // Should be 82.10 (no change)
*/
