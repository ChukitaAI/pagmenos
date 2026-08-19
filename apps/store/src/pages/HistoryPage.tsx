import { Link } from 'react-router-dom';
import { mockDB } from '@pagmenos/utils';
import { formatBRL, formatDateFriendly } from '@pagmenos/utils';
import { useStoreAuth } from '@/stores/auth';
import { ArrowLeft, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL?.trim()) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim());

export default function HistoryPage() {
  const { user } = useStoreAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    if (!hasSupabaseConfig) {
      setHistory(mockDB.get().history);
      setLoading(false);
      return;
    }

    supabase.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) {
        setHistory(data.map(order => ({
          id: order.id,
          date: order.created_at,
          total: order.total_cents,
          items: order.items.map((i: any) => ({
            name: i.product_name,
            quantity: i.quantity,
            price: i.unit_price_cents
          }))
        })));
      }
      setLoading(false);
    });
  }, [user]);

  if (!user) {
    return <div className="p-8 text-center"><Link to="/login" className="text-brand-600">Faça login</Link></div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/conta" className="text-text-secondary hover:text-text touch-target"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold text-text">Minhas compras</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface border border-border rounded-2xl p-5 shadow-sm animate-pulse">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-border border-dashed">
                <div className="h-4 bg-border rounded w-24"></div>
                <div className="h-5 bg-border rounded w-16"></div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-border rounded w-3/4"></div>
                <div className="h-4 bg-border rounded w-1/2"></div>
              </div>
              <div className="flex justify-between items-end">
                <div className="h-3 bg-border rounded w-16"></div>
                <div className="h-6 bg-border rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mx-auto mb-4 text-text-muted">
            <Search size={24} />
          </div>
          <p className="text-text-secondary mb-4">Você ainda não possui compras salvas.</p>
          <Link to="/" className="text-brand-600 font-medium hover:underline text-sm">Explorar produtos</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((order) => (
            <div key={order.id} className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-border border-dashed">
                <span className="text-sm font-semibold text-text">{formatDateFriendly(order.date)}</span>
                <span className="text-xs bg-surface-hover text-text-secondary px-2 py-1 rounded-md font-medium">Concluído</span>
              </div>
              <div className="space-y-2 mb-4">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm text-text-secondary">
                    <span>{item.quantity}x {item.name}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs text-text-muted">Total pago</span>
                <span className="text-lg font-bold text-text">{formatBRL(order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
