// ============================================================================
// Pagmenos — Currency Utilities
// ============================================================================
// All monetary values are stored as integer cents to avoid floating-point errors.

/**
 * Formats cents to BRL currency string.
 * @example formatBRL(990) => "R$ 9,90"
 * @example formatBRL(1050) => "R$ 10,50"
 * @example formatBRL(0) => "R$ 0,00"
 */
export function formatBRL(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats cents to a short display string without "R$".
 * @example formatPriceShort(990) => "9,90"
 */
export function formatPriceShort(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parses a Brazilian currency input string to cents.
 * Accepts: "9,90", "9.90", "R$ 9,90", "R$9,90", "9,9", "10"
 * @returns cents as integer, or null if invalid
 */
export function parseBRLInput(input: string): number | null {
  if (!input || typeof input !== 'string') return null;

  // Remove currency symbol, spaces, dots (thousands separator)
  let cleaned = input.replace(/R\$\s*/g, '').replace(/\s/g, '').trim();

  if (!cleaned) return null;

  // Handle Brazilian format: dots as thousands, comma as decimal
  // If has both dot and comma, dot is thousands separator
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    // Only comma = decimal separator
    cleaned = cleaned.replace(',', '.');
  }

  const value = parseFloat(cleaned);
  if (isNaN(value) || value < 0) return null;

  return Math.round(value * 100);
}

/**
 * Converts cents to reais (float). Use only for display calculations,
 * never as source of truth for monetary operations.
 */
export function centsToReais(cents: number): number {
  return cents / 100;
}

/**
 * Converts reais to cents.
 */
export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}
