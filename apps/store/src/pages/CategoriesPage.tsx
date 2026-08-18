import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/queries';
import { Package } from 'lucide-react';

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <h1 className="text-xl font-bold text-text mb-4">Categorias</h1>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/categoria/${cat.slug}`} className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4 hover:bg-surface-hover hover:shadow-sm transition-all group">
              <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
                <Package size={22} className="text-brand-600" />
              </div>
              <span className="text-sm font-medium text-text">{cat.name}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-text-secondary"><p>Nenhuma categoria encontrada.</p></div>
      )}
    </div>
  );
}
