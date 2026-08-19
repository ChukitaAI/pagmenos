import { useState, useRef, useMemo } from 'react';
import { useAdminProducts, useAdminCategories } from '@/hooks/adminQueries';
import { supabase } from '@/lib/supabase';
import { compressProductImage, type CompressionResult } from '@/lib/imageCompressor';
import { formatBRL } from '@pagmenos/utils';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, ImageUp, Camera, X, Check, Search, DollarSign, Eye, EyeOff, MoreVertical } from 'lucide-react';

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
  const { data: products, isLoading } = useAdminProducts();
  const { data: categories } = useAdminCategories();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null); // product id or 'new'
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [priceInput, setPriceInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [compression, setCompression] = useState<CompressionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden' | 'out_of_stock'>('all');
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products;
    
    if (filter === 'visible') result = result.filter((p: any) => p.active);
    if (filter === 'hidden') result = result.filter((p: any) => !p.active);
    if (filter === 'out_of_stock') result = result.filter((p: any) => p.stock_status === 'out_of_stock');

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((p: any) => 
        p.name.toLowerCase().includes(lower) || 
        p.category?.name?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [products, searchTerm, filter]);

  const openNew = () => { setEditing('new'); setForm(emptyForm); setPriceInput(''); clearImage(); };
  const openEdit = (p: any) => {
    setEditing(p.id);
    setForm({ name: p.name, slug: p.slug, category_id: p.category_id, description: p.description || '', brand: p.brand || '', active_ingredient: p.active_ingredient || '', presentation: p.presentation || '', dosage: p.dosage || '', manufacturer: p.manufacturer || '', anvisa_registration: p.anvisa_registration || '', sale_type: p.sale_type, base_price_cents: p.base_price_cents, stock_status: p.stock_status, featured: p.featured, active: p.active });
    setPriceInput((p.base_price_cents / 100).toFixed(2));
    clearImage();
    if (p.image_url) {
      setPreviewUrl(p.image_url);
    }
  };
  const close = () => { setEditing(null); clearImage(); };

  const clearImage = () => { setImageFile(null); setCompression(null); if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImageProcessing(true);
      setImageFile(file);
      const result = await compressProductImage(file);
      setCompression(result);
      const url = URL.createObjectURL(result.blob);
      setPreviewUrl(url);
      toast.success(`Imagem preparada: ${formatBytes(result.compressedSize)}`);
    } catch (err: any) { toast.error(err.message || 'Erro ao processar imagem'); }
    setImageProcessing(false);
    if (fileRef.current) fileRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
  };

  const handlePriceChange = (v: string) => { setPriceInput(v); const cents = Math.round(parseFloat(v.replace(',', '.')) * 100); if (!isNaN(cents)) setForm((f) => ({ ...f, base_price_cents: cents })); };
  const generateSlug = (name: string) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL?.trim()) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim());

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
        const { mockDB } = await import('@pagmenos/utils');
        const db = mockDB.get();
        let productId = editing;
        if (editing === 'new') {
          productId = 'p' + Date.now();
          db.products.push({ id: productId, ...payload } as any);
        } else {
          const idx = db.products.findIndex((p: any) => p.id === editing);
          if (idx >= 0) db.products[idx] = { ...db.products[idx], ...payload } as any;
        }
        mockDB.save(db);
        toast.success(editing === 'new' ? 'Produto criado (Demo)!' : 'Produto atualizado (Demo)!');
        qc.invalidateQueries({ queryKey: ['admin-products'] });
        qc.invalidateQueries({ queryKey: ['products'] });
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
        let oldImageUrl: string | null = null;
        if (editing !== 'new') {
          const { data: oldProduct } = await supabase.from('products').select('image_url').eq('id', productId).single();
          oldImageUrl = oldProduct?.image_url || null;
        }

        const ext = compression.format === 'webp' ? 'webp' : 'jpeg';
        const path = `products/${productId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('product-images').upload(path, compression.blob, { contentType: `image/${ext}`, upsert: false });
        if (uploadErr) throw uploadErr;
        
        const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path);
        const { error: updateUrlErr } = await supabase.from('products').update({ image_url: publicUrlData.publicUrl }).eq('id', productId);
        if (updateUrlErr) throw updateUrlErr;

        if (oldImageUrl && oldImageUrl.includes('/product-images/')) {
          try {
            const oldPath = oldImageUrl.split('/product-images/')[1];
            if (oldPath) await supabase.storage.from('product-images').remove([oldPath]);
          } catch { /* non-critical */ }
        }
      }

      toast.success(editing === 'new' ? 'Produto criado!' : 'Produto atualizado!');
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      close();
    } catch (err: any) { toast.error(err.message || 'Erro ao salvar'); }
    setSaving(false);
  };

  const toggleStock = async (id: string, current: string) => {
    const next = current === 'in_stock' ? 'out_of_stock' : 'in_stock';
    if (!hasSupabaseConfig) {
       const { mockDB } = await import('@pagmenos/utils');
       const db = mockDB.get();
       const p = db.products.find((x: any) => x.id === id);
       if (p) p.stock_status = next as any;
       mockDB.save(db);
       qc.invalidateQueries({ queryKey: ['admin-products'] });
       qc.invalidateQueries({ queryKey: ['products'] });
       toast.success(next === 'in_stock' ? 'Produto disponível' : 'Produto esgotado');
       return;
    }

    const { error } = await supabase.from('products').update({ is_in_stock: next === 'in_stock' }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ['admin-products'] });
    qc.invalidateQueries({ queryKey: ['products'] });
    toast.success(next === 'in_stock' ? 'Produto disponível' : 'Produto esgotado');
  };

  const toggleActive = async (id: string, current: boolean) => {
    const next = !current;
    if (!hasSupabaseConfig) {
       const { mockDB } = await import('@pagmenos/utils');
       const db = mockDB.get();
       const p = db.products.find((x: any) => x.id === id);
       if (p) p.active = next;
       mockDB.save(db);
       qc.invalidateQueries({ queryKey: ['admin-products'] });
       qc.invalidateQueries({ queryKey: ['products'] });
       toast.success(next ? 'Produto visível na loja' : 'Produto oculto da loja');
       return;
    }

    const { error } = await supabase.from('products').update({ active: next }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ['admin-products'] });
    qc.invalidateQueries({ queryKey: ['products'] });
    toast.success(next ? 'Produto visível na loja' : 'Produto oculto da loja');
  };

  const quickChangePrice = async (p: any) => {
    const newPriceStr = prompt(`Novo preço para ${p.name} (R$):`, (p.base_price_cents / 100).toFixed(2));
    if (!newPriceStr) return;
    const cents = Math.round(parseFloat(newPriceStr.replace(',', '.')) * 100);
    if (isNaN(cents) || cents <= 0) { toast.error('Preço inválido'); return; }

    if (!hasSupabaseConfig) {
       const { mockDB } = await import('@pagmenos/utils');
       const db = mockDB.get();
       const pr = db.products.find((x: any) => x.id === p.id);
       if (pr) pr.base_price_cents = cents;
       mockDB.save(db);
       qc.invalidateQueries({ queryKey: ['admin-products'] });
       qc.invalidateQueries({ queryKey: ['products'] });
       toast.success('Preço atualizado!');
       return;
    }

    const { error } = await supabase.from('products').update({ price_cents: cents }).eq('id', p.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ['admin-products'] });
    qc.invalidateQueries({ queryKey: ['products'] });
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
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Foto do produto</label>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} className="hidden" />
              {imageProcessing ? (
                <div className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-brand-500 rounded-xl p-8 bg-brand-50/30">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-brand-600 font-medium">Processando imagem...</span>
                </div>
              ) : previewUrl ? (
                <div className="space-y-3">
                  <img src={previewUrl} alt="Prévia da imagem" className="w-full h-48 object-cover rounded-xl border border-border" />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => cameraRef.current?.click()} className="text-sm px-3 py-1.5 bg-surface border border-border rounded-lg text-text font-medium">Câmera</button>
                    <button type="button" onClick={() => fileRef.current?.click()} className="text-sm px-3 py-1.5 bg-surface border border-border rounded-lg text-text font-medium">Galeria</button>
                    <button type="button" onClick={clearImage} className="text-sm px-3 py-1.5 bg-danger-light text-danger rounded-lg font-medium">Remover</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button type="button" onClick={() => cameraRef.current?.click()} className="flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 hover:border-brand-500 hover:bg-brand-50/30 transition-colors">
                    <Camera size={24} className="text-text-muted" />
                    <span className="text-sm text-text-secondary font-medium">Tirar foto</span>
                  </button>
                  <button type="button" onClick={() => fileRef.current?.click()} className="flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 hover:border-brand-500 hover:bg-brand-50/30 transition-colors">
                    <ImageUp size={24} className="text-text-muted" />
                    <span className="text-sm text-text-secondary font-medium">Galeria</span>
                  </button>
                </div>
              )}
            </div>

            <div><label className="block text-sm font-medium text-text-secondary mb-1">Nome *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} className={IC} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Categoria *</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={IC}>
                <option value="">Selecione...</option>
                {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Preço Normal (R$) *</label><input type="text" value={priceInput} onChange={(e) => handlePriceChange(e.target.value)} className={IC} inputMode="decimal" placeholder="12.90" /></div>
            
            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3 border border-border rounded-xl bg-surface cursor-pointer">
                <div>
                  <span className="block text-sm font-medium text-text">Visível na loja</span>
                  <span className="block text-xs text-text-muted">Se desativado, o produto fica oculto</span>
                </div>
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-5 h-5 accent-brand-500" />
              </label>
              <label className="flex items-center justify-between p-3 border border-border rounded-xl bg-surface cursor-pointer">
                <div>
                  <span className="block text-sm font-medium text-text">Disponível para venda</span>
                  <span className="block text-xs text-text-muted">Se desativado, exibe como Esgotado</span>
                </div>
                <input type="checkbox" checked={form.stock_status === 'in_stock'} onChange={(e) => setForm({ ...form, stock_status: e.target.checked ? 'in_stock' : 'out_of_stock' })} className="w-5 h-5 accent-brand-500" />
              </label>
              <label className="flex items-center justify-between p-3 border border-border rounded-xl bg-surface cursor-pointer">
                <div>
                  <span className="block text-sm font-medium text-text">Destaque</span>
                  <span className="block text-xs text-text-muted">Mostra na seção principal</span>
                </div>
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-5 h-5 accent-brand-500" />
              </label>
            </div>
          </div>
          
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Marca</label><input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={IC} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Princípio ativo</label><input type="text" value={form.active_ingredient} onChange={(e) => setForm({ ...form, active_ingredient: e.target.value })} className={IC} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Apresentação</label><input type="text" value={form.presentation} onChange={(e) => setForm({ ...form, presentation: e.target.value })} className={IC} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Dosagem</label><input type="text" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} className={IC} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Fabricante</label><input type="text" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className={IC} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Descrição</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={IC} rows={4} /></div>
          </div>
        </div>
        
        {/* Mobile sticky save, desktop normal save */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:pb-0 pb-6">
          <button type="button" onClick={close} className="w-full sm:w-auto px-6 py-3.5 sm:py-3 border border-border rounded-xl text-text-secondary font-medium hover:bg-background transition-colors text-center">Cancelar</button>
          <button type="button" onClick={handleSave} disabled={saving} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-500 text-white px-6 py-3.5 sm:py-3 rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-60 transition-colors">
            {saving ? 'Salvando...' : <><Check size={18} /> Salvar Produto</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-text">Produtos</h1>
        <button onClick={openNew} className="flex shrink-0 items-center justify-center gap-2 bg-brand-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-brand-600 transition-colors text-sm w-full sm:w-auto">
          <Plus size={18} /> Novo produto
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border mb-6">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'visible', label: 'Visíveis' },
          { id: 'hidden', label: 'Ocultos' },
          { id: 'out_of_stock', label: 'Esgotados' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === t.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-text-secondary hover:text-text'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input 
          type="text" 
          placeholder="Buscar produtos..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
        />
      </div>

      <div className="grid grid-cols-1 md:hidden gap-4">
        {filteredProducts.map((p: any) => (
          <div key={p.id} className={`bg-surface border ${p.active ? 'border-border' : 'border-dashed border-border opacity-70'} rounded-xl p-4 flex flex-col gap-3`}>
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-semibold text-text leading-tight">{p.name}</p>
                <p className="text-xs text-text-muted mt-0.5">{p.category?.name}</p>
              </div>
              {!p.active && (
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-surface-hover text-text-muted rounded">Oculto</span>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold text-text">{formatBRL(p.base_price_cents)}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-md ${p.stock_status === 'in_stock' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                {p.stock_status === 'in_stock' ? 'Disponível' : 'Esgotado'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-border">
              <button onClick={() => openEdit(p)} className="flex items-center justify-center gap-1.5 py-2 px-3 border border-border rounded-lg text-sm font-medium text-text-secondary active:bg-surface-hover">
                <Pencil size={14} /> Editar
              </button>
              <button onClick={() => toggleActive(p.id, p.active)} className="flex items-center justify-center gap-1.5 py-2 px-3 border border-border rounded-lg text-sm font-medium text-text-secondary active:bg-surface-hover">
                {p.active ? <><EyeOff size={14} /> Ocultar</> : <><Eye size={14} /> Mostrar</>}
              </button>
              <button onClick={() => quickChangePrice(p)} className="flex items-center justify-center gap-1.5 py-2 px-3 border border-border rounded-lg text-sm font-medium text-text-secondary active:bg-surface-hover">
                <DollarSign size={14} /> Preço
              </button>
              <button onClick={() => toggleStock(p.id, p.stock_status)} className="flex items-center justify-center gap-1.5 py-2 px-3 border border-border rounded-lg text-sm font-medium text-text-secondary active:bg-surface-hover">
                <MoreVertical size={14} /> Estoque
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-hover text-text-secondary border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Visibilidade</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium">Estoque</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((p: any) => (
                <tr key={p.id} className={`hover:bg-background transition-colors ${!p.active ? 'opacity-70' : ''}`}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-text">{p.name}</p>
                      <p className="text-xs text-text-muted">{p.category?.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.active ? (
                      <span className="inline-flex items-center gap-1 text-success text-xs font-medium bg-success-light px-2 py-0.5 rounded-full"><Eye size={12} /> Visível</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-text-muted text-xs font-medium bg-surface-hover px-2 py-0.5 rounded-full"><EyeOff size={12} /> Oculto</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-text">
                    {formatBRL(p.base_price_cents)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.stock_status === 'in_stock' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                      {p.stock_status === 'in_stock' ? 'Disponível' : 'Esgotado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleActive(p.id, p.active)} className="p-1.5 text-text-secondary hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title={p.active ? 'Ocultar' : 'Reativar'}>
                        {p.active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => toggleStock(p.id, p.stock_status)} className="p-1.5 text-text-secondary hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Mudar estoque">
                        <MoreVertical size={16} />
                      </button>
                      <button onClick={() => quickChangePrice(p)} className="p-1.5 text-text-secondary hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Alterar preço rápido">
                        <DollarSign size={16} />
                      </button>
                      <button onClick={() => openEdit(p)} className="p-1.5 text-text-secondary hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Editar">
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {filteredProducts.length === 0 && !isLoading && (
        <div className="p-8 text-center text-text-secondary bg-surface border border-border rounded-2xl md:mt-0 mt-4">
          Nenhum produto encontrado.
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
