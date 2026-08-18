import { describe, it, expect } from 'vitest';
import { formatBRL, parseBRLInput, centsToReais, reaisToCents, formatPriceShort } from '../src/currency';

describe('formatBRL', () => {
  it('formats zero correctly', () => {
    expect(formatBRL(0)).toBe('R$ 0,00');
  });

  it('formats simple price', () => {
    expect(formatBRL(990)).toBe('R$ 9,90');
  });

  it('formats price with thousands', () => {
    expect(formatBRL(12990)).toBe('R$ 129,90');
  });

  it('formats integer reais', () => {
    expect(formatBRL(1000)).toBe('R$ 10,00');
  });

  it('formats single cent', () => {
    expect(formatBRL(1)).toBe('R$ 0,01');
  });
});

describe('formatPriceShort', () => {
  it('formats without R$ symbol', () => {
    expect(formatPriceShort(990)).toBe('9,90');
  });
});

describe('parseBRLInput', () => {
  it('parses comma-separated value', () => {
    expect(parseBRLInput('9,90')).toBe(990);
  });

  it('parses dot-separated value', () => {
    expect(parseBRLInput('9.90')).toBe(990);
  });

  it('parses with R$ prefix', () => {
    expect(parseBRLInput('R$ 9,90')).toBe(990);
  });

  it('parses with R$ no space', () => {
    expect(parseBRLInput('R$9,90')).toBe(990);
  });

  it('parses thousands separator', () => {
    expect(parseBRLInput('1.299,90')).toBe(129990);
  });

  it('parses integer', () => {
    expect(parseBRLInput('10')).toBe(1000);
  });

  it('returns null for empty', () => {
    expect(parseBRLInput('')).toBeNull();
  });

  it('returns null for invalid', () => {
    expect(parseBRLInput('abc')).toBeNull();
  });

  it('returns null for negative', () => {
    expect(parseBRLInput('-5,00')).toBeNull();
  });
});

describe('centsToReais', () => {
  it('converts correctly', () => {
    expect(centsToReais(990)).toBe(9.9);
  });
});

describe('reaisToCents', () => {
  it('converts correctly', () => {
    expect(reaisToCents(9.9)).toBe(990);
  });

  it('rounds correctly', () => {
    expect(reaisToCents(9.999)).toBe(1000);
  });
});
