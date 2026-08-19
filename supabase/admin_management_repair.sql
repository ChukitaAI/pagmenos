-- ==============================================================================
-- FILE: supabase/admin_management_repair.sql
-- DESCRIPTION: Surgically fixes Portuguese encoding (mojibake) in the catalog.
-- TARGET: public.products, public.categories
-- ==============================================================================
--
-- INSTRUCTIONS:
-- Run this file in your Supabase SQL Editor.
-- It is safe to rerun. It uses slugs to identify rows to prevent accidental changes.
--
-- ==============================================================================

-- 1. Fix Categories
UPDATE public.categories
SET name = 'Analgésicos e Antitérmicos'
WHERE slug = 'analgesicos-e-antitermicos' AND name LIKE '%Analg├®sicos%';

UPDATE public.categories
SET name = 'Anti-inflamatórios'
WHERE slug = 'anti-inflamatorios' AND name LIKE '%Anti-inflamat├│rios%';

UPDATE public.categories
SET name = 'Antialérgicos'
WHERE slug = 'antialergicos' AND name LIKE '%Antial├®rgicos%';

UPDATE public.categories
SET name = 'Digestão e Estômago'
WHERE slug = 'digestao-e-estomago' AND name LIKE '%Digest├úo e Est├┤mago%';

UPDATE public.categories
SET name = 'Saúde Bucal'
WHERE slug = 'saude-bucal' AND name LIKE '%Sa├║de Bucal%';

-- 2. Fix Products
UPDATE public.products
SET name = 'Sabonete Líquido'
WHERE slug = 'sabonete-liquido' AND name LIKE '%Sabonete L├¡quido%';

UPDATE public.products
SET name = 'Lenço Umedecido'
WHERE slug = 'lenco-umedecido' AND name LIKE '%Len├ºo Umedecido%';

UPDATE public.products
SET name = 'Soro Fisiológico 0,9%'
WHERE slug = 'soro-fisiologico-09' AND name LIKE '%Soro Fisiol├│gico%';

UPDATE public.products
SET name = 'Água Oxigenada'
WHERE slug = 'agua-oxigenada' AND name LIKE '%├ügua Oxigenada%';

UPDATE public.products
SET name = 'Álcool 70%'
WHERE slug = 'alcool-70' AND name LIKE '%├ülcool 70%%';

UPDATE public.products
SET name = 'Algodão'
WHERE slug = 'algodao' AND name LIKE '%Algod├úo%';

UPDATE public.products
SET name = 'Antiácido'
WHERE slug = 'antiacido' AND name LIKE '%Anti├ícido%';

UPDATE public.products
SET name = 'Creme para as Mãos'
WHERE slug = 'creme-para-as-maos' AND name LIKE '%Creme para as M├úos%';

UPDATE public.products
SET name = 'Multivitamínico'
WHERE slug = 'multivitaminico' AND name LIKE '%Multivitam├¡nico%';

UPDATE public.products
SET name = 'Gaze Estéril'
WHERE slug = 'gaze-esteril' AND name LIKE '%Gaze Est├®ril%';
