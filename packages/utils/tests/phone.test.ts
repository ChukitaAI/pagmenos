import { describe, it, expect } from 'vitest';
import { normalizePhone, formatPhone, isValidBrazilianPhone } from '../src/phone';

describe('normalizePhone', () => {
  it('removes all non-digit characters', () => {
    expect(normalizePhone('+55 88 9998-1853')).toBe('558899981853');
  });

  it('removes parentheses', () => {
    expect(normalizePhone('(88) 99981-853')).toBe('8899981853');
  });

  it('handles already clean number', () => {
    expect(normalizePhone('558899981853')).toBe('558899981853');
  });
});

describe('formatPhone', () => {
  it('formats Brazilian mobile with country code (13 digits)', () => {
    expect(formatPhone('5588999811853')).toBe('+55 (88) 99981-1853');
  });

  it('formats Brazilian mobile without country code (11 digits)', () => {
    expect(formatPhone('88999811853')).toBe('(88) 99981-1853');
  });
});

describe('isValidBrazilianPhone', () => {
  it('validates correct number', () => {
    expect(isValidBrazilianPhone('558899981853')).toBe(true);
  });

  it('rejects too short', () => {
    expect(isValidBrazilianPhone('12345')).toBe(false);
  });

  it('rejects too long', () => {
    expect(isValidBrazilianPhone('12345678901234')).toBe(false);
  });
});
