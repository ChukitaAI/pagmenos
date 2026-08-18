import { formatBRL } from '@pagmenos/utils';
import type { Product } from '@pagmenos/types';
import { ShoppingCart, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import { useCartStore } from '@/stores/cart';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  effectivePrice?: number;
  promotionName?: string | null;
}

export default function ProductCard({ product, effectivePrice, promotionName }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const isOutOfStock = product.stock_status === 'out_of_stock';
  const hasPromo = effectivePrice !== undefined && effectivePrice < product.base_price_cents;
  const displayPrice = effectivePrice ?? product.base_price_cents;
  const isPrescription = product.sale_type === 'prescription' || product.sale_type === 'controlled';

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(product.id);
    toast.success('Produto adicionado ao carrinho');
  };

  return (
    <Link
      to={`/produto/${product.slug}`}
      title={product.name}
      className={`group flex flex-col h-full bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all duration-200 ${isOutOfStock ? 'opacity-75' : ''}`}
    >
      {/* Image */}
      <div className={`relative shrink-0 h-[125px] md:h-[160px] bg-white flex items-center justify-center p-3 border-b border-border/50 ${isOutOfStock ? 'grayscale-[40%]' : ''}`}>
        {hasPromo && !isPrescription && !isOutOfStock && (
          <span className="absolute top-2 left-2 bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
            OFERTA
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute top-2 left-2 bg-text-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
            ESGOTADO
          </span>
        )}
        <div className="w-full h-full mix-blend-multiply transition-transform duration-300 group-hover:scale-105">
          <ProductImage src={product.image_url} alt={product.name} />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3">
        <h3 className="text-sm font-medium text-text leading-tight line-clamp-2 min-h-[2.5rem] mb-1 group-hover:text-brand-600 transition-colors">
          {product.name}
        </h3>
        {product.brand && (
          <p className="text-[11px] text-text-muted mb-2 line-clamp-1">{product.brand}</p>
        )}

        {/* Prescription notice */}
        {isPrescription && (
          <p className="text-[10px] text-warning bg-warning-light px-1.5 py-0.5 rounded mb-2 leading-tight w-fit">
            Sob prescrição
          </p>
        )}

        {/* Price */}
        <div className="mt-auto pt-1">
          <div className="min-h-[42px] flex flex-col justify-end">
            {hasPromo ? (
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] price-old text-text-muted mb-0.5">{formatBRL(product.base_price_cents)}</span>
                <span className="text-base font-bold text-brand-600">{formatBRL(displayPrice)}</span>
              </div>
            ) : (
              <span className="text-base font-bold text-text leading-tight">{formatBRL(displayPrice)}</span>
            )}
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all touch-target whitespace-nowrap ${
              isOutOfStock
                ? 'bg-background text-text-muted cursor-not-allowed'
                : 'bg-brand-500 text-white hover:bg-brand-600 active:scale-[0.97]'
            }`}
            aria-label={isOutOfStock ? 'Produto indisponível' : `Adicionar ${product.name} ao carrinho`}
          >
            {isOutOfStock ? (
              'Esgotado'
            ) : (
              <>
                <ShoppingCart size={16} className="shrink-0" />
                Adicionar
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
