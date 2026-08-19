import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminProducts } from '@/hooks/adminQueries';
import { supabase } from '@/lib/supabase';
import { formatBRL } from '@pagmenos/utils';
import { toast } from 'sonner';
import { Plus, Pencil, X, Check, Trash2 } from 'lucide-react';

type PromoForm = { name: string; promotion_type: string; fixed_price_cents: number; percentage_off: number; starts_at: string; ends_at: string; active: boolean; productIds: string[] };
const emptyForm: PromoForm = { name: '', promotion_type: 'fixed_price', fixed_price_cents: 0, percentage_off: 0, starts_at: new Date().toISOString().slice(0, 16), ends_at: '', active: true, productIds: [] };

export default function PromotionsPage() {
  const qc = useQueryClient();
  const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL?.trim()) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim());

  const { data: promotions, isLoading } = useQuery({ queryKey: ['admin-promotions'], queryFn: async () => {
    if (!hasSupabaseConfig) {
      const db = (await import('@pagmenos/utils')).mockDB.get();
      return db.promotions.map(p => ({
         ...p,
         products: db.promotionProducts.filter(x => x.promotion_id === p.id)
      })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    const { data, error } = await supabase.from('products').select('id, name, promotional_price_cents, promotion_starts_at, promotion_ends_at').not('promotional_price_cents', 'is', null).order('updated_at', { ascending: false });
    if (error) throw error; 
    return (data || []).map(p => ({
        id: p.id,
        name: `Oferta: ${p.name}`,
        promotion_type: 'fixed_price',
        fixed_price_cents: p.promotional_price_cents,
        starts_at: p.promotion_starts_at || new Date().toISOString().slice(0, 16),
        ends_at: p.promotion_ends_at,
        active: true,
        products: [{ product_id: p.id }]
    }));
  }});
  const { data: products } = useAdminProducts();

  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyForm);
  const [priceInput, setPriceInput] = useState('');
  const [saving, setSaving] = useState(false);

  const openNew = () => { setEditing('new'); setForm(emptyForm); setPriceInput(''); };
  const openEdit = (p: any) => {
    setEditing(p.id);
    setForm({ name: p.name, promotion_type: p.promotion_type, fixed_price_cents: p.fixed_price_cents || 0, percentage_off: p.percentage_off || 0, starts_at: p.starts_at?.slice(0, 16) || '', ends_at: p.ends_at?.slice(0, 16) || '', active: p.active, productIds: p.products?.map((x: any) => x.product_id) || [] });
    setPriceInput(p.fixed_price_cents ? (p.fixed_price_cents / 100).toFixed(2) : '');
  };
  const close = () => setEditing(null);

  const handlePriceChange = (v: string) => { setPriceInput(v); const c = Math.round(parseFloat(v.replace(',', '.')) * 100); if (!isNaN(c)) setForm(f => ({ ...f, fixed_price_cents: c })); };
  const toggleProduct = (id: string) => setForm(f => ({ ...f, productIds: f.productIds.includes(id) ? f.productIds.filter(x => x !== id) : [...f.productIds, id] }));

  const handleSave = async () => {
    if (!form.name) { toast.error('Nome obrigatório.'); return; }
    setSaving(true);
    try {
      const payload: any = { name: form.name, promotion_type: form.promotion_type, active: form.active, starts_at: form.starts_at || new Date().toISOString(), ends_at: form.ends_at || null };
      if (form.promotion_type === 'fixed_price') { payload.fixed_price_cents = form.fixed_price_cents; payload.percentage_off = null; payload.fixed_discount_cents = null; }
      else if (form.promotion_type === 'percentage') { payload.percentage_off = form.percentage_off; payload.fixed_price_cents = null; payload.fixed_discount_cents = null; }

      if (!hasSupabaseConfig) {
        const db = (await import('@pagmenos/utils')).mockDB.get();
        let promoId = editing;
        if (editing === 'new') {
          promoId = 'promo' + Date.now();
          db.promotions.push({ id: promoId, ...payload } as any);
        } else {
          const idx = db.promotions.findIndex(p => p.id === editing);
          if (idx >= 0) db.promotions[idx] = { ...db.promotions[idx], ...payload } as any;
          db.promotionProducts = db.promotionProducts.filter(x => x.promotion_id !== editing);
        }
        if (form.productIds.length > 0) {
          db.promotionProducts.push(...form.productIds.map(pid => ({ promotion_id: promoId!, product_id: pid })));
        }
        (await import('@pagmenos/utils')).mockDB.save(db);
        toast.success('Promoção salva (Demo)!');
        qc.invalidateQueries({ queryKey: ['admin-promotions'] });
        close();
        setSaving(false);
        return;
      }

      if (editing === 'new') {
        // No distinct promo table. We just update the selected products
        if (form.productIds.length > 0) {
          const { error } = await supabase.from('products').update({
            promotional_price_cents: payload.fixed_price_cents || payload.percentage_off,
            promotion_starts_at: payload.starts_at || null,
            promotion_ends_at: payload.ends_at || null
          }).in('id', form.productIds);
          if (error) throw error;
        }
      } else {
        // We are editing a "promotion" which is just a single product
        const { error } = await supabase.from('products').update({
            promotional_price_cents: form.active ? (payload.fixed_price_cents || payload.percentage_off) : null,
            promotion_starts_at: form.active ? (payload.starts_at || null) : null,
            promotion_ends_at: form.active ? (payload.ends_at || null) : null
        }).eq('id', editing);
        if (error) throw error;
      }
      toast.success('Promoção salva!');
      qc.invalidateQueries({ queryKey: ['admin-promotions'] });
      close();
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta promoção?')) return;
    await supabase.from('products').update({
      promotional_price_cents: null,
      promotion_starts_at: null,
      promotion_ends_at: null
    }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-promotions'] });
    toast.success('Promoção removida.');
  };

  const IC = "w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface";

  if (editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold text-text">{editing === 'new' ? 'Nova Promoção' : 'Editar Promoção'}</h1><button onClick={close}><X size={24} /></button></div>
        <div className="max-w-xl space-y-4">
          <div><label className="block text-sm font-medium text-text-secondary mb-1">Nome *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={IC} placeholder="Ex: Oferta de Inverno" /></div>
          <div><label className="block text-sm font-medium text-text-secondary mb-1">Tipo</label>
            <select value={form.promotion_type} onChange={e => setForm({ ...form, promotion_type: e.target.value })} className={IC}>
              <option value="fixed_price">Preço fixo</option><option value="percentage">Porcentagem</option>
            </select>
          </div>
          {form.promotion_type === 'fixed_price' && <div><label className="block text-sm font-medium text-text-secondary mb-1">Preço promocional (R$)</label><input type="text" value={priceInput} onChange={e => handlePriceChange(e.target.value)} className={IC} inputMode="decimal" placeholder="9.90" /></div>}
          {form.promotion_type === 'percentage' && <div><label className="block text-sm font-medium text-text-secondary mb-1">Desconto (%)</label><input type="number" value={form.percentage_off} onChange={e => setForm({ ...form, percentage_off: parseInt(e.target.value) || 0 })} className={IC} min={1} max={100} /></div>}
          <div><label className="block text-sm font-medium text-text-secondary mb-1">Início</label><input type="datetime-local" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} className={IC} /></div>
          <div><label className="block text-sm font-medium text-text-secondary mb-1">Fim (opcional)</label><input type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} className={IC} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Ativa</label>

          <div><label className="block text-sm font-medium text-text-secondary mb-2">Produtos na promoção</label>
            <div className="max-h-60 overflow-y-auto border border-border rounded-xl divide-y divide-border">
              {products?.map((p: any) => (
                <label key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-background cursor-pointer">
                  <input type="checkbox" checked={form.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                  <span className="text-sm text-text">{p.name}</span>
                  <span className="text-xs text-text-muted ml-auto">{formatBRL(p.price_cents)}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-60"><Check size={18} /> {saving ? 'Salvando...' : 'Salvar'}</button>
            <button onClick={close} className="px-6 py-3 border border-border rounded-xl text-text-secondary hover:bg-background">Cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold text-text">Promoções</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-brand-600 text-sm"><Plus size={18} /> Nova promoção</button>
      </div>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-hover text-text-secondary border-b border-border"><tr><th className="px-4 py-3 font-medium">Promoção</th><th className="px-4 py-3 font-medium">Tipo</th><th className="px-4 py-3 font-medium">Período</th><th className="px-4 py-3 font-medium text-right">Ações</th></tr></thead>
          <tbody className="divide-y divide-border">
            {promotions?.map((p: any) => (
              <tr key={p.id} className="hover:bg-background transition-colors">
                <td className="px-4 py-3"><p className="font-medium text-text">{p.name}</p><p className="text-xs text-text-muted">{p.products?.length || 0} produto(s)</p></td>
                <td className="px-4 py-3 text-text-secondary">{p.promotion_type === 'fixed_price' ? formatBRL(p.fixed_price_cents) : `${p.percentage_off}%`}</td>
                <td className="px-4 py-3 text-xs text-text-muted">{new Date(p.starts_at).toLocaleDateString('pt-BR')} → {p.ends_at ? new Date(p.ends_at).toLocaleDateString('pt-BR') : '∞'}</td>
                <td className="px-4 py-3 text-right flex gap-2 justify-end">
                  <button onClick={() => openEdit(p)} className="text-brand-600 hover:text-brand-700"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-danger hover:text-danger/80"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!promotions || promotions.length === 0) && !isLoading && <div className="p-8 text-center text-text-secondary">Nenhuma promoção cadastrada.</div>}
      </div>
    </div>
  );
}
