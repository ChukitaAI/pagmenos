-- ============================================================================
-- Pagmenos — Migration 008: Storage Buckets
-- ============================================================================

-- Product images bucket (public read, admin write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 524288, ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Banner images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('banner-images', 'banner-images', true, 1048576, ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Public read
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');
CREATE POLICY "Public read banner images" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'banner-images');

-- Storage RLS: Admin write (AAL2 required)
CREATE POLICY "Admin upload product images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND private.has_manager_or_owner_role(auth.uid()) AND private.is_aal2());
CREATE POLICY "Admin update product images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND private.has_manager_or_owner_role(auth.uid()) AND private.is_aal2());
CREATE POLICY "Admin delete product images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND private.has_manager_or_owner_role(auth.uid()) AND private.is_aal2());

CREATE POLICY "Admin upload banner images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'banner-images' AND private.has_manager_or_owner_role(auth.uid()) AND private.is_aal2());
CREATE POLICY "Admin update banner images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'banner-images' AND private.has_manager_or_owner_role(auth.uid()) AND private.is_aal2());
CREATE POLICY "Admin delete banner images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'banner-images' AND private.has_manager_or_owner_role(auth.uid()) AND private.is_aal2());
