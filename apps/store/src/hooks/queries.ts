import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mockDB } from '@pagmenos/utils';
import type { Product, Category, StoreSettings, Banner } from '@pagmenos/types';

const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL?.trim()) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim());

function mapProduct(row: any): Product {
  return {
    ...row,
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    brand: row.brand,
    base_price_cents: row.price_cents,
    promotional_price_cents: row.promotional_price_cents,
    promotion_starts_at: row.promotion_starts_at,
    promotion_ends_at: row.promotion_ends_at,
    stock_status: row.is_in_stock ? 'in_stock' : 'out_of_stock',
    featured: row.is_featured,
    active: row.active,
    image_url: row.image_url,
    category: row.category
  };
}

export function useStoreSettings() {
  return useQuery<StoreSettings>({ queryKey: ['store-settings'], queryFn: async () => {
    if (!hasSupabaseConfig) return mockDB.get().settings;
    const { data, error } = await supabase.from('store_settings').select('*').limit(1).single();
    if (error) throw error; return data as StoreSettings;
  }, staleTime: 1000 * 60 * 10 });
}

export function useCategories() {
  return useQuery<Category[]>({ queryKey: ['categories'], queryFn: async () => {
    if (!hasSupabaseConfig) return mockDB.get().categories.filter(c => c.active).sort((a, b) => a.display_order - b.display_order);
    const { data, error } = await supabase.from('categories').select('*').eq('active', true).order('display_order');
    if (error) throw error; return data || [];
  }});
}

export function useProducts(options?: { categoryId?: string; featured?: boolean; limit?: number }) {
  return useQuery<Product[]>({ queryKey: ['products', options], queryFn: async () => {
    if (!hasSupabaseConfig) {
      let filtered = mockDB.get().products.filter(p => p.active);
      if (options?.categoryId) filtered = filtered.filter(p => p.category_id === options.categoryId);
      if (options?.featured) filtered = filtered.filter(p => p.featured);
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      if (options?.limit) filtered = filtered.slice(0, options.limit);
      return filtered.map(p => ({ ...p, category: mockDB.get().categories.find(c => c.id === p.category_id) as any }));
    }

    let query = supabase.from('products').select('*, category:categories(name, slug)').eq('active', true).order('is_featured', { ascending: false }).order('name');
    if (options?.categoryId) query = query.eq('category_id', options.categoryId);
    if (options?.featured) query = query.eq('is_featured', true);
    if (options?.limit) query = query.limit(options.limit);
    
    const { data, error } = await query; 
    if (error) throw error; 
    return (data || []).map(mapProduct);
  }});
}

export function useProduct(slug: string) {
  return useQuery<Product & { category: Category; images: any[] }>({ queryKey: ['product', slug], queryFn: async () => {
    if (!hasSupabaseConfig) {
      const p = mockDB.get().products.find(x => x.slug === slug && x.active);
      if (!p) throw new Error('Not found');
      const category = mockDB.get().categories.find(c => c.id === p.category_id);
      return { ...p, category, images: [] } as any;
    }

    const { data, error } = await supabase.from('products').select('*, category:categories(*)').eq('slug', slug).eq('active', true).single();
    if (error) throw error; 
    
    const mapped = mapProduct(data);
    return { ...mapped, images: [] } as any;
  }, enabled: !!slug });
}

export function useProductPromotions(productIds: string[]) {
  return useQuery({ queryKey: ['promotions', productIds], queryFn: async () => {
    if (!productIds.length) return {};
    
    if (!hasSupabaseConfig) {
      const map: Record<string, { name: string; effectivePrice: number | null }> = {};
      const { promotions, promotionProducts } = mockDB.get();
      for (const pid of productIds) {
        const link = promotionProducts.find(x => x.product_id === pid);
        if (link) {
          const promo = promotions.find(p => p.id === link.promotion_id && p.active);
          if (promo) {
             const now = new Date();
             if (new Date(promo.starts_at) <= now && (!promo.ends_at || new Date(promo.ends_at) > now)) {
               map[pid] = { name: promo.name, effectivePrice: promo.fixed_price_cents ?? null };
             }
          }
        }
      }
      return map;
    }

    const { data, error } = await supabase.from('products').select('id, promotional_price_cents, promotion_starts_at, promotion_ends_at').in('id', productIds);
    if (error) throw error;
    
    const map: Record<string, { name: string; effectivePrice: number | null }> = {};
    for (const row of (data || [])) {
      if (row.promotional_price_cents) {
        const now = new Date();
        const start = row.promotion_starts_at ? new Date(row.promotion_starts_at) : null;
        const end = row.promotion_ends_at ? new Date(row.promotion_ends_at) : null;
        
        if ((!start || start <= now) && (!end || end > now)) {
          map[row.id] = { name: 'Oferta', effectivePrice: row.promotional_price_cents };
        }
      }
    }
    return map;
  }, enabled: productIds.length > 0, staleTime: 1000 * 60 * 2 });
}

export function useProductSearch(query: string) {
  return useQuery<Product[]>({ queryKey: ['search', query], queryFn: async () => {
    if (!query.trim()) return [];
    
    if (!hasSupabaseConfig) {
      const q = query.toLowerCase();
      const filtered = mockDB.get().products.filter(p => p.active && (p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q)) || (p.active_ingredient && p.active_ingredient.toLowerCase().includes(q))));
      return filtered.map(p => ({ ...p, category: mockDB.get().categories.find(c => c.id === p.category_id) as any })).slice(0, 50);
    }

    const { data, error } = await supabase.from('products').select('*, category:categories(name, slug)').eq('active', true).or(`name.ilike.%${query}%,brand.ilike.%${query}%`).order('name').limit(50);
    if (error) throw error; 
    return (data || []).map(mapProduct);
  }, enabled: query.trim().length >= 2 });
}

export function useCategoryBySlug(slug: string) {
  return useQuery<Category>({ queryKey: ['category', slug], queryFn: async () => {
    if (!hasSupabaseConfig) {
      const c = mockDB.get().categories.find(x => x.slug === slug && x.active);
      if (!c) throw new Error('Not found');
      return c;
    }
    const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).eq('active', true).single();
    if (error) throw error; return data;
  }, enabled: !!slug });
}

export function useBanners() {
  return useQuery<Banner[]>({ queryKey: ['banners'], queryFn: async () => {
    if (!hasSupabaseConfig) return [];
    const { data, error } = await supabase.from('banners').select('*').eq('active', true).order('display_order');
    if (error) throw error; return data || [];
  }});
}

