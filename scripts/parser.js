import fs from 'fs';

const content = fs.readFileSync('packages/utils/src/mockDatabase.ts', 'utf8');

const tsScript = `
  import fs from 'fs';
  const pBase = { description: null, brand: null, active_ingredient: null, presentation: null, dosage: null, manufacturer: null, anvisa_registration: null, sale_type: 'otc' as const, requires_prescription: false, track_inventory: false, stock_quantity: 0, stock_status: 'in_stock' as const, featured: false, active: true, created_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  
  ${content.substring(content.indexOf('const defaultCategories'), content.indexOf('const defaultSettings'))}
  
  const catSql = defaultCategories.map(c => 
    \`insert into public.categories (id, name, slug, icon_key, display_order, active, created_at, updated_at) values (gen_random_uuid(), '\${c.name.replace(/'/g, "''")}', '\${c.slug}', '\${c.icon_key}', \${c.display_order}, \${c.active}, now(), now()) on conflict (slug) do update set name = EXCLUDED.name, icon_key = EXCLUDED.icon_key, display_order = EXCLUDED.display_order, active = EXCLUDED.active;\`
  ).join('\\n');
  
  const prodSql = defaultProducts.map(p => {
    const promoLink = defaultPromotionProducts.find(x => x.product_id === p.id);
    let promo = null;
    if (promoLink) {
      promo = defaultPromotions.find(x => x.id === promoLink.promotion_id && x.active);
    }
    
    let promoPrice = 'NULL';
    let promoStart = 'NULL';
    let promoEnd = 'NULL';
    
    if (promo && promo.fixed_price_cents) {
       promoPrice = promo.fixed_price_cents;
       promoStart = promo.starts_at ? \`'\${promo.starts_at}'\` : 'NULL';
       promoEnd = promo.ends_at ? \`'\${promo.ends_at}'\` : 'NULL';
    }
    
    const cat = defaultCategories.find(c => c.id === p.category_id);
    const catSlug = cat ? cat.slug : '';
    
    return \`insert into public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url, created_at, updated_at) values (gen_random_uuid(), (select id from public.categories where slug = '\${catSlug}'), '\${p.name.replace(/'/g, "''")}', '\${p.slug}', \${p.description ? "'" + p.description.replace(/'/g, "''") + "'" : 'NULL'}, \${p.brand ? "'" + p.brand.replace(/'/g, "''") + "'" : 'NULL'}, \${p.base_price_cents}, \${promoPrice}, \${promoStart}, \${promoEnd}, \${p.stock_status === 'in_stock'}, \${p.featured}, \${p.active}, \${p.image_url ? "'" + p.image_url + "'" : 'NULL'}, now(), now()) on conflict (slug) do update set name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;\`;
  }).join('\\n');
  
  fs.writeFileSync('seed_output.txt', catSql + '\\n\\n' + prodSql);
`;

fs.writeFileSync('temp_parser.ts', tsScript);
