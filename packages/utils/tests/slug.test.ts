import { describe, it, expect } from 'vitest';
import { generateSlug, handleSlugCollision } from '../src/slug';

describe('generateSlug', () => {
  it('converts to lowercase', () => {
    expect(generateSlug('Dipirona')).toBe('dipirona');
  });

  it('handles spaces', () => {
    expect(generateSlug('Dipirona 500mg')).toBe('dipirona-500mg');
  });

  it('removes accents', () => {
    expect(generateSlug('Vitamina C Efervescente')).toBe('vitamina-c-efervescente');
    expect(generateSlug('São Paulo')).toBe('sao-paulo');
  });

  it('removes special characters', () => {
    expect(generateSlug('Test (special) #1')).toBe('test-special-1');
  });

  it('collapses consecutive hyphens', () => {
    expect(generateSlug('a   b')).toBe('a-b');
  });

  it('removes leading/trailing hyphens', () => {
    expect(generateSlug(' test ')).toBe('test');
  });
});

describe('handleSlugCollision', () => {
  it('returns base slug for attempt 0', () => {
    expect(handleSlugCollision('test', 0)).toBe('test');
  });

  it('appends number for collisions', () => {
    expect(handleSlugCollision('test', 1)).toBe('test-1');
    expect(handleSlugCollision('test', 2)).toBe('test-2');
  });
});
