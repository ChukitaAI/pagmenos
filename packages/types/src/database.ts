// ============================================================================
// Pagmenos — Database Types (catalog + admin only)
// ============================================================================

import type { SaleType, StockStatus, PromotionType, BannerLinkType, AppRole } from './enums';

export interface UserRole { user_id: string; role: AppRole; created_at: string; updated_at: string; }

export interface Category {
  id: string; name: string; slug: string; description: string | null; icon_key: string | null;
  image_path: string | null; display_order: number; active: boolean; created_at: string; updated_at: string;
}

export interface Product {
  id: string; category_id: string; name: string; slug: string; description: string | null;
  brand: string | null; active_ingredient: string | null; presentation: string | null;
  dosage: string | null; manufacturer: string | null; anvisa_registration: string | null;
  sale_type: SaleType; requires_prescription: boolean; base_price_cents: number;
  track_inventory: boolean; stock_quantity: number; stock_status: StockStatus;
  featured: boolean; active: boolean; created_by: string | null; created_at: string; updated_at: string;
  image_url?: string;
}

export interface ProductWithDetails extends Product {
  category?: Category; images?: ProductImage[]; primary_image?: ProductImage | null;
  effective_price_cents?: number; promotion_name?: string | null; has_promotion?: boolean;
}

export interface ProductImage {
  id: string; product_id: string; storage_path: string; alt_text: string | null;
  display_order: number; is_primary: boolean; created_at: string;
}

export interface Promotion {
  id: string; name: string; promotion_type: PromotionType;
  fixed_price_cents: number | null; percentage_off: number | null; fixed_discount_cents: number | null;
  starts_at: string; ends_at: string | null; active: boolean; created_by: string | null;
  created_at: string; updated_at: string;
}

export interface PromotionProduct { promotion_id: string; product_id: string; }

export interface StoreSettings {
  id: string; store_name: string; whatsapp_number: string; phone: string | null;
  street: string | null; number: string | null; district: string | null; city: string | null;
  state: string | null; zip_code: string | null; complement: string | null; logo_path: string | null;
  pix_enabled: boolean; cash_enabled: boolean; credit_card_enabled: boolean; debit_card_enabled: boolean;
  delivery_enabled: boolean; pickup_enabled: boolean; delivery_fee_cents: number; minimum_order_cents: number;
  created_at: string; updated_at: string;
}

export interface Banner {
  id: string; title: string | null; subtitle: string | null; image_path: string | null;
  link_type: BannerLinkType; link_value: string | null; display_order: number; active: boolean;
  starts_at: string | null; ends_at: string | null; created_by: string | null;
  created_at: string; updated_at: string;
}

export interface AdminAuditLog {
  id: string; actor_user_id: string; action: string; entity_type: string; entity_id: string | null;
  before_data: Record<string, unknown> | null; after_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null; created_at: string;
}
