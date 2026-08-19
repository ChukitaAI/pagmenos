import { Link } from 'react-router-dom';
import { useAdminProducts, useAdminCategories } from '@/hooks/adminQueries';
import { Package, Eye, EyeOff, Tag, Grid3X3 } from 'lucide-react';

export default function DashboardPage() {
  const { data: products, isLoading: prodLoading } = useAdminProducts();
  const { data: categories, isLoading: catLoading } = useAdminCategories();

  const totalProducts = products?.length || 0;
  const visibleProducts = products?.filter((p: any) => p.active).length || 0;
  const hiddenProducts = products?.filter((p: any) => !p.active).length || 0;
  const outOfStock = products?.filter((p: any) => p.active && p.stock_status === 'out_of_stock').length || 0;
  const offersCount = products?.filter((p: any) => p.promotional_price_cents != null && p.promotional_price_cents > 0).length || 0;
  const totalCategories = categories?.length || 0;
  const activeCategories = categories?.filter((c: any) => c.active).length || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total de Produtos" value={prodLoading ? '—' : String(totalProducts)} sub={`${visibleProducts} visíveis`} />
        <StatCard label="Ocultos" value={prodLoading ? '—' : String(hiddenProducts)} color="text-text-muted" sub="inativos" />
        <StatCard label="Em Oferta" value={prodLoading ? '—' : String(offersCount)} color="text-brand-500" sub="com promoção" />
        <StatCard label="Esgotados" value={prodLoading ? '—' : String(outOfStock)} color="text-danger" sub="sem estoque" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <StatCard label="Categorias (total)" value={catLoading ? '—' : String(totalCategories)} sub={`${activeCategories} ativas`} />
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold text-text mb-4">Acesso rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/admin/produtos" className="flex flex-col items-center gap-2 p-4 border border-border rounded-xl hover:border-brand-500 hover:bg-brand-50/30 transition-colors text-center">
            <Package size={24} className="text-brand-500" />
            <span className="text-sm font-medium text-text">Produtos</span>
            <span className="text-xs text-text-muted">{prodLoading ? '…' : `${totalProducts} total`}</span>
          </Link>
          <Link to="/admin/categorias" className="flex flex-col items-center gap-2 p-4 border border-border rounded-xl hover:border-brand-500 hover:bg-brand-50/30 transition-colors text-center">
            <Grid3X3 size={24} className="text-brand-500" />
            <span className="text-sm font-medium text-text">Categorias</span>
            <span className="text-xs text-text-muted">{catLoading ? '…' : `${totalCategories} total`}</span>
          </Link>
          <Link to="/admin/ofertas" className="flex flex-col items-center gap-2 p-4 border border-border rounded-xl hover:border-brand-500 hover:bg-brand-50/30 transition-colors text-center">
            <Tag size={24} className="text-brand-500" />
            <span className="text-sm font-medium text-text">Ofertas</span>
            <span className="text-xs text-text-muted">{prodLoading ? '…' : `${offersCount} ativas`}</span>
          </Link>
          <Link to="/admin/produtos" className="flex flex-col items-center gap-2 p-4 border border-danger/20 rounded-xl hover:border-danger hover:bg-danger/5 transition-colors text-center">
            <EyeOff size={24} className="text-danger" />
            <span className="text-sm font-medium text-text">Ocultos</span>
            <span className="text-xs text-danger">{prodLoading ? '…' : `${hiddenProducts} produtos`}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-text', sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <p className="text-sm font-medium text-text-secondary mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  );
}
