// ============================================================================
// Pagmenos — Phone Utilities
// ============================================================================

/**
 * Normalizes a phone number by removing all non-digit characters.
 * @example normalizePhone("+55 88 9998-1853") => "558899981853"
 * @example normalizePhone("(88) 9998-1853") => "8899981853"
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Formats a phone number for display.
 * @example formatPhone("558899981853") => "+55 (88) 99981-853"
 * Handles Brazilian mobile numbers.
 */
export function formatPhone(phone: string): string {
  const digits = normalizePhone(phone);

  if (digits.length === 13 && digits.startsWith('55')) {
    // +55 XX XXXXX-XXXX
    const ddd = digits.slice(2, 4);
    const first = digits.slice(4, 9);
    const second = digits.slice(9, 13);
    return `+55 (${ddd}) ${first}-${second}`;
  }

  if (digits.length === 12 && digits.startsWith('55')) {
    // +55 XX XXXX-XXXX (landline)
    const ddd = digits.slice(2, 4);
    const first = digits.slice(4, 8);
    const second = digits.slice(8, 12);
    return `+55 (${ddd}) ${first}-${second}`;
  }

  if (digits.length === 11) {
    // XX XXXXX-XXXX
    const ddd = digits.slice(0, 2);
    const first = digits.slice(2, 7);
    const second = digits.slice(7, 11);
    return `(${ddd}) ${first}-${second}`;
  }

  if (digits.length === 10) {
    // XX XXXX-XXXX
    const ddd = digits.slice(0, 2);
    const first = digits.slice(2, 6);
    const second = digits.slice(6, 10);
    return `(${ddd}) ${first}-${second}`;
  }

  return phone; // Return as-is if format unknown
}

/**
 * Validates that a phone number has a reasonable length for Brazilian numbers.
 */
export function isValidBrazilianPhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  // With country code: 12-13 digits
  // Without: 10-11 digits
  return digits.length >= 10 && digits.length <= 13;
}
