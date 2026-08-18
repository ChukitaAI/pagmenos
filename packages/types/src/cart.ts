// ============================================================================
// Pagmenos — Cart Types
// ============================================================================

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartProductInfo {
  id: string;
  name: string;
  slug: string;
  base_price_cents: number;
  effective_price_cents: number;
  stock_status: string;
  image_url: string | null;
  brand: string | null;
  has_promotion: boolean;
}
