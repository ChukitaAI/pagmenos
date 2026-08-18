-- ============================================================================
-- Pagmenos — Migration 007: Row Level Security
-- ============================================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ========== USER ROLES ==========
CREATE POLICY "Admin can view own role" ON user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Owner can manage roles (AAL2)" ON user_roles FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'owner') AND private.is_aal2());

-- ========== CATEGORIES ==========
CREATE POLICY "Public read active categories" ON categories FOR SELECT TO anon, authenticated
  USING (active = true);
CREATE POLICY "Admin manage categories (AAL2)" ON categories FOR ALL TO authenticated
  USING (private.has_manager_or_owner_role(auth.uid()) AND private.is_aal2());

-- ========== PRODUCTS ==========
CREATE POLICY "Public read active products" ON products FOR SELECT TO anon, authenticated
  USING (active = true);
CREATE POLICY "Admin read all products (AAL2)" ON products FOR SELECT TO authenticated
  USING (private.has_any_admin_role(auth.uid()) AND private.is_aal2());
CREATE POLICY "Admin insert products (AAL2)" ON products FOR INSERT TO authenticated
  WITH CHECK (private.has_manager_or_owner_role(auth.uid()) AND private.is_aal2());
CREATE POLICY "Admin update products (AAL2)" ON products FOR UPDATE TO authenticated
  USING (private.has_manager_or_owner_role(auth.uid()) AND private.is_aal2());

-- ========== PRODUCT IMAGES ==========
CREATE POLICY "Public read product images" ON product_images FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "Admin manage images (AAL2)" ON product_images FOR ALL TO authenticated
  USING (private.has_manager_or_owner_role(auth.uid()) AND private.is_aal2());

-- ========== PROMOTIONS ==========
CREATE POLICY "Public read active promotions" ON promotions FOR SELECT TO anon, authenticated
  USING (active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY "Admin manage promotions (AAL2)" ON promotions FOR ALL TO authenticated
  USING (private.has_manager_or_owner_role(auth.uid()) AND private.is_aal2());

-- ========== PROMOTION PRODUCTS ==========
CREATE POLICY "Public read promotion products" ON promotion_products FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "Admin manage promotion products (AAL2)" ON promotion_products FOR ALL TO authenticated
  USING (private.has_manager_or_owner_role(auth.uid()) AND private.is_aal2());

-- ========== STORE SETTINGS ==========
CREATE POLICY "Public read settings" ON store_settings FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "Owner update settings (AAL2)" ON store_settings FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'owner') AND private.is_aal2());

-- ========== BANNERS ==========
CREATE POLICY "Public read active banners" ON banners FOR SELECT TO anon, authenticated
  USING (active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY "Admin manage banners (AAL2)" ON banners FOR ALL TO authenticated
  USING (private.has_manager_or_owner_role(auth.uid()) AND private.is_aal2());

-- ========== ADMIN AUDIT LOGS ==========
CREATE POLICY "Admin read audit logs (AAL2)" ON admin_audit_logs FOR SELECT TO authenticated
  USING (private.has_any_admin_role(auth.uid()) AND private.is_aal2());
CREATE POLICY "Admin insert audit logs (AAL2)" ON admin_audit_logs FOR INSERT TO authenticated
  WITH CHECK (private.has_any_admin_role(auth.uid()) AND private.is_aal2());
