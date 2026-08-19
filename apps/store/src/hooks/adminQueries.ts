import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL?.trim()) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim());

// ─── ADMIN: All products (active + inactive) ────────────────────────────────
export function useAdminProducts() {
  return useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      if (!hasSupabaseConfig) {
        const { mockDB } = await import('@pagmenos/utils');
        const db = mockDB.get();
        return db.products.map((p: any) => ({
          ...p,
          base_price_cents: p.price_cents ?? p.base_price_cents,
          category: db.categories.find((c: any) => c.id === p.category_id),
        }));
      }
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(id, name, slug)')
        .order('name');
      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        base_price_cents: row.price_cents,
        stock_status: row.is_in_stock ? 'in_stock' : 'out_of_stock',
        featured: row.is_featured,
      }));
    },
  });
}

// ─── ADMIN: All categories (active + inactive) ──────────────────────────────
export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      if (!hasSupabaseConfig) {
        const { mockDB } = await import('@pagmenos/utils');
        return mockDB.get().categories.sort((a: any, b: any) => a.display_order - b.display_order);
      }
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
  });
}
