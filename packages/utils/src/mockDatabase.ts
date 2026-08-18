// ============================================================================
// Pagmenos — Mock Local Database (Demo Mode)
// ============================================================================
// Stores data in localStorage. Shared across Store and Admin.

import type { Product, Category, Promotion, StoreSettings, UserRole } from '@pagmenos/types';

const MOCK_VERSION = 'v3';
const DB_KEY = `pagmenos_demo_db_${MOCK_VERSION}`;

export interface MockDBState {
  products: Product[];
  categories: Category[];
  promotions: Promotion[];
  promotionProducts: { promotion_id: string; product_id: string }[];
  settings: StoreSettings;
  history: any[]; // demo purchase history
}

// Initial Seed Data
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

const defaultSettings: StoreSettings = {
  id: 'settings1',
  store_name: 'Pagmenos',
  whatsapp_number: '558899981853',
  phone: '(88) 9998-1853',
  street: 'Rua Agronomando Rangel',
  number: '475',
  district: 'Centro',
  city: 'Canindé',
  state: 'CE',
  zip_code: '62700-000',
  complement: null,
  logo_path: null,
  pix_enabled: true,
  cash_enabled: true,
  credit_card_enabled: true,
  debit_card_enabled: true,
  delivery_enabled: true,
  pickup_enabled: true,
  delivery_fee_cents: 500,
  minimum_order_cents: 1000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Initial History for Client Demo
const defaultHistory = [
  { id: 'h1', date: '2026-08-17T10:00:00.000Z', items: [{ name: 'Dipirona 500mg', quantity: 2, price: 990 }, { name: 'Vitamina C 1g', quantity: 1, price: 1490 }], total: 3470 },
  { id: 'h2', date: '2026-08-10T14:30:00.000Z', items: [{ name: 'Paracetamol 750mg', quantity: 1, price: 1090 }, { name: 'Soro Fisiológico 0,9%', quantity: 1, price: 690 }], total: 1780 }
];

function getDB(): MockDBState {
  if (typeof window === 'undefined') return { products: [], categories: [], promotions: [], promotionProducts: [], settings: defaultSettings, history: [] };
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }
  const init: MockDBState = {
    products: defaultProducts,
    categories: defaultCategories,
    promotions: defaultPromotions,
    promotionProducts: defaultPromotionProducts,
    settings: defaultSettings,
    history: defaultHistory,
  };
  localStorage.setItem(DB_KEY, JSON.stringify(init));
  return init;
}

function saveDB(db: MockDBState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// Ensure unique window events for cross-tab reactivity
export const mockDB = {
  get: getDB,
  save: saveDB,
  reset: () => {
    if (typeof window !== 'undefined') localStorage.removeItem(DB_KEY);
    return getDB();
  }
};
