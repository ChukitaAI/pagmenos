// ============================================================================
// Pagmenos — Slug Utilities
// ============================================================================

/**
 * Generates a URL-safe slug from a string.
 * @example generateSlug("Dipirona 500mg") => "dipirona-500mg"
 * @example generateSlug("Vitamina C Efervescente") => "vitamina-c-efervescente"
 */
export function generateSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric
    .replace(/[\s_]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/-+/g, '-') // Collapse consecutive hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Appends a numeric suffix to handle slug collisions.
 * @example handleSlugCollision("dipirona-500mg", 1) => "dipirona-500mg-1"
 */
export function handleSlugCollision(baseSlug: string, attempt: number): string {
  if (attempt === 0) return baseSlug;
  return `${baseSlug}-${attempt}`;
}
