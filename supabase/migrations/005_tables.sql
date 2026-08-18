-- ============================================================================
-- Pagmenos — Migration 005: Tables
-- ============================================================================
-- Only catalog, admin, and config tables. No orders, no customer data.

-- Admin roles
CREATE TABLE user_roles (
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

-- Categories
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon_key text,
  image_path text,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  brand text,
  active_ingredient text,
  presentation text,
  dosage text,
  manufacturer text,
  anvisa_registration text,
  sale_type sale_type NOT NULL DEFAULT 'non_medicine',
  requires_prescription boolean NOT NULL DEFAULT false,
  base_price_cents integer NOT NULL CHECK (base_price_cents >= 0),
  track_inventory boolean NOT NULL DEFAULT false,
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  stock_status stock_status NOT NULL DEFAULT 'in_stock',
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Product images (MVP: one primary per product)
CREATE TABLE product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  alt_text text,
  display_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Promotions
CREATE TABLE promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  promotion_type promotion_type NOT NULL,
  fixed_price_cents integer CHECK (fixed_price_cents > 0),
  percentage_off integer CHECK (percentage_off > 0 AND percentage_off <= 100),
  fixed_discount_cents integer CHECK (fixed_discount_cents > 0),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promotion_type_fields CHECK (
    (promotion_type = 'fixed_price' AND fixed_price_cents IS NOT NULL) OR
    (promotion_type = 'percentage' AND percentage_off IS NOT NULL) OR
    (promotion_type = 'fixed_discount' AND fixed_discount_cents IS NOT NULL)
  ),
  CONSTRAINT promotion_dates CHECK (ends_at IS NULL OR ends_at > starts_at)
);

-- Promotion ↔ Product junction
CREATE TABLE promotion_products (
  promotion_id uuid NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (promotion_id, product_id)
);

-- Store settings (singleton)
CREATE TABLE store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL DEFAULT 'Pagmenos',
  whatsapp_number text NOT NULL,
  phone text,
  street text,
  number text,
  district text,
  city text,
  state text,
  zip_code text,
  complement text,
  logo_path text,
  pix_enabled boolean NOT NULL DEFAULT true,
  cash_enabled boolean NOT NULL DEFAULT true,
  credit_card_enabled boolean NOT NULL DEFAULT true,
  debit_card_enabled boolean NOT NULL DEFAULT true,
  delivery_enabled boolean NOT NULL DEFAULT true,
  pickup_enabled boolean NOT NULL DEFAULT true,
  delivery_fee_cents integer NOT NULL DEFAULT 0 CHECK (delivery_fee_cents >= 0),
  minimum_order_cents integer NOT NULL DEFAULT 0 CHECK (minimum_order_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX store_settings_singleton ON store_settings ((true));

-- Banners
CREATE TABLE banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  subtitle text,
  image_path text,
  link_type banner_link_type NOT NULL DEFAULT 'none',
  link_value text,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT banner_dates CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

-- Admin audit logs (append-only)
CREATE TABLE admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES auth.users,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
