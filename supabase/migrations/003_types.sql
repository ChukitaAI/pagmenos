-- ============================================================================
-- Pagmenos — Migration 003: Custom Types (Enums)
-- ============================================================================

-- Admin roles (customer role exists only conceptually — no customer auth in MVP)
CREATE TYPE app_role AS ENUM ('staff', 'manager', 'owner');

-- Product sale classification
CREATE TYPE sale_type AS ENUM ('non_medicine', 'otc', 'prescription', 'controlled');

-- Stock status
CREATE TYPE stock_status AS ENUM ('in_stock', 'out_of_stock');

-- Payment methods (informational — used in WhatsApp message only)
CREATE TYPE payment_method AS ENUM ('pix', 'cash', 'credit_card', 'debit_card');

-- Promotion types
CREATE TYPE promotion_type AS ENUM ('fixed_price', 'percentage', 'fixed_discount');

-- Banner link types
CREATE TYPE banner_link_type AS ENUM ('category', 'product', 'search', 'external', 'none');
