import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, Check, MessageCircle } from 'lucide-react';
import { useCartStore } from '@/stores/cart';
import { useStoreSettings, useProducts, useProductPromotions } from '@/hooks/queries';
import { useStoreAuth } from '@/stores/auth';
import { formatBRL, buildWhatsAppMessage, buildWhatsAppUrl, mockDB } from '@pagmenos/utils';
import { PAYMENT_METHOD_LABELS } from '@pagmenos/types';
import type { PaymentMethod, FulfillmentMethod } from '@pagmenos/types';

type Step = 'delivery' | 'payment' | 'review';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const { data: settings } = useStoreSettings();
  const { data: products } = useProducts();
  const productIds = items.map((i) => i.productId);
  const { data: promos } = useProductPromotions(productIds);

  const [step, setStep] = useState<Step>('delivery');
  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');

  // Address (manual, no API)
  const [addr, setAddr] = useState({ zipCode: '', street: '', number: '', district: '', city: '', state: '', complement: '', reference: '' });

  if (items.length === 0) {
    return (<div className="max-w-lg mx-auto px-4 py-16 text-center"><p className="text-lg font-medium text-text mb-2">Seu carrinho está vazio</p><Link to="/" className="text-brand-600 text-sm">Voltar ao início</Link></div>);
  }

  const cartProducts = items.map((item) => {
    const product = products?.find((p) => p.id === item.productId);
    const promo = promos?.[item.productId];
    const effectivePrice = promo?.effectivePrice ?? product?.base_price_cents ?? 0;
    return { ...item, product, effectivePrice, name: product?.name || '' };
  }).filter((i) => i.product);

  const subtotal = cartProducts.reduce((sum, i) => sum + i.effectivePrice * i.quantity, 0);
  const deliveryFee = fulfillment === 'delivery' ? (settings?.delivery_fee_cents || 0) : 0;
  const total = subtotal + deliveryFee;

  const availablePayments = (['pix', 'cash', 'credit_card', 'debit_card'] as PaymentMethod[]).filter((pm) => {
    const map: Record<string, boolean | undefined> = { pix: settings?.pix_enabled, cash: settings?.cash_enabled, credit_card: settings?.credit_card_enabled, debit_card: settings?.debit_card_enabled };
    return map[pm] !== false;
  });

  const { user } = useStoreAuth();

  const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL) && Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

  const handleFinalize = async () => {
    const whatsappNumber = settings?.whatsapp_number || '558899981853';

    const message = buildWhatsAppMessage({
      fulfillmentMethod: fulfillment,
      address: fulfillment === 'delivery' ? { street: addr.street, number: addr.number, district: addr.district, city: addr.city, state: addr.state, complement: addr.complement || null, reference: addr.reference || null } : null,
      products: cartProducts.map((i) => ({ name: i.name, quantity: i.quantity, effectivePriceCents: i.effectivePrice })),
      paymentMethod,
      deliveryFeeCents: deliveryFee,
    });

    if (!hasSupabaseConfig) {
      if (user && user.id === 'demo-client') {
         const db = mockDB.get();
         db.history.unshift({
           id: 'demo-' + Date.now(),
           date: new Date().toISOString(),
           items: cartProducts.map((i) => ({ name: i.name, quantity: i.quantity, price: i.effectivePrice })),
           total,
         });
         mockDB.save(db);
      }
    } else {
      if (user && user.id !== 'demo-client') {
         const { supabase } = await import('@/lib/supabase');
         const { data: orderData } = await supabase.from('orders').insert({
             user_id: user.id,
             total_cents: total
         }).select('id').single();
         
         if (orderData) {
             await supabase.from('order_items').insert(cartProducts.map(i => ({
                 order_id: orderData.id,
                 product_id: i.productId,
                 product_name: i.name,
                 quantity: i.quantity,
                 unit_price_cents: i.effectivePrice,
                 subtotal_cents: i.effectivePrice * i.quantity
             })));
         }
      }
    }

    const url = buildWhatsAppUrl(whatsappNumber, message);
    clearCart();
    window.location.href = url;
  };

  const InputClass = "w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface";

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => step === 'delivery' ? navigate('/carrinho') : setStep(step === 'review' ? 'payment' : 'delivery')} className="text-text-secondary hover:text-text touch-target" aria-label="Voltar"><ArrowLeft size={22} /></button>
        <h1 className="text-xl font-bold text-text">{step === 'delivery' ? 'Recebimento' : step === 'payment' ? 'Pagamento' : 'Confira seu pedido'}</h1>
      </div>

      {/* Step: Delivery */}
      {step === 'delivery' && (
        <div className="space-y-4">
          <div className="space-y-2">
            {settings?.delivery_enabled !== false && (
              <button onClick={() => setFulfillment('delivery')} className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors touch-target ${fulfillment === 'delivery' ? 'border-brand-500 bg-brand-50' : 'border-border'}`}>
                <MapPin size={20} className={fulfillment === 'delivery' ? 'text-brand-600' : 'text-text-muted'} /><span className="font-medium text-sm">Entrega</span>
              </button>
            )}
            {settings?.pickup_enabled !== false && (
              <button onClick={() => setFulfillment('pickup')} className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors touch-target ${fulfillment === 'pickup' ? 'border-brand-500 bg-brand-50' : 'border-border'}`}>
                <MapPin size={20} className={fulfillment === 'pickup' ? 'text-brand-600' : 'text-text-muted'} /><span className="font-medium text-sm">Retirar na loja</span>
              </button>
            )}
          </div>

          {fulfillment === 'delivery' && (
            <div className="space-y-3">
              <input type="text" placeholder="CEP *" value={addr.zipCode} onChange={(e) => setAddr({ ...addr, zipCode: e.target.value })} className={InputClass} inputMode="numeric" />
              <input type="text" placeholder="Rua *" value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} className={InputClass} />
              <div className="grid grid-cols-3 gap-3">
                <input type="text" placeholder="Número *" value={addr.number} onChange={(e) => setAddr({ ...addr, number: e.target.value })} className={InputClass} />
                <input type="text" placeholder="Bairro *" value={addr.district} onChange={(e) => setAddr({ ...addr, district: e.target.value })} className={`col-span-2 ${InputClass}`} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="text" placeholder="Cidade *" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className={`col-span-2 ${InputClass}`} />
                <input type="text" placeholder="UF *" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value.toUpperCase().slice(0, 2) })} className={InputClass} maxLength={2} />
              </div>
              <input type="text" placeholder="Complemento" value={addr.complement} onChange={(e) => setAddr({ ...addr, complement: e.target.value })} className={InputClass} />
              <input type="text" placeholder="Referência" value={addr.reference} onChange={(e) => setAddr({ ...addr, reference: e.target.value })} className={InputClass} />
            </div>
          )}
          <button onClick={() => setStep('payment')} className="w-full bg-brand-500 text-white py-3.5 rounded-xl font-semibold hover:bg-brand-600 transition-colors touch-target">Continuar</button>
        </div>
      )}

      {/* Step: Payment */}
      {step === 'payment' && (
        <div className="space-y-3">
          {availablePayments.map((pm) => (
            <button key={pm} onClick={() => setPaymentMethod(pm)} className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors touch-target ${paymentMethod === pm ? 'border-brand-500 bg-brand-50' : 'border-border'}`}>
              <CreditCard size={20} className={paymentMethod === pm ? 'text-brand-600' : 'text-text-muted'} />
              <span className="font-medium text-sm">{PAYMENT_METHOD_LABELS[pm]}</span>
              {paymentMethod === pm && <Check size={18} className="ml-auto text-brand-600" />}
            </button>
          ))}
          <button onClick={() => setStep('review')} className="w-full bg-brand-500 text-white py-3.5 rounded-xl font-semibold hover:bg-brand-600 transition-colors touch-target mt-4">Continuar</button>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text-secondary mb-1">Recebimento</h3>
            {fulfillment === 'pickup' ? <p className="text-sm text-text">Retirada na loja</p> : <p className="text-sm text-text">{addr.street}, {addr.number} — {addr.district}, {addr.city} - {addr.state}</p>}
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text-secondary mb-2">Produtos</h3>
            {cartProducts.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm py-1">
                <span className="text-text">{item.quantity}x {item.name}</span>
                <span className="text-text font-medium">{formatBRL(item.effectivePrice * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text-secondary mb-1">Pagamento</h3>
            <p className="text-sm text-text">{PAYMENT_METHOD_LABELS[paymentMethod]}</p>
          </div>
          <div className="border-t border-border pt-4 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-text-secondary">Subtotal</span><span className="text-text">{formatBRL(subtotal)}</span></div>
            {deliveryFee > 0 && <div className="flex justify-between text-sm"><span className="text-text-secondary">Entrega</span><span className="text-text">{formatBRL(deliveryFee)}</span></div>}
            <div className="flex justify-between text-base font-bold pt-1"><span className="text-text">Total</span><span className="text-text">{formatBRL(total)}</span></div>
          </div>
          <button onClick={handleFinalize} className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 rounded-xl font-bold text-base hover:bg-[#20BD5C] transition-colors touch-target">
            <MessageCircle size={22} /> FINALIZAR NO WHATSAPP
          </button>
        </div>
      )}
    </div>
  );
}
