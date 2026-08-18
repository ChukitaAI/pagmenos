import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCategoryBySlug, useProducts, useProductPromotions } from '@/hooks/queries';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/Skeletons';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: category, isLoading: catLoading } = useCategoryBySlug(slug || '');
  const { data: products, isLoading: prodLoading } = useProducts({ categoryId: category?.id });
  const productIds = products?.map((p) => p.id) || [];
  const { data: promos } = useProductPromotions(productIds);

  const isLoading = catLoading || prodLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/" className="text-text-secondary hover:text-text touch-target flex items-center justify-center" aria-label="Voltar">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-xl font-bold text-text">{category?.name || 'Categoria'}</h1>
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={6} />
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} effectivePrice={promos?.[p.id]?.effectivePrice ?? undefined} promotionName={promos?.[p.id]?.name} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-text-secondary">
          <p>Nenhum produto nesta categoria.</p>
        </div>
      )}
    </div>
  );
}
