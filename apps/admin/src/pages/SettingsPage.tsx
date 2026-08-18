import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { PAYMENT_METHOD_LABELS } from '@pagmenos/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      import('@pagmenos/utils').then(({ mockDB }) => {
        setSettings(mockDB.get().settings);
        setLoading(false);
      });
      return;
    }
    supabase.from('store_settings').select('*').limit(1).single().then(({ data }) => {
      if (data) setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    
    if (!hasSupabaseConfig) {
      const db = (await import('@pagmenos/utils')).mockDB.get();
      db.settings = settings;
      (await import('@pagmenos/utils')).mockDB.save(db);
      toast.success('Configurações salvas (Demo)!');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('store_settings').update(settings).eq('id', settings.id);
    if (error) toast.error('Erro ao salvar.');
    else toast.success('Configurações salvas!');
    setSaving(false);
  };

  const set = (key: string, val: any) => setSettings((s: any) => ({ ...s, [key]: val }));
  const IC = "w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface";

  if (loading) return <div className="p-8 text-center text-text-secondary">Carregando...</div>;
  if (!settings) return <div className="p-8 text-center text-text-secondary">Configure a loja pelo seed SQL.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Configurações da Loja</h1>
      <div className="max-w-xl space-y-6">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text">Informações</h2>
          <div><label className="block text-sm font-medium text-text-secondary mb-1">Nome da loja</label><input type="text" value={settings.store_name} onChange={e => set('store_name', e.target.value)} className={IC} /></div>
          <div><label className="block text-sm font-medium text-text-secondary mb-1">WhatsApp</label><input type="text" value={settings.whatsapp_number} onChange={e => set('whatsapp_number', e.target.value)} className={IC} placeholder="558899981853" /></div>
          <div><label className="block text-sm font-medium text-text-secondary mb-1">Telefone</label><input type="text" value={settings.phone || ''} onChange={e => set('phone', e.target.value)} className={IC} /></div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text">Endereço da loja</h2>
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Rua" value={settings.street || ''} onChange={e => set('street', e.target.value)} className={`col-span-2 ${IC}`} />
            <input placeholder="Nº" value={settings.number || ''} onChange={e => set('number', e.target.value)} className={IC} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Bairro" value={settings.district || ''} onChange={e => set('district', e.target.value)} className={IC} />
            <input placeholder="Cidade" value={settings.city || ''} onChange={e => set('city', e.target.value)} className={IC} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="UF" value={settings.state || ''} onChange={e => set('state', e.target.value)} className={IC} maxLength={2} />
            <input placeholder="CEP" value={settings.zip_code || ''} onChange={e => set('zip_code', e.target.value)} className={`col-span-2 ${IC}`} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text">Pagamentos aceitos</h2>
          {(['pix_enabled', 'cash_enabled', 'credit_card_enabled', 'debit_card_enabled'] as const).map(key => {
            const pm = key.replace('_enabled', '') as keyof typeof PAYMENT_METHOD_LABELS;
            return <label key={key} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={settings[key]} onChange={e => set(key, e.target.checked)} className="rounded" />{PAYMENT_METHOD_LABELS[pm] || pm}</label>;
          })}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text">Entrega</h2>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={settings.delivery_enabled} onChange={e => set('delivery_enabled', e.target.checked)} className="rounded" /> Entrega habilitada</label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={settings.pickup_enabled} onChange={e => set('pickup_enabled', e.target.checked)} className="rounded" /> Retirada na loja habilitada</label>
          <div><label className="block text-sm font-medium text-text-secondary mb-1">Taxa de entrega (R$)</label><input type="text" value={(settings.delivery_fee_cents / 100).toFixed(2)} onChange={e => { const c = Math.round(parseFloat(e.target.value.replace(',', '.')) * 100); if (!isNaN(c)) set('delivery_fee_cents', c); }} className={IC} /></div>
        </section>

        <button onClick={handleSave} disabled={saving} className="bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-60 transition-colors">
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  );
}
