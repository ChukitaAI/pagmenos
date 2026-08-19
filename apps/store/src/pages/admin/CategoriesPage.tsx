import { useState, useMemo } from 'react';
import { useAdminCategories, useAdminProducts } from '@/hooks/adminQueries';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, X, Check, ArrowUp, ArrowDown, Trash2, EyeOff, Eye } from 'lucide-react';

type CategoryForm = {
  name: string;
  slug: string;
  icon_key: string;
  display_order: number;
  active: boolean;
};

const emptyForm: CategoryForm = {
  name: '', slug: '', icon_key: 'pill', display_order: 0, active: true,
};

const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL?.trim()) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim());

export default function CategoriesPage() {
  const { data: categories, isLoading } = useAdminCategories();
  const { data: products } = useAdminProducts();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reassignTarget, setReassignTarget] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const sorted = useMemo(() => {
    if (!categories) return [];
    let result = [...categories].sort((a, b) => a.display_order - b.display_order);
    if (filter === 'active') result = result.filter(c => c.active);
    if (filter === 'inactive') result = result.filter(c => !c.active);
    return result;
  }, [categories, filter]);

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const openNew = () => {
    const maxOrder = sorted.length > 0 ? Math.max(...sorted.map(c => c.display_order)) : 0;
    setEditing('new');
    setForm({ ...emptyForm, display_order: maxOrder + 1 });
  };

  const openEdit = (c: any) => {
    setEditing(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      icon_key: c.icon_key || 'pill',
      display_order: c.display_order || 0,
      active: c.active ?? true,
    });
  };

  const close = () => {
    setEditing(null);
    setDeletingId(null);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Nome da categoria é obrigatório.'); return; }
    setSaving(true);

    try {
      const slug = form.slug || generateSlug(form.name);
      const payload = {
        name: form.name,
        slug,
        icon_key: form.icon_key || null,
        display_order: form.display_order,
        active: form.active,
      };

      if (!hasSupabaseConfig) {
        const { mockDB } = await import('@pagmenos/utils');
        const db = mockDB.get();
        if (editing === 'new') {
          db.categories.push({ id: 'cat' + Date.now(), ...payload } as any);
        } else {
          const idx = db.categories.findIndex((c: any) => c.id === editing);
          if (idx >= 0) db.categories[idx] = { ...db.categories[idx], ...payload } as any;
        }
        mockDB.save(db);
        toast.success(editing === 'new' ? 'Categoria criada (Demo)!' : 'Categoria atualizada (Demo)!');
      } else {
        if (editing === 'new') {
          const { error } = await supabase.from('categories').insert(payload);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('categories').update(payload).eq('id', editing);
          if (error) throw error;
        }
        toast.success(editing === 'new' ? 'Categoria criada!' : 'Categoria atualizada!');
      }

      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      close();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar categoria.');
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    if (!hasSupabaseConfig) {
      const { mockDB } = await import('@pagmenos/utils');
      const db = mockDB.get();
      const c = db.categories.find((x: any) => x.id === id);
      if (c) (c as any).active = !currentActive;
      mockDB.save(db);
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success(!currentActive ? 'Categoria ativada' : 'Categoria desativada');
      return;
    } 

    const { error } = await supabase.from('categories').update({ active: !currentActive }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    
    qc.invalidateQueries({ queryKey: ['admin-categories'] });
    qc.invalidateQueries({ queryKey: ['categories'] });
    toast.success(!currentActive ? 'Categoria ativada' : 'Categoria desativada');
  };

  const moveOrder = async (id: string, direction: -1 | 1) => {
    if (!categories) return;
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    // Get ordered list regardless of active filter to ensure we don't mess up gaps
    const allOrdered = [...categories].sort((a, b) => a.display_order - b.display_order);
    const currentIndex = allOrdered.findIndex(c => c.id === id);
    
    if (currentIndex === -1) return;
    if (direction === -1 && currentIndex === 0) return; // Already top
    if (direction === 1 && currentIndex === allOrdered.length - 1) return; // Already bottom

    const swapIndex = currentIndex + direction;
    const swapCat = allOrdered[swapIndex];

    const currentOrder = cat.display_order;
    const targetOrder = swapCat.display_order;

    // Fast optimistic UI not requested, doing safe mutation
    if (!hasSupabaseConfig) {
      const { mockDB } = await import('@pagmenos/utils');
      const db = mockDB.get();
      const c1 = db.categories.find((x: any) => x.id === cat.id);
      const c2 = db.categories.find((x: any) => x.id === swapCat.id);
      if (c1 && c2) {
        c1.display_order = targetOrder;
        c2.display_order = currentOrder;
      }
      mockDB.save(db);
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Ordem atualizada');
      return;
    }

    // In a real environment, prefer an RPC to avoid race conditions. 
    // Here we do two updates.
    // To avoid unique constraint violations (if display_order is unique), 
    // we can use a temporary order or let the DB handle it if not unique.
    try {
      const { error: e1 } = await supabase.from('categories').update({ display_order: targetOrder }).eq('id', cat.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from('categories').update({ display_order: currentOrder }).eq('id', swapCat.id);
      if (e2) throw e2;
      
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Ordem atualizada');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao reordenar');
    }
  };

  const initiateDelete = (id: string) => {
    setDeletingId(id);
    setReassignTarget('');
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    
    const catProducts = products?.filter((p: any) => p.category_id === deletingId) || [];
    if (catProducts.length > 0 && !reassignTarget) {
      toast.error('Escolha uma categoria para mover os produtos.');
      return;
    }

    setSaving(true);
    try {
      if (!hasSupabaseConfig) {
        const { mockDB } = await import('@pagmenos/utils');
        const db = mockDB.get();
        if (catProducts.length > 0 && reassignTarget) {
          db.products.forEach((p: any) => {
            if (p.category_id === deletingId) p.category_id = reassignTarget;
          });
        }
        db.categories = db.categories.filter((c: any) => c.id !== deletingId);
        mockDB.save(db);
      } else {
        if (catProducts.length > 0 && reassignTarget) {
          const { error: updateErr } = await supabase.from('products').update({ category_id: reassignTarget }).eq('category_id', deletingId);
          if (updateErr) throw updateErr;
        }
        const { error: delErr } = await supabase.from('categories').delete().eq('id', deletingId);
        if (delErr) throw delErr;
      }

      toast.success('Categoria excluída com sucesso!');
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      close();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir categoria');
    }
    setSaving(false);
  };

  const IC = "w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface";

  if (deletingId) {
    const catToDelete = categories?.find(c => c.id === deletingId);
    const catProducts = products?.filter((p: any) => p.category_id === deletingId) || [];
    const otherCategories = categories?.filter(c => c.id !== deletingId) || [];

    return (
      <div className="max-w-lg mx-auto bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-xl font-bold text-text mb-2">Excluir categoria "{catToDelete?.name}"?</h2>
        <p className="text-sm text-text-secondary mb-6">Esta ação não poderá ser desfeita.</p>
        
        {catProducts.length > 0 && (
          <div className="mb-6 p-4 bg-brand-50/50 border border-brand-100 rounded-xl">
            <p className="text-sm font-medium text-brand-800 mb-2">Esta categoria possui {catProducts.length} produtos.</p>
            <p className="text-xs text-brand-600 mb-3">Escolha para qual categoria esses produtos serão movidos:</p>
            <select value={reassignTarget} onChange={e => setReassignTarget(e.target.value)} className={IC}>
              <option value="">Selecione a categoria de destino...</option>
              {otherCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button onClick={close} className="px-6 py-3 border border-border rounded-xl text-text-secondary font-medium hover:bg-background transition-colors w-full sm:w-auto">
            Cancelar
          </button>
          <button onClick={confirmDelete} disabled={saving || (catProducts.length > 0 && !reassignTarget)} className="flex items-center justify-center gap-2 bg-danger text-white px-6 py-3 rounded-xl font-semibold hover:bg-danger/90 disabled:opacity-60 transition-colors w-full sm:w-auto">
            {saving ? 'Excluindo...' : 'Excluir categoria'}
          </button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text">{editing === 'new' ? 'Nova Categoria' : 'Editar Categoria'}</h1>
          <button onClick={close} className="text-text-secondary hover:text-text"><X size={24} /></button>
        </div>
        <div className="max-w-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Nome *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} className={IC} placeholder="Ex: Vitaminas e Suplementos" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Ícone</label>
            <input type="text" value={form.icon_key} onChange={(e) => setForm({ ...form, icon_key: e.target.value })} className={IC} placeholder="pill, thermometer, etc." />
            <p className="text-xs text-text-muted mt-1">Chave do ícone (pill, tablets, shield, thermometer, activity, apple, etc.)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Ordem de exibição</label>
            <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className={IC} min={0} />
          </div>
          <label className="flex items-center justify-between p-3 border border-border rounded-xl bg-surface cursor-pointer mt-4">
            <div>
              <span className="block text-sm font-medium text-text">Visível na navegação</span>
              <span className="block text-xs text-text-muted">Desativar oculta do menu, não exclui produtos</span>
            </div>
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-5 h-5 accent-brand-500" />
          </label>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button onClick={handleSave} disabled={saving} className="flex items-center justify-center gap-2 bg-brand-500 text-white px-6 py-3.5 sm:py-3 rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-60 transition-colors">
              {saving ? 'Salvando...' : <><Check size={18} /> Salvar Categoria</>}
            </button>
            <button onClick={close} className="px-6 py-3.5 sm:py-3 border border-border rounded-xl text-text-secondary font-medium hover:bg-background transition-colors text-center">Cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-text">Categorias</h1>
        <button onClick={openNew} className="flex items-center justify-center gap-2 bg-brand-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-brand-600 transition-colors text-sm w-full sm:w-auto">
          <Plus size={18} /> Nova categoria
        </button>
      </div>

      <div className="flex gap-2 border-b border-border mb-6">
        {[
          { id: 'all', label: 'Todas' },
          { id: 'active', label: 'Ativas' },
          { id: 'inactive', label: 'Inativas' },
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

      {/* Mobile Layout */}
      <div className="grid grid-cols-1 md:hidden gap-3 mb-6">
        {sorted.map((c: any) => (
          <div key={c.id} className={`bg-surface border ${c.active ? 'border-border' : 'border-dashed border-border opacity-70'} rounded-xl p-4 flex flex-col gap-3`}>
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-semibold text-text">{c.name}</p>
                <p className="text-xs text-text-muted mt-0.5">Ordem: {c.display_order}</p>
              </div>
              {!c.active && (
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-surface-hover text-text-muted rounded">Inativa</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1 pt-3 border-t border-border">
              <button onClick={() => openEdit(c)} className="flex items-center justify-center gap-1.5 py-2 px-3 border border-border rounded-lg text-sm font-medium text-text-secondary active:bg-surface-hover">
                <Pencil size={14} /> Editar
              </button>
              <button onClick={() => toggleActive(c.id, c.active)} className="flex items-center justify-center gap-1.5 py-2 px-3 border border-border rounded-lg text-sm font-medium text-text-secondary active:bg-surface-hover">
                {c.active ? <><EyeOff size={14} /> Ocultar</> : <><Eye size={14} /> Mostrar</>}
              </button>
              <div className="flex gap-1 border border-border rounded-lg overflow-hidden">
                <button onClick={() => moveOrder(c.id, -1)} className="flex-1 flex items-center justify-center py-2 bg-surface hover:bg-surface-hover active:bg-surface-hover border-r border-border text-text-secondary">
                  <ArrowUp size={16} />
                </button>
                <button onClick={() => moveOrder(c.id, 1)} className="flex-1 flex items-center justify-center py-2 bg-surface hover:bg-surface-hover active:bg-surface-hover text-text-secondary">
                  <ArrowDown size={16} />
                </button>
              </div>
              <button onClick={() => initiateDelete(c.id)} className="flex items-center justify-center gap-1.5 py-2 px-3 border border-danger/20 rounded-lg text-sm font-medium text-danger hover:bg-danger/5 active:bg-danger/10">
                <Trash2 size={14} /> Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-hover text-text-secondary border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium w-32">Reordenar</th>
                <th className="px-4 py-3 font-medium w-16">Ordem</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((c: any) => (
                <tr key={c.id} className={`hover:bg-background transition-colors ${!c.active ? 'opacity-70' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveOrder(c.id, -1)} className="p-1.5 text-text-secondary hover:text-brand-600 hover:bg-brand-50 rounded bg-surface border border-border" title="Mover para cima">
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => moveOrder(c.id, 1)} className="p-1.5 text-text-secondary hover:text-brand-600 hover:bg-brand-50 rounded bg-surface border border-border" title="Mover para baixo">
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-muted font-mono">{c.display_order}</td>
                  <td className="px-4 py-3 font-medium text-text">{c.name}</td>
                  <td className="px-4 py-3">
                    {c.active ? (
                      <span className="inline-flex items-center gap-1 text-success text-xs font-medium bg-success-light px-2.5 py-1 rounded-full"><Eye size={12} /> Ativa</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-text-muted text-xs font-medium bg-surface-hover px-2.5 py-1 rounded-full"><EyeOff size={12} /> Inativa</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleActive(c.id, c.active)} className="p-1.5 text-text-secondary hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title={c.active ? 'Ocultar' : 'Reativar'}>
                        {c.active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => openEdit(c)} className="p-1.5 text-text-secondary hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => initiateDelete(c.id)} className="p-1.5 text-danger hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sorted.length === 0 && !isLoading && (
        <div className="p-8 text-center text-text-secondary bg-surface border border-border rounded-2xl md:mt-0 mt-4">
          Nenhuma categoria encontrada.
        </div>
      )}
    </div>
  );
}
