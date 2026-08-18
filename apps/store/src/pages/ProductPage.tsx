import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useProduct, useProductPromotions, useCategories } from '@/hooks/queries';
import { useCartStore } from '@/stores/cart';
import { formatBRL } from '@pagmenos/utils';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import ProductImage from '@/components/ProductImage';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || '');
  const { data: promos } = useProductPromotions(product ? [product.id] : []);
  const { data: categories } = useCategories();
  const addItem = useCartStore((s) => s.addItem);
  const getQuantity = useCartStore((s) => s.getItemQuantity);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const [qty, setQty] = useState(1);

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          <div className="w-full md:w-[45%] shrink-0">
            <div className="aspect-square skeleton rounded-3xl" />
          </div>
          <div className="w-full md:w-[55%] flex flex-col pt-4">
            <div className="h-10 skeleton w-3/4 mb-4" />
            <div className="h-6 skeleton w-1/3 mb-6" />
            <div className="h-12 skeleton w-1/4 mb-8" />
            <div className="h-14 skeleton w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-medium text-text mb-2">Produto não encontrado</p>
        <Link to="/" className="text-brand-600 hover:text-brand-700 text-sm">Voltar ao início</Link>
      </div>
    );
  }

  const category = categories?.find(c => c.id === product.category_id);
  const isOutOfStock = product.stock_status === 'out_of_stock';
  const promo = promos?.[product.id];
  const effectivePrice = promo?.effectivePrice ?? product.base_price_cents;
  const hasPromo = effectivePrice < product.base_price_cents;
  const isPrescription = product.sale_type === 'prescription' || product.sale_type === 'controlled';

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const currentQty = getQuantity(product.id);
    if (currentQty > 0) {
      updateQuantity(product.id, currentQty + qty);
    } else {
      addItem(product.id);
      if (qty > 1) updateQuantity(product.id, qty);
    }
    toast.success('Produto adicionado ao carrinho');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12 pt-4">
      {/* Back button */}
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm font-semibold touch-target" aria-label="Voltar">
          <ArrowLeft size={18} /> Voltar
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Product image (45-50% on desktop) */}
        <div className="w-full md:w-[45%] lg:w-[48%] shrink-0">
          <div className={`aspect-square bg-white rounded-3xl border border-border flex items-center justify-center p-8 shadow-sm ${isOutOfStock ? 'grayscale-[40%]' : ''}`}>
            <ProductImage src={product.image_url} alt={product.name} priority={true} className="max-w-full max-h-[400px] hover:scale-[1.02] transition-transform duration-500" />
          </div>
        </div>

        {/* Product info (50-55% on desktop) */}
        <div className="w-full md:w-[55%] lg:w-[52%] flex flex-col pt-2 md:pt-4">
          <h1 className="text-2xl md:text-3xl font-bold text-text leading-tight mb-2">{product.name}</h1>
          {product.brand && <p className="text-base text-text-secondary mb-4">{product.brand}</p>}

          {/* Prescription notice */}
          {isPrescription && (
            <div className="flex items-start gap-2 bg-warning-light border border-warning/20 rounded-xl p-3 mb-4">
              <AlertTriangle size={18} className="text-warning mt-0.5 shrink-0" />
              <p className="text-sm text-warning leading-relaxed">
                Medicamento sob prescrição. A confirmação da dispensação será realizada diretamente pela farmácia.
              </p>
            </div>
          )}

          {/* Price */}
          <div className="mb-6">
            {hasPromo ? (
              <div className="flex flex-col">
                <span className="text-base price-old text-text-muted">De {formatBRL(product.base_price_cents)}</span>
                <span className="text-3xl md:text-4xl font-extrabold text-brand-600 tracking-tight">{formatBRL(effectivePrice)}</span>
              </div>
            ) : (
              <span className="text-3xl md:text-4xl font-extrabold text-text tracking-tight">{formatBRL(effectivePrice)}</span>
            )}
          </div>

          {/* Stock status */}
          <div className="mb-6 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-danger' : 'bg-success'}`}></div>
            <span className={`text-sm font-semibold ${isOutOfStock ? 'text-danger' : 'text-success'}`}>
              {isOutOfStock ? 'Esgotado' : 'Disponível'}
            </span>
          </div>

          {/* Actions Container */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {/* Quantity selector */}
            {!isOutOfStock && (
              <div className="flex flex-col gap-1.5 shrink-0">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Quantidade</span>
                <div className="flex items-center border border-border bg-surface rounded-xl overflow-hidden h-12 shadow-sm">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 h-full flex items-center justify-center text-text-secondary hover:bg-background hover:text-brand-600 transition-colors touch-target" aria-label="Diminuir quantidade"><Minus size={18} /></button>
                  <span className="w-12 text-base font-bold text-center">{qty}</span>
                  <button onClick={() => setQty(Math.min(99, qty + 1))} className="px-4 h-full flex items-center justify-center text-text-secondary hover:bg-background hover:text-brand-600 transition-colors touch-target" aria-label="Aumentar quantidade"><Plus size={18} /></button>
                </div>
              </div>
            )}

            {/* Add to cart button */}
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="text-xs font-medium text-transparent uppercase tracking-wider hidden sm:block">Ação</span>
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full h-12 flex items-center justify-center gap-2 rounded-xl font-bold transition-all touch-target text-base shadow-sm ${
                  isOutOfStock ? 'bg-background text-text-muted border border-border cursor-not-allowed' : 'bg-brand-500 text-white hover:bg-brand-600 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                {isOutOfStock ? 'Indisponível' : (<><ShoppingCart size={20} /> Adicionar ao carrinho</>)}
              </button>
            </div>
          </div>

          {category && (
            <div className="mb-6 pt-4 border-t border-border">
              <span className="text-sm text-text-secondary block mb-1">Categoria</span>
              <span className="text-base font-medium text-text">{category.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Product details (Description below image/actions) */}
      {(product.description || product.active_ingredient || product.presentation || product.manufacturer) && (
        <div className="mt-12 md:mt-16 border-t border-border pt-8 md:pt-10">
          <h2 className="text-xl md:text-2xl font-bold text-text mb-6">Informações do produto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm">
            {product.description && (
              <div className="md:col-span-2">
                <h3 className="text-text-secondary font-medium mb-1.5 uppercase tracking-wide text-[11px]">Descrição</h3>
                <p className="text-text text-base leading-relaxed">{product.description}</p>
              </div>
            )}
            {product.active_ingredient && (
              <div>
                <h3 className="text-text-secondary font-medium mb-1.5 uppercase tracking-wide text-[11px]">Princípio ativo</h3>
                <p className="text-text text-base">{product.active_ingredient}</p>
              </div>
            )}
            {product.presentation && (
              <div>
                <h3 className="text-text-secondary font-medium mb-1.5 uppercase tracking-wide text-[11px]">Apresentação</h3>
                <p className="text-text text-base">{product.presentation}</p>
              </div>
            )}
            {product.dosage && (
              <div>
                <h3 className="text-text-secondary font-medium mb-1.5 uppercase tracking-wide text-[11px]">Dosagem</h3>
                <p className="text-text text-base">{product.dosage}</p>
              </div>
            )}
            {product.manufacturer && (
              <div>
                <h3 className="text-text-secondary font-medium mb-1.5 uppercase tracking-wide text-[11px]">Fabricante</h3>
                <p className="text-text text-base">{product.manufacturer}</p>
              </div>
            )}
            {product.anvisa_registration && (
              <div>
                <h3 className="text-text-secondary font-medium mb-1.5 uppercase tracking-wide text-[11px]">Registro Anvisa</h3>
                <p className="text-text text-base">{product.anvisa_registration}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
