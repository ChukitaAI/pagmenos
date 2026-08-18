// ============================================================================
// Pagmenos — WhatsApp Message Builder
// ============================================================================

import { PAYMENT_METHOD_LABELS } from '@pagmenos/types';
import type { PaymentMethod, FulfillmentMethod } from '@pagmenos/types';
import { formatBRL } from './currency';

export interface WhatsAppMessageProduct {
  name: string;
  quantity: number;
  effectivePriceCents: number;
}

export interface WhatsAppMessageAddress {
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement?: string | null;
  reference?: string | null;
}

export interface WhatsAppMessageParams {
  fulfillmentMethod: FulfillmentMethod;
  address?: WhatsAppMessageAddress | null;
  products: WhatsAppMessageProduct[];
  paymentMethod: PaymentMethod;
  deliveryFeeCents?: number;
}

/**
 * Builds the WhatsApp checkout message.
 *
 * Example:
 * Olá! Gostaria de fazer este pedido:
 * 
 * Produtos:
 * 2x Dipirona 500mg — R$ 19,80
 * 1x Vitamina C — R$ 14,90
 *
 * Total: R$ 34,70
 *
 * Endereço:
 * Rua Exemplo, 120, Centro, Canindé - CE
 *
 * Forma de pagamento:
 * PIX
 */
export function buildWhatsAppMessage(params: WhatsAppMessageParams): string {
  const { fulfillmentMethod, address, products, paymentMethod, deliveryFeeCents = 0 } = params;

  const lines: string[] = [];

  lines.push('Olá! Gostaria de fazer este pedido:');
  lines.push('');

  // --- Products ---
  lines.push('Produtos:');
  let subtotal = 0;
  for (const product of products) {
    const lineTotal = product.effectivePriceCents * product.quantity;
    subtotal += lineTotal;
    lines.push(`${product.quantity}x ${product.name} — ${formatBRL(lineTotal)}`);
  }

  lines.push('');

  // --- Totals ---
  const total = subtotal + deliveryFeeCents;
  if (deliveryFeeCents > 0) {
    lines.push(`Subtotal: ${formatBRL(subtotal)}`);
    lines.push(`Entrega: ${formatBRL(deliveryFeeCents)}`);
  }
  lines.push(`Total: ${formatBRL(total)}`);
  
  lines.push('');

  // --- Address ---
  lines.push('Endereço:');
  if (fulfillmentMethod === 'pickup') {
    lines.push('Retirada na loja');
  } else if (address) {
    lines.push(`${address.street}, ${address.number}, ${address.district}, ${address.city} - ${address.state}`);
    if (address.complement) {
      lines.push(`Complemento: ${address.complement}`);
    }
    if (address.reference) {
      lines.push(`Referência: ${address.reference}`);
    }
  }

  lines.push('');

  // --- Payment Method ---
  lines.push('Forma de pagamento:');
  lines.push(PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod);

  return lines.join('\n');
}

/**
 * Builds the full WhatsApp URL with the message.
 */
export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encoded}`;
}
