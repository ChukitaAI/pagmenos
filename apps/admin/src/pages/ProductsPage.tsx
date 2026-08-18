import { useState, useRef, useMemo } from 'react';
import { useProducts, useCategories } from '@/hooks/queries';
import { supabase } from '@/lib/supabase';
import { compressProductImage, type CompressionResult } from '@/lib/imageCompressor';
import { formatBRL } from '@pagmenos/utils';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, ImageUp, X, Check, Search, DollarSign } from 'lucide-react';

type ProductForm = {
  name: string; slug: string; category_id: string; description: string; brand: string;
  active_ingredient: string; presentation: string; dosage: string; manufacturer: string;
  anvisa_registration: string; sale_type: string; base_price_cents: number;
  stock_status: string; featured: boolean; active: boolean;
};

const emptyForm: ProductForm = {
  name: '', slug: '', category_id: '', description: '', brand: '',
  active_ingredient: '', presentation: '', dosage: '', manufacturer: '',
  anvisa_registration: '', sale_type: 'non_medicine', base_price_cents: 0,
  stock_status: 'in_stock', featured: false, active: true,
};

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null); // product id or 'new'
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [priceInput, setPriceInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [compression, setCompression] = useState<CompressionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchTerm) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter((p: any) => 
      p.name.toLowerCase().includes(lower) || 
      p.category?.name.toLowerCase().includes(lower)
    );
  }, [products, searchTerm]);

  const openNew = () => { setEditing('new'); setForm(emptyForm); setPriceInput(''); clearImage(); };
  const openEdit = (p: any) => {
    setEditing(p.id);
    setForm({ name: p.name, slug: p.slug, category_id: p.category_id, description: p.description || '', brand: p.brand || '', active_ingredient: p.active_ingredient || '', presentation: p.presentation || '', dosage: p.dosage || '', manufacturer: p.manufacturer || '', anvisa_registration: p.anvisa_registration || '', sale_type: p.sale_type, base_price_cents: p.base_price_cents, stock_status: p.stock_status, featured: p.featured, active: p.active });
    setPriceInput((p.base_price_cents / 100).toFixed(2));
    clearImage();
  };
  const close = () => { setEditing(null); clearImage(); };

  const clearImage = () => { setImageFile(null); setCompression(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImageFile(file);
      const result = await compressProductImage(file);
      setCompression(result);
      const url = URL.createObjectURL(result.blob);
      setPreviewUrl(url);
      toast.success(`Imagem comprimida: ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${result.savings}% economia)`);
    } catch (err: any) { toast.error(err.message || 'Erro ao processar imagem'); }
  };

  const handlePriceChange = (v: string) => { setPriceInput(v); const cents = Math.round(parseFloat(v.replace(',', '.')) * 100); if (!isNaN(cents)) setForm((f) => ({ ...f, base_price_cents: cents })); };
  const generateSlug = (name: string) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

  const handleSave = async () => {
    if (!form.name || !form.category_id || form.base_price_cents <= 0) { toast.error('Preencha nome, categoria e preço.'); return; }
    setSaving(true);
    try {
      const slug = form.slug || generateSlug(form.name);
      
      const dbPayload = {
        name: form.name,
        slug: slug,
        category_id: form.category_id,
        description: form.description || null,
        brand: form.brand || null,
        price_cents: form.base_price_cents,
        is_in_stock: form.stock_status === 'in_stock',
        is_featured: form.featured,
        active: form.active
      };

      if (!hasSupabaseConfig) {
        const payload = { ...form, slug };
        const db = (await import('@pagmenos/utils')).mockDB.get();
        let productId = editing;
        if (editing === 'new') {
          productId = 'p' + Date.now();
          db.products.push({ id: productId, ...payload } as any);
        } else {
          const idx = db.products.findIndex(p => p.id === editing);
          if (idx >= 0) db.products[idx] = { ...db.products[idx], ...payload } as any;
        }
        (await import('@pagmenos/utils')).mockDB.save(db);
        toast.success(editing === 'new' ? 'Produto criado (Demo)!' : 'Produto atualizado (Demo)!');
        qc.invalidateQueries({ queryKey: ['admin-products'] });
        close();
        setSaving(false);
        return;
      }

      let productId = editing;
      if (editing === 'new') {
        const { data, error } = await supabase.from('products').insert(dbPayload).select('id').single();
        if (error) throw error;
        productId = data.id;
      } else {
        const { error } = await supabase.from('products').update(dbPayload).eq('id', editing);
        if (error) throw error;
      }

      // Upload image if selected
      if (compression && productId) {
        const ext = compression.format === 'webp' ? 'webp' : 'jpeg';
        const path = `products/${productId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('product-images').upload(path, compression.blob, { contentType: `image/${ext}`, upsert: false });
        if (uploadErr) throw uploadErr;
        // Save image record
        const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path);
        await supabase.from('products').update({ image_url: publicUrlData.publicUrl }).eq('id', productId);
      }

      toast.success(editing === 'new' ? 'Produto criado!' : 'Produto atualizado!');
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      close();
    } catch (err: any) { toast.error(err.message || 'Erro ao salvar'); }
    setSaving(false);
  };

  const toggleStock = async (id: string, current: string) => {
    const next = current === 'in_stock' ? 'out_of_stock' : 'in_stock';
    if (!hasSupabaseConfig) {
       const db = (await import('@pagmenos/utils')).mockDB.get();
       const p = db.products.find(x => x.id === id);
       if (p) p.stock_status = next as any;
       (await import('@pagmenos/utils')).mockDB.save(db);
       qc.invalidateQueries({ queryKey: ['admin-products'] });
       toast.success(next === 'in_stock' ? 'Produto disponível' : 'Produto esgotado');
       return;
    }

    await supabase.from('products').update({ is_in_stock: next === 'in_stock' }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-products'] });
    toast.success(next === 'in_stock' ? 'Produto disponível' : 'Produto esgotado');
  };

  const quickChangePrice = async (p: any) => {
    const newPriceStr = prompt(`Novo preço para ${p.name} (R$):`, (p.base_price_cents / 100).toFixed(2));
    if (!newPriceStr) return;
    const cents = Math.round(parseFloat(newPriceStr.replace(',', '.')) * 100);
    if (isNaN(cents) || cents <= 0) { toast.error('Preço inválido'); return; }

    if (!hasSupabaseConfig) {
       const db = (await import('@pagmenos/utils')).mockDB.get();
       const pr = db.products.find(x => x.id === p.id);
       if (pr) pr.base_price_cents = cents;
       (await import('@pagmenos/utils')).mockDB.save(db);
       qc.invalidateQueries({ queryKey: ['admin-products'] });
       toast.success('Preço atualizado!');
       return;
    }

    await supabase.from('products').update({ price_cents: cents }).eq('id', p.id);
    qc.invalidateQueries({ queryKey: ['admin-products'] });
    toast.success('Preço atualizado!');
  };

  const IC = "w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface";

  if (editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text">{editing === 'new' ? 'Novo Produto' : 'Editar Produto'}</h1>
          <button onClick={close} className="text-text-secondary hover:text-text"><X size={24} /></button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Nome *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} className={IC} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Categoria *</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={IC}>
                <option value="">Selecione...</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Preço (R$) *</label><input type="text" value={priceInput} onChange={(e) => handlePriceChange(e.target.value)} className={IC} inputMode="decimal" placeholder="12.90" /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Marca</label><input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={IC} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Princípio ativo</label><input type="text" value={form.active_ingredient} onChange={(e) => setForm({ ...form, active_ingredient: e.target.value })} className={IC} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Apresentação</label><input type="text" value={form.presentation} onChange={(e) => setForm({ ...form, presentation: e.target.value })} className={IC} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Dosagem</label><input type="text" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} className={IC} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Fabricante</label><input type="text" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className={IC} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Descrição</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={IC} rows={3} /></div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="rounded" /> Destaque</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" /> Ativo</label>
            </div>
          </div>
          <div className="space-y-4">
            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Foto do produto</label>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} className="hidden" />
              {previewUrl ? (
                <div className="space-y-3">
                  <img src={previewUrl} alt="Preview" className="w-full max-w-sm rounded-xl border border-border" />
                  {compression && (
                    <div className="bg-success-light border border-success/20 rounded-xl p-3 text-sm">
                      <p className="font-medium text-success">Imagem otimizada</p>
                      <p className="text-text-secondary">Original: {formatBytes(compression.originalSize)} → Otimizada: {formatBytes(compression.compressedSize)}</p>
                      <p className="text-text-secondary">Economia: {compression.savings}% · {compression.width}×{compression.height}px · {compression.format.toUpperCase()}</p>
                    </div>
                  )}
                  <button onClick={() => { clearImage(); fileRef.current?.click(); }} className="text-sm text-brand-600 font-medium">Trocar foto</button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="w-full max-w-sm flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-8 hover:border-brand-500 hover:bg-brand-50/30 transition-colors">
                  <ImageUp size={32} className="text-text-muted" />
                  <span className="text-sm text-text-secondary">Clique para selecionar imagem</span>
                  <span className="text-xs text-text-muted">JPEG, PNG ou WebP · Comprimida automaticamente</span>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-60 transition-colors">
            {saving ? 'Salvando...' : <><Check size={18} /> Salvar</>}
          </button>
          <button onClick={close} className="px-6 py-3 border border-border rounded-xl text-text-secondary hover:bg-background transition-colors">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-text">Produtos</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface w-full sm:w-64"
            />
          </div>
          <button onClick={openNew} className="flex shrink-0 items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-brand-600 transition-colors text-sm">
            <Plus size={18} /> <span className="hidden sm:inline">Novo produto</span>
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-surface-hover text-text-secondary border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium">Estoque</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((p: any) => (
                <tr key={p.id} className="hover:bg-background transition-colors group">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-text">{p.name}</p>
                      <p className="text-xs text-text-muted">{(p as any).category?.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-text">
                    {formatBRL(p.base_price_cents)}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStock(p.id, p.stock_status)} className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${p.stock_status === 'in_stock' ? 'bg-success-light text-success hover:bg-success/20' : 'bg-danger-light text-danger hover:bg-danger/20'}`}>
                      {p.stock_status === 'in_stock' ? 'Disponível' : 'Esgotado'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => quickChangePrice(p)} className="p-1.5 text-text-secondary hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Alterar preço rápido">
                        <DollarSign size={16} />
                      </button>
                      <button onClick={() => openEdit(p)} className="p-1.5 text-text-secondary hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Editar completo">
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && !isLoading && (
          <div className="p-8 text-center text-text-secondary">Nenhum produto encontrado.</div>
        )}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
