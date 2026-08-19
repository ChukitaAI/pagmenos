import { useState, useMemo } from 'react';
import { useCategories } from '@/hooks/queries';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, X, Check, ChevronUp, ChevronDown } from 'lucide-react';

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
  const { data: categories, isLoading } = useCategories();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(() => {
    if (!categories) return [];
    return [...categories].sort((a, b) => a.display_order - b.display_order);
  }, [categories]);

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

  const close = () => setEditing(null);

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
        const db = (await import('@pagmenos/utils')).mockDB.get();
        if (editing === 'new') {
          db.categories.push({ id: 'cat' + Date.now(), ...payload } as any);
        } else {
          const idx = db.categories.findIndex((c: any) => c.id === editing);
          if (idx >= 0) db.categories[idx] = { ...db.categories[idx], ...payload } as any;
        }
        (await import('@pagmenos/utils')).mockDB.save(db);
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
      const db = (await import('@pagmenos/utils')).mockDB.get();
      const c = db.categories.find((x: any) => x.id === id);
      if (c) (c as any).active = !currentActive;
      (await import('@pagmenos/utils')).mockDB.save(db);
    } else {
      await supabase.from('categories').update({ active: !currentActive }).eq('id', id);
    }
    qc.invalidateQueries({ queryKey: ['admin-categories'] });
    qc.invalidateQueries({ queryKey: ['categories'] });
    toast.success(!currentActive ? 'Categoria ativada' : 'Categoria desativada');
  };

  const IC = "w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface";

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
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" /> Ativa
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-60 transition-colors">
              {saving ? 'Salvando...' : <><Check size={18} /> Salvar</>}
            </button>
            <button onClick={close} className="px-6 py-3 border border-border rounded-xl text-text-secondary hover:bg-background transition-colors">Cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Categorias</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-brand-600 transition-colors text-sm">
          <Plus size={18} /> Nova categoria
        </button>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-hover text-text-secondary border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium w-12">Ordem</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Ícone</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((c: any) => (
                <tr key={c.id} className="hover:bg-background transition-colors group">
                  <td className="px-4 py-3 text-text-muted text-center">{c.display_order}</td>
                  <td className="px-4 py-3 font-medium text-text">{c.name}</td>
                  <td className="px-4 py-3 text-text-muted">{c.icon_key || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(c.id, c.active)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${c.active ? 'bg-success-light text-success hover:bg-success/20' : 'bg-surface-hover text-text-muted hover:bg-border'}`}
                    >
                      {c.active ? 'Ativa' : 'Inativa'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-text-secondary hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Editar">
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && !isLoading && (
          <div className="p-8 text-center text-text-secondary">Nenhuma categoria cadastrada.</div>
        )}
      </div>
    </div>
  );
}
