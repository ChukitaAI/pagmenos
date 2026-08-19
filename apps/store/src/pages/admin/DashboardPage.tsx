import { useProducts, useCategories } from '@/hooks/queries';

export default function DashboardPage() {
  const { data: products, isLoading: prodLoading } = useProducts();
  const { data: categories, isLoading: catLoading } = useCategories();

  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter((p: any) => p.active).length || 0;
  const offersCount = products?.filter((p: any) => p.promotional_price_cents != null && p.promotional_price_cents > 0).length || 0;
  const totalCategories = categories?.length || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total de Produtos" value={prodLoading ? '—' : String(totalProducts)} />
        <StatCard label="Produtos Ativos" value={prodLoading ? '—' : String(activeProducts)} color="text-success" />
        <StatCard label="Em Oferta" value={prodLoading ? '—' : String(offersCount)} color="text-brand-500" />
        <StatCard label="Categorias" value={catLoading ? '—' : String(totalCategories)} />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text mb-2">Bem-vindo ao Painel</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Gerencie seus produtos, promoções e configurações da loja. Todas as alterações são refletidas imediatamente no site público.
          </p>
        </div>
        <div className="shrink-0">
          <a href="/produtos" className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors">
            Gerenciar Produtos
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-text' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <p className="text-sm font-medium text-text-secondary mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
