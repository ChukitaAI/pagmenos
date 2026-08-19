-- ==========================================
-- Pagmenos Production Auth & RLS Repair
-- ==========================================
-- This script safely repairs the database permissions, roles, and authentication 
-- without destroying existing products or history.

-- 1. ENSURE ENUMS EXIST
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('customer', 'admin');
    END IF;
END
$$;

-- 2. CREATE/VERIFY TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role DEFAULT 'customer'::app_role,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. FIX AUTHENTICATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::public.app_role)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. FIX ADMIN CHECK HELPER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::public.app_role
  );
$$ LANGUAGE sql;

-- 5. ENABLE RLS GLOBALLY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 6. PURGE OBSOLETE OR INSECURE POLICIES
-- Drop any potentially overly-permissive old demo policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.products;
DROP POLICY IF EXISTS "Enable all actions for authenticated users" ON public.products;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.categories;
DROP POLICY IF EXISTS "Enable all actions for authenticated users" ON public.categories;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.order_items;

-- 7. REAPPLY STRICT POLICIES

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User Roles
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Categories
DROP POLICY IF EXISTS "Public categories read" ON public.categories;
CREATE POLICY "Public categories read" ON public.categories FOR SELECT USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin categories all" ON public.categories;
CREATE POLICY "Admin categories all" ON public.categories USING (public.is_admin());

-- Products
DROP POLICY IF EXISTS "Public products read" ON public.products;
CREATE POLICY "Public products read" ON public.products FOR SELECT USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin products all" ON public.products;
CREATE POLICY "Admin products all" ON public.products USING (public.is_admin());

-- Store Settings
DROP POLICY IF EXISTS "Public store settings read" ON public.store_settings;
CREATE POLICY "Public store settings read" ON public.store_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin store settings update" ON public.store_settings;
CREATE POLICY "Admin store settings update" ON public.store_settings FOR UPDATE USING (public.is_admin());

-- Orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order Items
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid()) OR public.is_admin()
);

DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
);

-- 8. FIX STORAGE POLICIES
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
CREATE POLICY "Admin Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
CREATE POLICY "Admin Update Access" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;
CREATE POLICY "Admin Delete Access" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND public.is_admin());

-- 9. ADMIN PROMOTION
DO $$
DECLARE
  v_admin_email text := 'Pagmenos@admin.com';
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(v_admin_email);
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name) VALUES (v_user_id, 'Admin') ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin'::public.app_role) ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::public.app_role;
    RAISE NOTICE 'SUCCESS: User % promoted to admin successfully.', v_admin_email;
  ELSE
    RAISE NOTICE 'WARNING: Admin user % was not found. Create the Auth user in Supabase Authentication and rerun this block.', v_admin_email;
  END IF;
END
$$;

-- 10. VERIFICATION REPORT
SELECT 
  (SELECT count(*) FROM public.categories) as total_categories,
  (SELECT count(*) FROM public.products) as total_products,
  (SELECT count(*) FROM auth.users) as total_users,
  (SELECT count(*) FROM public.user_roles WHERE role = 'admin'::public.app_role) as total_admins;
  
SELECT u.email, r.role 
FROM auth.users u 
LEFT JOIN public.user_roles r ON r.user_id = u.id 
WHERE lower(u.email) = lower('Pagmenos@admin.com');
