export { formatBRL, formatPriceShort, parseBRLInput, centsToReais, reaisToCents } from './currency';
export { buildWhatsAppMessage, buildWhatsAppUrl } from './whatsapp';
export type { WhatsAppMessageParams, WhatsAppMessageProduct, WhatsAppMessageAddress } from './whatsapp';
export { generateSlug, handleSlugCollision } from './slug';
export { normalizePhone, formatPhone, isValidBrazilianPhone } from './phone';
export { formatDate, formatDateTime, formatDateFriendly, formatDateRelative } from './date';
export { mockDB } from './mockDatabase';
export type { MockDBState } from './mockDatabase';
