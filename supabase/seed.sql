-- ============================================================================
-- Pagmenos — Seed Data (Development / Demo)
-- ============================================================================

-- Store Settings
INSERT INTO store_settings (store_name, whatsapp_number, phone, street, number, district, city, state, zip_code)
VALUES ('Pagmenos', '558899981853', '(88) 9998-1853', 'Rua Agronomando Rangel', '475', 'Centro', 'Canindé', 'CE', '62700-000');

-- Categories
INSERT INTO categories (name, slug, icon_key, display_order) VALUES
  ('Dor e Febre', 'dor-e-febre', 'thermometer', 1),
  ('Gripes e Resfriados', 'gripes-e-resfriados', 'wind', 2),
  ('Vitaminas', 'vitaminas', 'apple', 3),
  ('Higiene', 'higiene', 'droplets', 4),
  ('Bebê e Infantil', 'bebe-e-infantil', 'baby', 5),
  ('Beleza', 'beleza', 'sparkles', 6),
  ('Primeiros Socorros', 'primeiros-socorros', 'cross', 7),
  ('Bem-estar', 'bem-estar', 'heart-pulse', 8);

-- Products (demo catalog)
INSERT INTO products (name, slug, category_id, brand, active_ingredient, presentation, dosage, manufacturer, sale_type, base_price_cents, stock_status, featured) VALUES
  ('Dipirona Sódica 500mg', 'dipirona-sodica-500mg', (SELECT id FROM categories WHERE slug='dor-e-febre'), 'Medley', 'Dipirona Sódica', 'Caixa com 10 comprimidos', '500mg', 'Medley', 'otc', 590, 'in_stock', true),
  ('Paracetamol 750mg', 'paracetamol-750mg', (SELECT id FROM categories WHERE slug='dor-e-febre'), 'EMS', 'Paracetamol', 'Caixa com 20 comprimidos', '750mg', 'EMS', 'otc', 890, 'in_stock', true),
  ('Ibuprofeno 400mg', 'ibuprofeno-400mg', (SELECT id FROM categories WHERE slug='dor-e-febre'), 'Neo Química', 'Ibuprofeno', 'Caixa com 10 cápsulas', '400mg', 'Neo Química', 'otc', 1290, 'in_stock', false),
  ('Dorflex', 'dorflex', (SELECT id FROM categories WHERE slug='dor-e-febre'), 'Sanofi', 'Dipirona + Orfenadrina + Cafeína', 'Caixa com 10 comprimidos', NULL, 'Sanofi', 'otc', 990, 'in_stock', true),
  ('Benegrip Multi', 'benegrip-multi', (SELECT id FROM categories WHERE slug='gripes-e-resfriados'), 'Neo Química', 'Paracetamol + Fenilefrina + Clorfeniramina', 'Caixa com 20 comprimidos', NULL, 'Neo Química', 'otc', 1690, 'in_stock', true),
  ('Coristina D', 'coristina-d', (SELECT id FROM categories WHERE slug='gripes-e-resfriados'), 'MSD', 'Ácido Acetilsalicílico + Dexclorfeniramina + Fenilefrina', 'Caixa com 16 comprimidos', NULL, 'MSD', 'otc', 1490, 'in_stock', false),
  ('Resfenol', 'resfenol', (SELECT id FROM categories WHERE slug='gripes-e-resfriados'), 'Kley Hertz', 'Paracetamol + Clorfeniramina + Fenilefrina', 'Caixa com 20 cápsulas', NULL, 'Kley Hertz', 'otc', 1590, 'in_stock', false),
  ('Vitamina C 1g', 'vitamina-c-1g', (SELECT id FROM categories WHERE slug='vitaminas'), 'Cimed', 'Ácido Ascórbico', 'Tubo com 10 comprimidos efervescentes', '1g', 'Cimed', 'non_medicine', 990, 'in_stock', true),
  ('Vitamina D 2000UI', 'vitamina-d-2000ui', (SELECT id FROM categories WHERE slug='vitaminas'), 'Aché', 'Colecalciferol', 'Frasco com 30 cápsulas', '2000UI', 'Aché', 'non_medicine', 2490, 'in_stock', false),
  ('Complexo B', 'complexo-b', (SELECT id FROM categories WHERE slug='vitaminas'), 'Bayer', NULL, 'Frasco com 30 drágeas', NULL, 'Bayer', 'non_medicine', 1890, 'in_stock', false),
  ('Centrum Homem', 'centrum-homem', (SELECT id FROM categories WHERE slug='vitaminas'), 'GSK', NULL, 'Frasco com 30 comprimidos', NULL, 'GSK', 'non_medicine', 4990, 'in_stock', true),
  ('Soro Fisiológico 500ml', 'soro-fisiologico-500ml', (SELECT id FROM categories WHERE slug='primeiros-socorros'), 'Eurofarma', 'Cloreto de Sódio', 'Frasco 500ml', '0.9%', 'Eurofarma', 'non_medicine', 790, 'in_stock', false),
  ('Álcool em Gel 500ml', 'alcool-em-gel-500ml', (SELECT id FROM categories WHERE slug='higiene'), 'Rexona', NULL, 'Frasco 500ml', '70%', 'Rexona', 'non_medicine', 1490, 'in_stock', false),
  ('Sabonete Líquido Protex', 'sabonete-liquido-protex', (SELECT id FROM categories WHERE slug='higiene'), 'Protex', NULL, 'Frasco 250ml', NULL, 'Colgate-Palmolive', 'non_medicine', 1690, 'in_stock', false),
  ('Fralda Pampers M 34un', 'fralda-pampers-m-34un', (SELECT id FROM categories WHERE slug='bebe-e-infantil'), 'Pampers', NULL, 'Pacote com 34 unidades', 'M', 'P&G', 'non_medicine', 3990, 'in_stock', false),
  ('Protetor Solar FPS 50', 'protetor-solar-fps-50', (SELECT id FROM categories WHERE slug='beleza'), 'La Roche-Posay', NULL, 'Bisnaga 120ml', 'FPS 50', 'La Roche-Posay', 'non_medicine', 5990, 'in_stock', true),
  ('Band-Aid 40 unidades', 'band-aid-40-unidades', (SELECT id FROM categories WHERE slug='primeiros-socorros'), 'Johnson & Johnson', NULL, 'Caixa com 40 unidades', NULL, 'J&J', 'non_medicine', 1290, 'in_stock', false),
  ('Buscopan Composto', 'buscopan-composto', (SELECT id FROM categories WHERE slug='dor-e-febre'), 'Boehringer', 'Escopolamina + Dipirona', 'Caixa com 20 comprimidos', NULL, 'Boehringer', 'otc', 1890, 'in_stock', false),
  ('Loratadina 10mg', 'loratadina-10mg', (SELECT id FROM categories WHERE slug='gripes-e-resfriados'), 'EMS', 'Loratadina', 'Caixa com 12 comprimidos', '10mg', 'EMS', 'otc', 1290, 'in_stock', false),
  ('Melatonina 5mg', 'melatonina-5mg', (SELECT id FROM categories WHERE slug='bem-estar'), 'Vitaminlife', 'Melatonina', 'Frasco com 60 cápsulas', '5mg', 'Vitaminlife', 'non_medicine', 3490, 'in_stock', true);

-- Promotions
INSERT INTO promotions (name, promotion_type, fixed_price_cents, starts_at, ends_at, active) VALUES
  ('Dipirona em Oferta', 'fixed_price', 390, now(), now() + interval '30 days', true),
  ('Vitamina C Promo', 'fixed_price', 690, now(), now() + interval '15 days', true);

INSERT INTO promotion_products (promotion_id, product_id)
SELECT p.id, pr.id FROM promotions p, products pr
WHERE p.name = 'Dipirona em Oferta' AND pr.slug = 'dipirona-sodica-500mg';

INSERT INTO promotion_products (promotion_id, product_id)
SELECT p.id, pr.id FROM promotions p, products pr
WHERE p.name = 'Vitamina C Promo' AND pr.slug = 'vitamina-c-1g';

-- Banners
INSERT INTO banners (title, subtitle, link_type, display_order, active) VALUES
  ('Ofertas de Inverno 🧣', 'Cuide da saúde da sua família com os melhores preços da região.', 'search', 1, true);
