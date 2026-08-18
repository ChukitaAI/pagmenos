// ============================================================================
// Pagmenos — Shared Enums
// ============================================================================

// --- App Role (admin only in MVP) ---
export const AppRole = { STAFF: 'staff', MANAGER: 'manager', OWNER: 'owner' } as const;
export type AppRole = (typeof AppRole)[keyof typeof AppRole];

// --- Sale Type ---
export const SaleType = { NON_MEDICINE: 'non_medicine', OTC: 'otc', PRESCRIPTION: 'prescription', CONTROLLED: 'controlled' } as const;
export type SaleType = (typeof SaleType)[keyof typeof SaleType];

// --- Stock Status ---
export const StockStatus = { IN_STOCK: 'in_stock', OUT_OF_STOCK: 'out_of_stock' } as const;
export type StockStatus = (typeof StockStatus)[keyof typeof StockStatus];

// --- Payment Method (informational — for WhatsApp message) ---
export const PaymentMethod = { PIX: 'pix', CASH: 'cash', CREDIT_CARD: 'credit_card', DEBIT_CARD: 'debit_card' } as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX', cash: 'Dinheiro', credit_card: 'Cartão de crédito', debit_card: 'Cartão de débito',
};

// --- Fulfillment Method (informational — for WhatsApp message, not in DB) ---
export const FulfillmentMethod = { DELIVERY: 'delivery', PICKUP: 'pickup' } as const;
export type FulfillmentMethod = (typeof FulfillmentMethod)[keyof typeof FulfillmentMethod];

export const FULFILLMENT_METHOD_LABELS: Record<FulfillmentMethod, string> = {
  delivery: 'Entrega', pickup: 'Retirar na loja',
};

// --- Promotion Type ---
export const PromotionType = { FIXED_PRICE: 'fixed_price', PERCENTAGE: 'percentage', FIXED_DISCOUNT: 'fixed_discount' } as const;
export type PromotionType = (typeof PromotionType)[keyof typeof PromotionType];

// --- Banner Link Type ---
export const BannerLinkType = { CATEGORY: 'category', PRODUCT: 'product', SEARCH: 'search', EXTERNAL: 'external', NONE: 'none' } as const;
export type BannerLinkType = (typeof BannerLinkType)[keyof typeof BannerLinkType];
