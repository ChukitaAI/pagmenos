
  const { v4: uuidv4 } = require('crypto');
  
  // Fake types
  const pBase = { description: null, brand: null, active_ingredient: null, presentation: null, dosage: null, manufacturer: null, anvisa_registration: null, sale_type: 'otc', requires_prescription: false, track_inventory: false, stock_quantity: 0, stock_status: 'in_stock', featured: false, active: true, created_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  
  const defaultCategories: Category[] = [
  { id: 'c1', name: 'Analgésicos e Antitérmicos', slug: 'analgesicos-e-antitermicos', icon_key: 'pill', description: null, image_path: null, display_order: 1, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c2', name: 'Anti-inflamatórios', slug: 'anti-inflamatorios', icon_key: 'tablets', description: null, image_path: null, display_order: 2, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c3', name: 'Antialérgicos', slug: 'antialergicos', icon_key: 'shield', description: null, image_path: null, display_order: 3, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c4', name: 'Gripe e Resfriado', slug: 'gripe-e-resfriado', icon_key: 'thermometer', description: null, image_path: null, display_order: 4, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c5', name: 'Digestão e Estômago', slug: 'digestao-e-estomago', icon_key: 'activity', description: null, image_path: null, display_order: 5, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c6', name: 'Vitaminas e Suplementos', slug: 'vitaminas-e-suplementos', icon_key: 'apple', description: null, image_path: null, display_order: 6, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c7', name: 'Higiene Pessoal', slug: 'higiene-pessoal', icon_key: 'shower-head', description: null, image_path: null, display_order: 7, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c8', name: 'Saúde Bucal', slug: 'saude-bucal', icon_key: 'smile', description: null, image_path: null, display_order: 8, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c9', name: 'Infantil', slug: 'infantil', icon_key: 'baby', description: null, image_path: null, display_order: 9, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c10', name: 'Primeiros Socorros', slug: 'primeiros-socorros', icon_key: 'briefcase-medical', description: null, image_path: null, display_order: 10, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c11', name: 'Cuidados com a Pele', slug: 'cuidados-com-a-pele', icon_key: 'sparkles', description: null, image_path: null, display_order: 11, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const pBase = { description: null, brand: null, active_ingredient: null, presentation: null, dosage: null, manufacturer: null, anvisa_registration: null, sale_type: 'otc' as const, requires_prescription: false, track_inventory: false, stock_quantity: 0, stock_status: 'in_stock' as const, featured: false, active: true, created_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

const defaultProducts: Product[] = [
  // Analgésicos e Antitérmicos
  { ...pBase, id: 'p1', category_id: 'c1', name: 'Dipirona 500mg', slug: 'dipirona-500mg', base_price_cents: 990, featured: true, image_url: '/demo-products/dipirona-500mg.png' },
  { ...pBase, id: 'p2', category_id: 'c1', name: 'Dipirona Gotas', slug: 'dipirona-gotas', base_price_cents: 1190, image_url: '/demo-products/dipirona-gotas.png' },
  { ...pBase, id: 'p3', category_id: 'c1', name: 'Paracetamol 750mg', slug: 'paracetamol-750mg', base_price_cents: 1090, image_url: '/demo-products/paracetamol.png' },
  { ...pBase, id: 'p4', category_id: 'c1', name: 'Paracetamol Gotas', slug: 'paracetamol-gotas', base_price_cents: 1290, image_url: '/demo-products/paracetamol-gotas.png' },
  // Anti-inflamatórios
  { ...pBase, id: 'p5', category_id: 'c2', name: 'Ibuprofeno 400mg', slug: 'ibuprofeno-400mg', base_price_cents: 1390, stock_status: 'out_of_stock', image_url: '/demo-products/ibuprofeno.png' },
  { ...pBase, id: 'p6', category_id: 'c2', name: 'Ibuprofeno Gotas', slug: 'ibuprofeno-gotas', base_price_cents: 1590, image_url: '/demo-products/ibuprofeno-gotas.png' },
  { ...pBase, id: 'p7', category_id: 'c2', name: 'Naproxeno Sódico', slug: 'naproxeno-sodico', base_price_cents: 1890, image_url: '/demo-products/naproxeno.png' },
  // Antialérgicos
  { ...pBase, id: 'p8', category_id: 'c3', name: 'Loratadina 10mg', slug: 'loratadina-10mg', base_price_cents: 1290, featured: true, image_url: '/demo-products/loratadina.png' },
  { ...pBase, id: 'p9', category_id: 'c3', name: 'Loratadina Xarope', slug: 'loratadina-xarope', base_price_cents: 1690, image_url: '/demo-products/loratadina-xarope.png' },
  { ...pBase, id: 'p10', category_id: 'c3', name: 'Antialérgico 10 comprimidos', slug: 'antialergico-10-comprimidos', base_price_cents: 1190, image_url: '/demo-products/antialergico.png' },
  // Gripe e Resfriado
  { ...pBase, id: 'p11', category_id: 'c4', name: 'Soro Fisiológico 0,9%', slug: 'soro-fisiologico-09', base_price_cents: 690, featured: true, image_url: '/demo-products/soro-fisiologico.png' },
  { ...pBase, id: 'p12', category_id: 'c4', name: 'Pastilhas para Garganta', slug: 'pastilhas-para-garganta', base_price_cents: 990, image_url: '/demo-products/pastilhas.png' },
  { ...pBase, id: 'p13', category_id: 'c4', name: 'Descongestionante Nasal', slug: 'descongestionante-nasal', base_price_cents: 1490, image_url: '/demo-products/descongestionante.png' },
  { ...pBase, id: 'p14', category_id: 'c4', name: 'Xarope para Tosse', slug: 'xarope-para-tosse', base_price_cents: 1890, image_url: '/demo-products/xarope-tosse.png' },
  // Digestão e Estômago
  { ...pBase, id: 'p15', category_id: 'c5', name: 'Simeticona', slug: 'simeticona', base_price_cents: 1190, image_url: '/demo-products/simeticona.png' },
  { ...pBase, id: 'p16', category_id: 'c5', name: 'Sal de Frutas', slug: 'sal-de-frutas', base_price_cents: 790, image_url: '/demo-products/sal-frutas.png' },
  { ...pBase, id: 'p17', category_id: 'c5', name: 'Antiácido', slug: 'antiacido', base_price_cents: 990, image_url: '/demo-products/antiacido.png' },
  // Vitaminas e Suplementos
  { ...pBase, id: 'p18', category_id: 'c6', name: 'Vitamina C 1g', slug: 'vitamina-c-1g', base_price_cents: 1890, featured: true, image_url: '/demo-products/vitamina-c.png' },
  { ...pBase, id: 'p19', category_id: 'c6', name: 'Complexo B', slug: 'complexo-b', base_price_cents: 1990, image_url: '/demo-products/complexo-b.png' },
  { ...pBase, id: 'p20', category_id: 'c6', name: 'Multivitamínico', slug: 'multivitaminico', base_price_cents: 3290, image_url: '/demo-products/multivitaminico.png' },
  // Higiene Pessoal
  { ...pBase, id: 'p21', category_id: 'c7', name: 'Sabonete Líquido', slug: 'sabonete-liquido', base_price_cents: 1290, image_url: '/demo-products/sabonete-liquido.png' },
  { ...pBase, id: 'p22', category_id: 'c7', name: 'Desodorante', slug: 'desodorante', base_price_cents: 1490, image_url: '/demo-products/desodorante.png' },
  { ...pBase, id: 'p23', category_id: 'c7', name: 'Shampoo', slug: 'shampoo', base_price_cents: 1890, image_url: '/demo-products/shampoo.png' },
  { ...pBase, id: 'p24', category_id: 'c7', name: 'Álcool 70%', slug: 'alcool-70', base_price_cents: 890, image_url: '/demo-products/alcool-70.png' },
  { ...pBase, id: 'p25', category_id: 'c7', name: 'Algodão', slug: 'algodao', base_price_cents: 790, image_url: '/demo-products/algodao.png' },
  // Saúde Bucal
  { ...pBase, id: 'p26', category_id: 'c8', name: 'Creme Dental', slug: 'creme-dental', base_price_cents: 790, image_url: '/demo-products/creme-dental.png' },
  { ...pBase, id: 'p27', category_id: 'c8', name: 'Escova Dental', slug: 'escova-dental', base_price_cents: 890, image_url: '/demo-products/escova-dental.png' },
  { ...pBase, id: 'p28', category_id: 'c8', name: 'Enxaguante Bucal', slug: 'enxaguante-bucal', base_price_cents: 1790, image_url: '/demo-products/enxaguante-bucal.png' },
  // Infantil
  { ...pBase, id: 'p29', category_id: 'c9', name: 'Lenço Umedecido', slug: 'lenco-umedecido', base_price_cents: 1390, featured: true, image_url: '/demo-products/lenco-umedecido.png' },
  { ...pBase, id: 'p30', category_id: 'c9', name: 'Sabonete Infantil', slug: 'sabonete-infantil', base_price_cents: 1090, image_url: '/demo-products/sabonete-infantil.png' },
  { ...pBase, id: 'p31', category_id: 'c9', name: 'Shampoo Infantil', slug: 'shampoo-infantil', base_price_cents: 1690, stock_status: 'out_of_stock', image_url: '/demo-products/shampoo-infantil.png' },
  // Primeiros Socorros
  { ...pBase, id: 'p32', category_id: 'c10', name: 'Curativos Adesivos', slug: 'curativos-adesivos', base_price_cents: 790, featured: true, image_url: '/demo-products/curativos-adesivos.png' },
  { ...pBase, id: 'p33', category_id: 'c10', name: 'Gaze Estéril', slug: 'gaze-esteril', base_price_cents: 590, image_url: '/demo-products/gaze.png' },
  { ...pBase, id: 'p34', category_id: 'c10', name: 'Esparadrapo', slug: 'esparadrapo', base_price_cents: 890, image_url: '/demo-products/esparadrapo.png' },
  { ...pBase, id: 'p35', category_id: 'c10', name: 'Água Oxigenada', slug: 'agua-oxigenada', base_price_cents: 690, image_url: '/demo-products/agua-oxigenada.png' },
  // Cuidados com a Pele
  { ...pBase, id: 'p36', category_id: 'c11', name: 'Protetor Solar FPS 50', slug: 'protetor-solar-fps-50', base_price_cents: 3990, image_url: '/demo-products/protetor-solar.png' },
  { ...pBase, id: 'p37', category_id: 'c11', name: 'Hidratante Corporal', slug: 'hidratante-corporal', base_price_cents: 2490, image_url: '/demo-products/hidratante.png' },
  { ...pBase, id: 'p38', category_id: 'c11', name: 'Creme para as Mãos', slug: 'creme-para-as-maos', base_price_cents: 1490, image_url: '/demo-products/creme-maos.png' },
];

const defaultPromotions: Promotion[] = [
  { id: 'promo1', name: 'Oferta Vitamina C', promotion_type: 'fixed_price', fixed_price_cents: 1490, percentage_off: null, fixed_discount_cents: null, starts_at: new Date().toISOString(), ends_at: null, active: true, created_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'promo2', name: 'Oferta Soro', promotion_type: 'fixed_price', fixed_price_cents: 499, percentage_off: null, fixed_discount_cents: null, starts_at: new Date().toISOString(), ends_at: null, active: true, created_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'promo3', name: 'Oferta Hidratante', promotion_type: 'fixed_price', fixed_price_cents: 1990, percentage_off: null, fixed_discount_cents: null, starts_at: new Date().toISOString(), ends_at: null, active: true, created_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'promo4', name: 'Oferta Sabonete', promotion_type: 'fixed_price', fixed_price_cents: 990, percentage_off: null, fixed_discount_cents: null, starts_at: new Date().toISOString(), ends_at: null, active: true, created_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const defaultPromotionProducts = [
  { promotion_id: 'promo1', product_id: 'p18' }, // Vitamina C 18,90 -> 14,90
  { promotion_id: 'promo2', product_id: 'p11' }, // Soro 6,90 -> 4,99
  { promotion_id: 'promo3', product_id: 'p37' }, // Hidratante 24,90 -> 19,90
  { promotion_id: 'promo4', product_id: 'p21' }, // Sabonete 12,90 -> 9,90
];


  
  const catSql = defaultCategories.map(c => 
    `insert into public.categories (id, name, slug, icon_key, display_order, active, created_at, updated_at) values (gen_random_uuid(), '${c.name.replace(/'/g, "''")}', '${c.slug}', '${c.icon_key}', ${c.display_order}, ${c.active}, now(), now()) on conflict (slug) do update set name = EXCLUDED.name, icon_key = EXCLUDED.icon_key, display_order = EXCLUDED.display_order, active = EXCLUDED.active;`
  ).join('\n');
  
  const prodSql = defaultProducts.map(p => {
    // Find promos
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
       promoStart = promo.starts_at ? `'${promo.starts_at}'` : 'NULL';
       promoEnd = promo.ends_at ? `'${promo.ends_at}'` : 'NULL';
    }
    
    // Find category slug
    const cat = defaultCategories.find(c => c.id === p.category_id);
    const catSlug = cat ? cat.slug : '';
    
    return `insert into public.products (id, category_id, name, slug, description, brand, price_cents, promotional_price_cents, promotion_starts_at, promotion_ends_at, is_in_stock, is_featured, active, image_url, created_at, updated_at) values (gen_random_uuid(), (select id from public.categories where slug = '${catSlug}'), '${p.name.replace(/'/g, "''")}', '${p.slug}', ${p.description ? "'" + p.description.replace(/'/g, "''") + "'" : 'NULL'}, ${p.brand ? "'" + p.brand.replace(/'/g, "''") + "'" : 'NULL'}, ${p.base_price_cents}, ${promoPrice}, ${promoStart}, ${promoEnd}, ${p.stock_status === 'in_stock'}, ${p.featured}, ${p.active}, ${p.image_url ? "'" + p.image_url + "'" : 'NULL'}, now(), now()) on conflict (slug) do update set name = EXCLUDED.name, category_id = EXCLUDED.category_id, price_cents = EXCLUDED.price_cents, promotional_price_cents = EXCLUDED.promotional_price_cents, is_in_stock = EXCLUDED.is_in_stock, is_featured = EXCLUDED.is_featured, active = EXCLUDED.active, image_url = EXCLUDED.image_url;`;
  }).join('\n');
  
  fs.writeFileSync('seed_output.txt', catSql + '\n\n' + prodSql);
