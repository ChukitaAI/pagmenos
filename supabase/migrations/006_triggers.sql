-- ============================================================================
-- Pagmenos — Migration 006: Triggers
-- ============================================================================

-- Updated At
CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION private.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION private.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION private.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION private.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON store_settings FOR EACH ROW EXECUTE FUNCTION private.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON banners FOR EACH ROW EXECUTE FUNCTION private.update_updated_at();

-- Primary Image (only one per product)
CREATE OR REPLACE FUNCTION public.handle_primary_image()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE product_images SET is_primary = false WHERE product_id = NEW.product_id AND id != NEW.id AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_image_primary_change AFTER INSERT OR UPDATE OF is_primary ON product_images
  FOR EACH ROW WHEN (NEW.is_primary = true) EXECUTE FUNCTION public.handle_primary_image();
