import { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProducts, useCategories, useBanners, useProductPromotions } from '@/hooks/queries';
import ProductCard from '@/components/ProductCard';
import SectionHeader from '@/components/SectionHeader';
import { ProductGridSkeleton } from '@/components/Skeletons';
import { Search, MapPin, ShoppingBag, Percent, Pill, Tablets, Shield, Thermometer, Activity, Apple, ShowerHead, Smile, Baby, BriefcaseMedical, Sparkles, ChevronLeft, ChevronRight, X, Package } from 'lucide-react';

export default function HomePage() {
  const { data: products, isLoading: productsLoading, error: productsError } = useProducts({ limit: 100 });
  const { data: categories } = useCategories();
  const { data: banners } = useBanners();
  const productIds = products?.map((p) => p.id) || [];
  const { data: promos } = useProductPromotions(productIds);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategorySlug = searchParams.get('categoria');

  const categoryContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Scroll checking logic for category rail
  const checkScroll = () => {
    if (categoryContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryContainerRef.current) {
      const { clientWidth } = categoryContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      categoryContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleCategorySelect = (slug: string) => {
    if (selectedCategorySlug === slug) {
      searchParams.delete('categoria');
    } else {
      searchParams.set('categoria', slug);
    }
    setSearchParams(searchParams);
    
    // Smooth scroll to results
    setTimeout(() => {
      document.getElementById('product-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const clearCategory = () => {
    searchParams.delete('categoria');
    setSearchParams(searchParams);
  };

  const featured = products?.filter((p) => p.featured) || [];
  const offers = products?.filter((p) => promos?.[p.id]) || [];

  const filteredProducts = selectedCategorySlug 
    ? products?.filter(p => categories?.find(c => c.id === p.category_id)?.slug === selectedCategorySlug)
    : null;

  const isDemo = import.meta.env.DEV || !(Boolean(import.meta.env.VITE_SUPABASE_URL) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY));

  return (
    <div className="pb-8">
      {/* Search Header for Mobile only (desktop has it in navbar) */}
      <div className="md:hidden px-4 py-3 bg-white">
        <Link to="/buscar" className="flex items-center bg-surface border border-border rounded-xl p-2.5 text-text-secondary hover:border-brand-300 transition-colors">
          <Search size={18} className="mr-2 text-brand-400" />
          <span className="text-sm">Buscar medicamentos ou produtos...</span>
        </Link>
      </div>

      {/* Premium Hero (Compact) */}
      <section className="relative bg-brand-500 text-white overflow-hidden pb-10 pt-8 md:pt-12 md:pb-14 rounded-b-[1.5rem] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/50 to-transparent"></div>
        <svg className="absolute right-[-5%] top-0 w-2/3 h-full opacity-10 text-white" viewBox="0 0 200 200" fill="currentColor" aria-hidden="true">
          <circle cx="160" cy="40" r="80" /><circle cx="180" cy="160" r="60" /><circle cx="100" cy="120" r="40" />
        </svg>

        <div className="relative max-w-5xl mx-auto px-4 z-10 text-center md:text-left md:flex md:items-center md:justify-between">
          <div className="md:max-w-md">
            <h1 className="text-2xl md:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
              Cuidado e economia <br className="hidden md:block" /> pertinho de você.
            </h1>
            <p className="text-brand-50 text-sm mb-6 font-medium">
              Encontre seus produtos e finalize seu pedido pelo WhatsApp.
            </p>
            
            <button onClick={() => document.getElementById('ofertas-section')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center justify-center bg-white text-brand-600 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-brand-50 hover:shadow-lg transition-all">
              Ver ofertas
            </button>
          </div>
          
          <div className="hidden md:flex justify-end items-center opacity-80">
            {/* Subtle illustration */}
            <div className="relative w-48 h-48 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Package size={64} className="text-white/80" />
              <div className="absolute top-4 right-4 bg-danger text-white rounded-full p-2"><Percent size={20} /></div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 space-y-10 mt-10 relative z-20">
        
        {isDemo && import.meta.env.DEV && (
          <script>{`console.info("[Pagmenos] Running with local catalog")`}</script>
        )}

        {/* Categories Rail */}
        {categories && categories.length > 0 && (
          <section aria-label="Categorias">
            <SectionHeader 
              title="Compre por categoria" 
              actionLabel={selectedCategorySlug ? "Mostrar menos" : "Todas as categorias ›"}
              onAction={clearCategory}
            />
            
            <div className="relative group">
              {/* Fade Edge Left */}
              <div className={`hidden md:block absolute left-0 top-0 bottom-4 w-10 bg-gradient-to-r from-background to-transparent pointer-events-none z-20 transition-opacity duration-200 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`} />

              {/* Desktop Scroll Arrow Left */}
              <button 
                onClick={() => scrollCategories('left')}
                disabled={!canScrollLeft}
                className={`hidden md:flex absolute left-2 top-1/2 -translate-y-[calc(50%+8px)] w-[34px] h-[34px] items-center justify-center bg-white/95 border border-border/60 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] z-30 text-brand-600 transition-all duration-150 hover:scale-105 ${canScrollLeft ? 'opacity-0 group-hover:opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                aria-label="Mostrar categorias anteriores"
              >
                <ChevronLeft size={20} className="mr-0.5" />
              </button>

              <div 
                ref={categoryContainerRef}
                onScroll={checkScroll}
                className="flex gap-3 overflow-x-auto pb-4 scrollbar-none snap-x px-1 cursor-grab active:cursor-grabbing scroll-smooth relative z-10"
              >
                {categories.map((cat) => {
                  const IconComponent = cat.icon_key === 'pill' ? Pill : cat.icon_key === 'tablets' ? Tablets : cat.icon_key === 'shield' ? Shield : cat.icon_key === 'thermometer' ? Thermometer : cat.icon_key === 'activity' ? Activity : cat.icon_key === 'apple' ? Apple : cat.icon_key === 'shower-head' ? ShowerHead : cat.icon_key === 'smile' ? Smile : cat.icon_key === 'baby' ? Baby : cat.icon_key === 'briefcase-medical' ? BriefcaseMedical : cat.icon_key === 'sparkles' ? Sparkles : ShoppingBag;
                  const isSelected = selectedCategorySlug === cat.slug;
                  
                  return (
                    <button 
                      key={cat.id} 
                      onClick={() => handleCategorySelect(cat.slug)}
                      className={`snap-start flex items-center gap-2 px-4 py-2.5 border shadow-sm rounded-xl whitespace-nowrap transition-all flex-shrink-0 touch-target ${
                        isSelected 
                          ? 'bg-brand-500 border-brand-500 text-white shadow-md' 
                          : 'bg-surface border-border text-text hover:bg-brand-50 hover:border-brand-200'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-600'
                      }`}>
                        <IconComponent size={16} />
                      </div>
                      <span className="text-sm font-semibold">{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Fade Edge Right */}
              <div className={`hidden md:block absolute right-0 top-0 bottom-4 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none z-20 transition-opacity duration-200 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`} />

              {/* Desktop Scroll Arrow Right */}
              <button 
                onClick={() => scrollCategories('right')}
                disabled={!canScrollRight}
                className={`hidden md:flex absolute right-2 top-1/2 -translate-y-[calc(50%+8px)] w-[34px] h-[34px] items-center justify-center bg-white/95 border border-border/60 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] z-30 text-brand-600 transition-all duration-150 hover:scale-105 ${canScrollRight ? 'opacity-0 group-hover:opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                aria-label="Mostrar próximas categorias"
              >
                <ChevronRight size={20} className="ml-0.5" />
              </button>
            </div>
          </section>
        )}

        {/* Filtered Results State */}
        {selectedCategorySlug && filteredProducts ? (
          <section id="product-results" className="scroll-mt-24 min-h-[40vh]">
            <SectionHeader 
              title={categories?.find(c => c.slug === selectedCategorySlug)?.name || 'Resultados'} 
              actionLabel="Mostrar todos"
              onAction={clearCategory}
            />
            <p className="text-sm text-text-secondary mb-4 px-1">{filteredProducts.length} produto{filteredProducts.length !== 1 && 's'}</p>
            
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 px-1">
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} effectivePrice={promos?.[p.id]?.effectivePrice ?? undefined} promotionName={promos?.[p.id]?.name} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-surface rounded-2xl border border-border">
                <Package size={48} className="mx-auto text-text-muted mb-3" />
                <h3 className="text-lg font-medium text-text">Nenhum produto encontrado</h3>
                <p className="text-sm text-text-secondary">Não há produtos nesta categoria no momento.</p>
              </div>
            )}
          </section>
        ) : (
          /* Normal Home State */
          <>
            {/* Offers Section */}
            {offers.length > 0 && (
              <section id="ofertas-section" aria-label="Ofertas">
                <SectionHeader 
                  title="Ofertas" 
                  icon={Percent}
                  iconBgColor="bg-danger"
                  iconTextColor="text-white"
                  actionLabel="Ver todas ›"
                  actionLink="/ofertas"
                />
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x px-1">
                  {offers.slice(0, 6).map((p) => (
                    <div key={p.id} className="snap-start w-[160px] md:w-[220px] shrink-0">
                      <ProductCard product={p} effectivePrice={promos?.[p.id]?.effectivePrice ?? undefined} promotionName={promos?.[p.id]?.name} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Featured Grid */}
            <section aria-label="Destaques">
              <SectionHeader 
                title="Destaques" 
                icon={ShoppingBag}
              />
              {productsLoading ? (
                <ProductGridSkeleton count={8} />
              ) : featured.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 px-1">
                  {featured.slice(0, 10).map((p) => (
                    <ProductCard key={p.id} product={p} effectivePrice={promos?.[p.id]?.effectivePrice ?? undefined} promotionName={promos?.[p.id]?.name} />
                  ))}
                </div>
              ) : null}
            </section>

            {/* Higiene Pessoal */}
            {products && products.some(p => p.category_id === 'c7') && (
              <section aria-label="Higiene Pessoal" className="mt-8 pb-4">
                <SectionHeader 
                  title="Higiene Pessoal" 
                  icon={ShowerHead}
                  actionLabel="Ver todos ›"
                  onAction={() => handleCategorySelect('higiene-pessoal')}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 px-1">
                  {products.filter(p => p.category_id === 'c7').slice(0, 5).map((p) => (
                    <ProductCard key={p.id} product={p} effectivePrice={promos?.[p.id]?.effectivePrice ?? undefined} promotionName={promos?.[p.id]?.name} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
