import { describe, it, expect } from 'vitest';
import { estimateTokenCount } from '../provider';

describe('estimateTokenCount', () => {
  it('returns 0 for empty string', () => {
    expect(estimateTokenCount('')).toBe(0);
  });

  it('estimates pure English text (~4 chars per token)', () => {
    expect(estimateTokenCount('Hello world')).toBe(3);
  });

  it('estimates pure Chinese text (~1.5 tokens per char)', () => {
    expect(estimateTokenCount('\u4f60\u597d\u4e16\u754c')).toBe(6);
  });

  it('estimates mixed text correctly', () => {
    // "Hello " = 6 chars * 0.25 = 1.5, "你好" = 2 chars * 1.5 = 3, total = 4.5, ceil = 5
    expect(estimateTokenCount('Hello \u4f60\u597d')).toBe(5);
  });

  it('estimates Japanese hiragana as CJK', () => {
    // 5 hiragana chars * 1.5 = 7.5, ceil = 8
    expect(estimateTokenCount('\u3053\u3093\u306b\u3061\u306f')).toBe(8);
  });

  it('estimates Korean hangul as CJK', () => {
    // 5 hangul chars * 1.5 = 7.5, ceil = 8
    expect(estimateTokenCount('\uc548\ub155\ud558\uc138\uc694')).toBe(8);
  });

  it('treats emoji as non-CJK (0.25 per char)', () => {
    // 3 emoji chars * 0.25 = 0.75, ceil = 1
    expect(estimateTokenCount('\u{1f600}\u{1f600}\u{1f600}')).toBe(1);
  });

  it('handles long strings within acceptable performance', () => {
    const longStr = 'a'.repeat(100000);
    const start = performance.now();
    const result = estimateTokenCount(longStr);
    const elapsed = performance.now() - start;
    expect(result).toBe(25000);
    expect(elapsed).toBeLessThan(50);
  });
});
