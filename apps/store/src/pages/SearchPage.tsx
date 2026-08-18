import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProductSearch, useProductPromotions } from '@/hooks/queries';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/Skeletons';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [input, setInput] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(input.trim());
      if (input.trim()) {
        setSearchParams({ q: input.trim() }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [input, setSearchParams]);

  const { data: products, isLoading } = useProductSearch(debouncedQuery);
  const productIds = products?.map((p) => p.id) || [];
  const { data: promos } = useProductPromotions(productIds);

  const clearSearch = useCallback(() => { setInput(''); setDebouncedQuery(''); }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Search header */}
      <div className="flex items-center gap-3 mb-4">
        <Link to="/" className="text-text-secondary hover:text-text touch-target flex items-center justify-center" aria-label="Voltar">
          <ArrowLeft size={22} />
        </Link>
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Buscar medicamentos ou produtos..."
            className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            autoFocus
            aria-label="Buscar"
            inputMode="search"
          />
          {input && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text" aria-label="Limpar busca">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {debouncedQuery && (
        <p className="text-sm text-text-secondary mb-4">
          {isLoading ? 'Buscando...' : products?.length ? `Resultados para "${debouncedQuery}"` : ''}
        </p>
      )}

      {isLoading ? (
        <ProductGridSkeleton count={6} />
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} effectivePrice={promos?.[p.id]?.effectivePrice ?? undefined} promotionName={promos?.[p.id]?.name} />
          ))}
        </div>
      ) : debouncedQuery ? (
        <div className="text-center py-16">
          <Search size={48} className="mx-auto text-text-muted mb-4" />
          <p className="text-lg font-medium text-text mb-1">Não encontramos esse produto</p>
          <p className="text-sm text-text-secondary">Tente pesquisar outro nome.</p>
        </div>
      ) : (
        <div className="text-center py-16 text-text-secondary">
          <Search size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">Digite para buscar medicamentos, vitaminas, higiene...</p>
        </div>
      )}
    </div>
  );
}
