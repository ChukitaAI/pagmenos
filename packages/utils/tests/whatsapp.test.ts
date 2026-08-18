import { describe, it, expect } from 'vitest';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '../src/whatsapp';

describe('buildWhatsAppMessage', () => {
  it('builds delivery message correctly', () => {
    const message = buildWhatsAppMessage({
      fulfillmentMethod: 'delivery',
      address: {
        street: 'Rua Exemplo',
        number: '120',
        district: 'Centro',
        city: 'Canindé',
        state: 'CE',
        complement: 'Apto 2',
        reference: 'Próximo à praça',
      },
      products: [
        { name: 'Dipirona 500mg', quantity: 2 },
        { name: 'Vitamina C', quantity: 1 },
        { name: 'Soro Fisiológico', quantity: 1 },
      ],
      paymentMethod: 'pix',
    });

    expect(message).toContain('Endereço:');
    expect(message).toContain('Rua Exemplo, 120, Centro, Canindé - CE');
    expect(message).toContain('Complemento: Apto 2');
    expect(message).toContain('Referência: Próximo à praça');
    expect(message).toContain('Produtos:');
    expect(message).toContain('2x Dipirona 500mg');
    expect(message).toContain('1x Vitamina C');
    expect(message).toContain('1x Soro Fisiológico');
    expect(message).toContain('Método de pagamento:');
    expect(message).toContain('PIX');
  });

  it('builds pickup message correctly', () => {
    const message = buildWhatsAppMessage({
      fulfillmentMethod: 'pickup',
      products: [
        { name: 'Dipirona 500mg', quantity: 2 },
        { name: 'Vitamina C', quantity: 1 },
      ],
      paymentMethod: 'credit_card',
    });

    expect(message).toContain('Endereço:');
    expect(message).toContain('Retirada na loja');
    expect(message).toContain('2x Dipirona 500mg');
    expect(message).toContain('1x Vitamina C');
    expect(message).toContain('Cartão de crédito');
  });

  it('omits complement and reference when not provided', () => {
    const message = buildWhatsAppMessage({
      fulfillmentMethod: 'delivery',
      address: {
        street: 'Rua Teste',
        number: '100',
        district: 'Bairro',
        city: 'Cidade',
        state: 'SP',
      },
      products: [{ name: 'Produto X', quantity: 1 }],
      paymentMethod: 'cash',
    });

    expect(message).not.toContain('Complemento');
    expect(message).not.toContain('Referência');
    expect(message).toContain('Dinheiro');
  });

  // CRITICAL TEST: prices must NEVER appear in the WhatsApp message
  it('NEVER includes prices in the message', () => {
    const message = buildWhatsAppMessage({
      fulfillmentMethod: 'delivery',
      address: {
        street: 'Rua X',
        number: '1',
        district: 'Centro',
        city: 'Fortaleza',
        state: 'CE',
      },
      products: [
        { name: 'Dipirona 500mg', quantity: 2 },
        { name: 'Vitamina C', quantity: 1 },
      ],
      paymentMethod: 'pix',
    });

    // Must NOT contain any price-related content
    expect(message).not.toContain('R$');
    expect(message).not.toContain('9,90');
    expect(message).not.toContain('9.90');
    expect(message).not.toContain('Total');
    expect(message).not.toContain('Subtotal');
    expect(message).not.toContain('Preço');
    expect(message).not.toContain('Desconto');
    expect(message).not.toContain('Promoção');
    expect(message).not.toMatch(/\d+,\d{2}/); // No currency-like patterns
  });

  it('NEVER includes order ID or customer info', () => {
    const message = buildWhatsAppMessage({
      fulfillmentMethod: 'pickup',
      products: [{ name: 'Test', quantity: 1 }],
      paymentMethod: 'pix',
    });

    expect(message).not.toContain('PM-');
    expect(message).not.toContain('Pedido');
    expect(message).not.toContain('Cliente');
    expect(message).not.toContain('Telefone');
    expect(message).not.toContain('CPF');
    expect(message).not.toContain('Nome');
  });

  it('handles all payment methods', () => {
    const methods = ['pix', 'cash', 'credit_card', 'debit_card'] as const;
    const labels = ['PIX', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito'];

    methods.forEach((method, i) => {
      const message = buildWhatsAppMessage({
        fulfillmentMethod: 'pickup',
        products: [{ name: 'Test', quantity: 1 }],
        paymentMethod: method,
      });
      expect(message).toContain(labels[i]);
    });
  });
});

describe('buildWhatsAppUrl', () => {
  it('builds valid URL', () => {
    const url = buildWhatsAppUrl('558899981853', 'Hello World');
    expect(url).toBe('https://wa.me/558899981853?text=Hello%20World');
  });

  it('encodes special characters', () => {
    const url = buildWhatsAppUrl('558899981853', 'Olá\nMundo');
    expect(url).toContain('Ol%C3%A1');
    expect(url).toContain('%0A');
  });
});
