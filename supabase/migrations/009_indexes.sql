-- ============================================================================
-- Pagmenos — Migration 009: Indexes
-- ============================================================================

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_promotion_products_product_id ON promotion_products(product_id);
CREATE INDEX idx_products_active ON products(active) WHERE active = true;
CREATE INDEX idx_categories_active ON categories(active) WHERE active = true;
CREATE INDEX idx_products_featured ON products(featured) WHERE featured = true AND active = true;
CREATE INDEX idx_products_stock ON products(stock_status) WHERE active = true;
CREATE INDEX idx_promotions_dates ON promotions(starts_at, ends_at) WHERE active = true;
CREATE INDEX idx_banners_dates ON banners(starts_at, ends_at) WHERE active = true;
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_products_brand_trgm ON products USING gin (brand gin_trgm_ops);
CREATE INDEX idx_products_ingredient_trgm ON products USING gin (active_ingredient gin_trgm_ops);
CREATE INDEX idx_categories_display_order ON categories(display_order);
CREATE INDEX idx_audit_logs_created_at ON admin_audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON admin_audit_logs(entity_type, entity_id);
