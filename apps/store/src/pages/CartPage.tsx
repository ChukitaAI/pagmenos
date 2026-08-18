import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/stores/cart';
import { useProducts, useProductPromotions } from '@/hooks/queries';
import { formatBRL } from '@pagmenos/utils';
import ProductImage from '@/components/ProductImage';

export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCartStore();
  const productIds = items.map((i) => i.productId);
  const { data: products } = useProducts();
  const { data: promos } = useProductPromotions(productIds);

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <ShoppingBag size={56} className="mx-auto text-text-muted mb-4" />
        <h1 className="text-xl font-bold text-text mb-2">Seu carrinho está vazio</h1>
        <p className="text-sm text-text-secondary mb-6">Encontre o que precisa na nossa loja.</p>
        <Link to="/" className="inline-flex bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors">
          Explorar produtos
        </Link>
      </div>
    );
  }

  const cartProducts = items.map((item) => {
    const product = products?.find((p) => p.id === item.productId);
    const promo = promos?.[item.productId];
    const effectivePrice = promo?.effectivePrice ?? product?.base_price_cents ?? 0;
    return { ...item, product, effectivePrice };
  }).filter((item) => item.product);

  const subtotal = cartProducts.reduce((sum, item) => sum + item.effectivePrice * item.quantity, 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <h1 className="text-xl font-bold text-text mb-4">Seu carrinho</h1>

      <div className="space-y-3 mb-6">
        {cartProducts.map((item) => (
          <div key={item.productId} className="flex gap-3 bg-surface border border-border rounded-xl p-3">
            <div className="w-16 h-16 rounded-xl bg-white border border-border/50 flex items-center justify-center shrink-0 p-1 mix-blend-multiply">
              <ProductImage src={item.product?.image_url} alt={item.product?.name || 'Produto'} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-text line-clamp-2 leading-tight mb-1">{item.product?.name}</h3>
              <span className="text-xs text-text-muted">{formatBRL(item.effectivePrice)} cada</span>
              <div className="flex items-center justify-between mt-1">
                <div className={`flex items-center border border-border rounded-lg overflow-hidden ${item.product?.stock_status === 'out_of_stock' ? 'opacity-50 pointer-events-none' : ''}`}>
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} disabled={item.product?.stock_status === 'out_of_stock'} className="px-2.5 py-1.5 text-text-secondary hover:bg-background touch-target" aria-label="Diminuir"><Minus size={14} /></button>
                  <span className="px-3 py-1.5 text-sm font-medium min-w-[32px] text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.product?.stock_status === 'out_of_stock'} className="px-2.5 py-1.5 text-text-secondary hover:bg-background touch-target" aria-label="Aumentar"><Plus size={14} /></button>
                </div>
                <span className="text-sm font-bold text-brand-600">{formatBRL(item.effectivePrice * item.quantity)}</span>
              </div>
            </div>
            <button onClick={() => removeItem(item.productId)} className="text-text-muted hover:text-danger self-start touch-target" aria-label={`Remover ${item.product?.name}`}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Subtotal */}
      <div className="border-t border-border pt-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-text">Subtotal</span>
          <span className="text-lg font-bold text-text">{formatBRL(subtotal)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link to="/checkout" className="flex items-center justify-center w-full bg-brand-500 text-white py-3.5 rounded-xl font-semibold hover:bg-brand-600 transition-colors touch-target">
          Continuar pedido
        </Link>
        <Link to="/" className="flex items-center justify-center w-full border border-border text-text-secondary py-3 rounded-xl font-medium hover:bg-background transition-colors touch-target">
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}
