-- ==========================================
-- Pagmenos Supabase Complete Setup SQL
-- ==========================================
-- TEMPORARY ADMIN EMAIL: Pagmenos@admin.com
-- Create this user manually in Supabase Auth before or after running this script.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. ENUMS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('customer', 'admin');
    END IF;
END
$$;

-- 3. TABLES

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role DEFAULT 'customer'::app_role,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon_key text,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  brand text,
  price_cents integer NOT NULL CHECK (price_cents > 0),
  promotional_price_cents integer CHECK (promotional_price_cents IS NULL OR promotional_price_cents > 0),
  promotion_starts_at timestamptz,
  promotion_ends_at timestamptz,
  is_in_stock boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT check_promotion_dates CHECK (promotion_ends_at IS NULL OR promotion_starts_at IS NULL OR promotion_ends_at > promotion_starts_at)
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  created_at timestamptz DEFAULT now()
);

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  subtotal_cents integer NOT NULL CHECK (subtotal_cents >= 0),
  created_at timestamptz DEFAULT now()
);

-- Store Settings
CREATE TABLE IF NOT EXISTS public.store_settings (
  id smallint PRIMARY KEY CHECK (id = 1),
  store_name text,
  whatsapp_number text,
  phone text,
  logo_path text,
  pix_enabled boolean DEFAULT true,
  cash_enabled boolean DEFAULT true,
  credit_card_enabled boolean DEFAULT true,
  debit_card_enabled boolean DEFAULT true,
  delivery_enabled boolean DEFAULT true,
  pickup_enabled boolean DEFAULT true,
  delivery_fee_cents integer DEFAULT 0,
  minimum_order_cents integer DEFAULT 0,
  street text,
  number text,
  district text,
  city text,
  state text,
  zip_code text,
  complement text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. FUNCTIONS & TRIGGERS

-- Updated At
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER trg_store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auth Signup Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::public.app_role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Is Admin Helper
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

-- 5. RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User Roles Policies
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Categories Policies
DROP POLICY IF EXISTS "Public categories read" ON public.categories;
CREATE POLICY "Public categories read" ON public.categories FOR SELECT USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin categories all" ON public.categories;
CREATE POLICY "Admin categories all" ON public.categories USING (public.is_admin());

-- Products Policies
DROP POLICY IF EXISTS "Public products read" ON public.products;
CREATE POLICY "Public products read" ON public.products FOR SELECT USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin products all" ON public.products;
CREATE POLICY "Admin products all" ON public.products USING (public.is_admin());

-- Store Settings Policies
DROP POLICY IF EXISTS "Public store settings read" ON public.store_settings;
CREATE POLICY "Public store settings read" ON public.store_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin store settings update" ON public.store_settings;
CREATE POLICY "Admin store settings update" ON public.store_settings FOR UPDATE USING (public.is_admin());

-- Orders Policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order Items Policies
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid()) OR public.is_admin()
);

DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 7. SEED DATA

INSERT INTO public.store_settings (id, store_name, whatsapp_number, phone, logo_path, pix_enabled, cash_enabled, credit_card_enabled, debit_card_enabled, delivery_enabled, pickup_enabled, delivery_fee_cents, minimum_order_cents, street, number, district, city, state, zip_code)
VALUES (1, 'Pagmenos', '558899981853', null, null, true, true, true, true, true, true, 500, 2000, 'Rua Agronomando Rangel', '475', 'Centro', 'Canindé', 'CE', '62700-000')
ON CONFLICT (id) DO NOTHING;

-- Categories
INSERT INTO public.categories (id, name, slug, icon_key, display_order, active) VALUES (gen_random_uuid(), 'Analg├®sicos e Antit├®rmicos', 'analgesicos-e-antitermicos', 'pill', 1, true) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon_key = EXCLUDED.icon_key, display_order = EXCLUDED.display_order, active = EXCLUDED.active;
INSERT INTO public.categories (id, name, slug, icon_key, display_order, active) VALUES (gen_random_uuid(), 'Anti-inflamat├│rios', 'anti-inflamatorios', 'tablets', 2, true) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon_key = EXCLUDED.icon_key, display_order = EXCLUDED.display_order, active = EXCLUDED.active;
INSERT INTO public.categories (id, name, slug, icon_key, display_order, active) VALUES (gen_random_uuid(), 'Antial├®rgicos', 'antialergicos', 'shield', 3, true) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon_key = EXCLUDED.icon_key, display_order = EXCLUDED.display_order, active = EXCLUDED.active;
INSERT INTO public.categories (id, name, slug, icon_key, display_order, active) VALUES (gen_random_uuid(), 'Gripe e Resfriado', 'gripe-e-resfriado', 'thermometer', 4, true) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon_key = EXCLUDED.icon_key, display_order = EXCLUDED.display_order, active = EXCLUDED.active;
INSERT INTO public.categories (id, name, slug, icon_key, display_order, active) VALUES (gen_random_uuid(), 'Digest├úo e Est├┤mago', 'digestao-e-estomago', 'activity', 5, true) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon_key = EXCLUDED.icon_key, display_order = EXCLUDED.display_order, active = EXCLUDED.active;
INSERT INTO public.categories (id, name, slug, icon_key, display_order, active) VALUES (gen_random_uuid(), 'Vitaminas e Suplementos', 'vitaminas-e-suplementos', 'apple', 6, true) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon_key = EXCLUDED.icon_key, display_order = EXCLUDED.display_order, active = EXCLUDED.active;
INSERT INTO public.categories (id, name, slug, icon_key, display_order, active) VALUES (gen_random_uuid(), 'Higiene Pessoal', 'higiene-pessoal', 'shower-head', 7, true) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon_key = EXCLUDED.icon_key, display_order = EXCLUDED.display_order, active = EXCLUDED.active;
INSERT INTO public.categories (id, name, slug, icon_key, display_order, active) VALUES (gen_random_uuid(), 'Sa├║de Bucal', 'saude-bucal', 'smile', 8, true) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon_key = EXCLUDED.icon_key, display_order = EXCLUDED.display_order, active = EXCLUDED.active;
INSERT INTO public.categories (id, name, slug, icon_key, display_order, active) VALUES (gen_random_uuid(), 'Infantil', 'infantil', 'baby', 9, true) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon_key = EXCLUDED.icon_key, display_order = EXCLUDED.display_order, active = EXCLUDED.active;
INSERT INTO public.categories (id, name, slug, icon_key, display_order, active) VALUES (gen_random_uuid(), 'Primeiros Socorros', 'primeiros-socorros', 'briefcase-medical', 10, true) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon_key = EXCLUDED.icon_key, display_order = EXCLUDED.display_order, active = EXCLUDED.active;
INSERT INTO public.categories (id, name, slug, icon_key, display_order, active) VALUES (gen_random_uuid(), 'Cuidados com a Pele', 'cuidados-com-a-pele', 'sparkles', 11, true) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon_key = EXCLUDED.icon_key, display_order = EXCLUDED.display_order, active = EXCLUDED.active;

-- Products
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'analgesicos-e-antitermicos'), 'Dipirona 500mg', 'dipirona-500mg', NULL, NULL, 990, NULL, NULL, NULL, true, true, true, '/demo-products/dipirona-500mg.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'analgesicos-e-antitermicos'), 'Dipirona Gotas', 'dipirona-gotas', NULL, NULL, 1190, NULL, NULL, NULL, true, false, true, '/demo-products/dipirona-gotas.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'analgesicos-e-antitermicos'), 'Paracetamol 750mg', 'paracetamol-750mg', NULL, NULL, 1090, NULL, NULL, NULL, true, false, true, '/demo-products/paracetamol.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'analgesicos-e-antitermicos'), 'Paracetamol Gotas', 'paracetamol-gotas', NULL, NULL, 1290, NULL, NULL, NULL, true, false, true, '/demo-products/paracetamol-gotas.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'anti-inflamatorios'), 'Ibuprofeno 400mg', 'ibuprofeno-400mg', NULL, NULL, 1390, NULL, NULL, NULL, false, false, true, '/demo-products/ibuprofeno.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'anti-inflamatorios'), 'Ibuprofeno Gotas', 'ibuprofeno-gotas', NULL, NULL, 1590, NULL, NULL, NULL, true, false, true, '/demo-products/ibuprofeno-gotas.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'anti-inflamatorios'), 'Naproxeno S├│dico', 'naproxeno-sodico', NULL, NULL, 1890, NULL, NULL, NULL, true, false, true, '/demo-products/naproxeno.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'antialergicos'), 'Loratadina 10mg', 'loratadina-10mg', NULL, NULL, 1290, NULL, NULL, NULL, true, true, true, '/demo-products/loratadina.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'antialergicos'), 'Loratadina Xarope', 'loratadina-xarope', NULL, NULL, 1690, NULL, NULL, NULL, true, false, true, '/demo-products/loratadina-xarope.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'antialergicos'), 'Antial├®rgico 10 comprimidos', 'antialergico-10-comprimidos', NULL, NULL, 1190, NULL, NULL, NULL, true, false, true, '/demo-products/antialergico.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'gripe-e-resfriado'), 'Soro Fisiol├│gico 0,9%', 'soro-fisiologico-09', NULL, NULL, 690, 499, '2026-08-17T23:43:33.472Z', NULL, true, true, true, '/demo-products/soro-fisiologico.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'gripe-e-resfriado'), 'Pastilhas para Garganta', 'pastilhas-para-garganta', NULL, NULL, 990, NULL, NULL, NULL, true, false, true, '/demo-products/pastilhas.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'gripe-e-resfriado'), 'Descongestionante Nasal', 'descongestionante-nasal', NULL, NULL, 1490, NULL, NULL, NULL, true, false, true, '/demo-products/descongestionante.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'gripe-e-resfriado'), 'Xarope para Tosse', 'xarope-para-tosse', NULL, NULL, 1890, NULL, NULL, NULL, true, false, true, '/demo-products/xarope-tosse.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'digestao-e-estomago'), 'Simeticona', 'simeticona', NULL, NULL, 1190, NULL, NULL, NULL, true, false, true, '/demo-products/simeticona.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'digestao-e-estomago'), 'Sal de Frutas', 'sal-de-frutas', NULL, NULL, 790, NULL, NULL, NULL, true, false, true, '/demo-products/sal-frutas.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'digestao-e-estomago'), 'Anti├ícido', 'antiacido', NULL, NULL, 990, NULL, NULL, NULL, true, false, true, '/demo-products/antiacido.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'vitaminas-e-suplementos'), 'Vitamina C 1g', 'vitamina-c-1g', NULL, NULL, 1890, 1490, '2026-08-17T23:43:33.472Z', NULL, true, true, true, '/demo-products/vitamina-c.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'vitaminas-e-suplementos'), 'Complexo B', 'complexo-b', NULL, NULL, 1990, NULL, NULL, NULL, true, false, true, '/demo-products/complexo-b.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'vitaminas-e-suplementos'), 'Multivitam├¡nico', 'multivitaminico', NULL, NULL, 3290, NULL, NULL, NULL, true, false, true, '/demo-products/multivitaminico.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'higiene-pessoal'), 'Sabonete L├¡quido', 'sabonete-liquido', NULL, NULL, 1290, 990, '2026-08-17T23:43:33.472Z', NULL, true, false, true, '/demo-products/sabonete-liquido.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'higiene-pessoal'), 'Desodorante', 'desodorante', NULL, NULL, 1490, NULL, NULL, NULL, true, false, true, '/demo-products/desodorante.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'higiene-pessoal'), 'Shampoo', 'shampoo', NULL, NULL, 1890, NULL, NULL, NULL, true, false, true, '/demo-products/shampoo.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'higiene-pessoal'), '├ülcool 70%', 'alcool-70', NULL, NULL, 890, NULL, NULL, NULL, true, false, true, '/demo-products/alcool-70.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'higiene-pessoal'), 'Algod├úo', 'algodao', NULL, NULL, 790, NULL, NULL, NULL, true, false, true, '/demo-products/algodao.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'saude-bucal'), 'Creme Dental', 'creme-dental', NULL, NULL, 790, NULL, NULL, NULL, true, false, true, '/demo-products/creme-dental.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'saude-bucal'), 'Escova Dental', 'escova-dental', NULL, NULL, 890, NULL, NULL, NULL, true, false, true, '/demo-products/escova-dental.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'saude-bucal'), 'Enxaguante Bucal', 'enxaguante-bucal', NULL, NULL, 1790, NULL, NULL, NULL, true, false, true, '/demo-products/enxaguante-bucal.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'infantil'), 'Len├ºo Umedecido', 'lenco-umedecido', NULL, NULL, 1390, NULL, NULL, NULL, true, true, true, '/demo-products/lenco-umedecido.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'infantil'), 'Sabonete Infantil', 'sabonete-infantil', NULL, NULL, 1090, NULL, NULL, NULL, true, false, true, '/demo-products/sabonete-infantil.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'infantil'), 'Shampoo Infantil', 'shampoo-infantil', NULL, NULL, 1690, NULL, NULL, NULL, false, false, true, '/demo-products/shampoo-infantil.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'primeiros-socorros'), 'Curativos Adesivos', 'curativos-adesivos', NULL, NULL, 790, NULL, NULL, NULL, true, true, true, '/demo-products/curativos-adesivos.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'primeiros-socorros'), 'Gaze Est├®ril', 'gaze-esteril', NULL, NULL, 590, NULL, NULL, NULL, true, false, true, '/demo-products/gaze.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'primeiros-socorros'), 'Esparadrapo', 'esparadrapo', NULL, NULL, 890, NULL, NULL, NULL, true, false, true, '/demo-products/esparadrapo.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'primeiros-socorros'), '├ügua Oxigenada', 'agua-oxigenada', NULL, NULL, 690, NULL, NULL, NULL, true, false, true, '/demo-products/agua-oxigenada.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'cuidados-com-a-pele'), 'Protetor Solar FPS 50', 'protetor-solar-fps-50', NULL, NULL, 3990, NULL, NULL, NULL, true, false, true, '/demo-products/protetor-solar.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'cuidados-com-a-pele'), 'Hidratante Corporal', 'hidratante-corporal', NULL, NULL, 2490, 1990, '2026-08-17T23:43:33.472Z', NULL, true, false, true, '/demo-products/hidratante.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;
INSERT INTO public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url) VALUES (gen_random_uuid(), (SELECT id FROM public.categories WHERE slug = 'cuidados-com-a-pele'), 'Creme para as M├úos', 'creme-para-as-maos', NULL, NULL, 1490, NULL, NULL, NULL, true, false, true, '/demo-products/creme-maos.png') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;

-- 8. STORAGE BUCKET POLICIES
-- NOTE: The bucket 'product-images' must be manually created and set to PUBLIC in the Supabase Dashboard.

INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
CREATE POLICY "Admin Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
CREATE POLICY "Admin Update Access" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;
CREATE POLICY "Admin Delete Access" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND public.is_admin());

-- 9. ADMIN ROLE PROMOTION
DO $$
DECLARE
  v_admin_email text := 'Pagmenos@admin.com';
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(v_admin_email);
  
  IF v_user_id IS NOT NULL THEN
    -- Ensure profile exists
    INSERT INTO public.profiles (id, full_name) VALUES (v_user_id, 'Admin') ON CONFLICT (id) DO NOTHING;
    
    -- Promote to admin
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin'::public.app_role) ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::public.app_role;
    
    RAISE NOTICE 'User % promoted to admin successfully.', v_admin_email;
  ELSE
    RAISE NOTICE 'Admin user % was not found. Create the Auth user and rerun this block to assign admin role.', v_admin_email;
  END IF;
END
$$;

-- 10. VERIFICATION
SELECT count(*) as category_count FROM public.categories;
SELECT count(*) as product_count FROM public.products;
SELECT u.email, r.role FROM auth.users u LEFT JOIN public.user_roles r ON r.user_id = u.id WHERE lower(u.email) = lower('Pagmenos@admin.com');
