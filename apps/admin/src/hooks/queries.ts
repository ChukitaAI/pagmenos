import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Product, Category, StoreSettings } from '@pagmenos/types';

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
  return useQuery<StoreSettings>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      if (!hasSupabaseConfig) return (await import('@pagmenos/utils')).mockDB.get().settings;
      const { data, error } = await supabase.from('store_settings').select('*').limit(1).single();
      if (error) throw error;
      return data as StoreSettings;
    },
  });
}

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['admin-products'],
    queryFn: async () => {
      if (!hasSupabaseConfig) {
        const db = (await import('@pagmenos/utils')).mockDB.get();
        return db.products.map(p => ({ ...p, category: db.categories.find(c => c.id === p.category_id) as any }));
      }
      const { data, error } = await supabase.from('products').select('*, category:categories(name)').order('name');
      if (error) throw error;
      return (data || []).map(mapProduct);
    },
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      if (!hasSupabaseConfig) return (await import('@pagmenos/utils')).mockDB.get().categories;
      const { data, error } = await supabase.from('categories').select('*').order('display_order');
      if (error) throw error;
      return data || [];
    },
  });
}

