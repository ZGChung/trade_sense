import { describe, it, expect } from 'vitest';
import { getDifficulty, getDifficultyLabel, getDifficultyColor } from './difficulty';

describe('getDifficulty', () => {
  it('returns "easy" for large absolute performance (>8%)', () => {
    expect(getDifficulty(0.15)).toBe('easy');
    expect(getDifficulty(-0.10)).toBe('easy');
    expect(getDifficulty(0.25)).toBe('easy');
  });

  it('returns "medium" for moderate performance (3%-8%)', () => {
    expect(getDifficulty(0.05)).toBe('medium');
    expect(getDifficulty(-0.04)).toBe('medium');
    expect(getDifficulty(0.07)).toBe('medium');
  });

  it('returns "hard" for small performance (<3%)', () => {
    expect(getDifficulty(0.02)).toBe('hard');
    expect(getDifficulty(-0.015)).toBe('hard');
    expect(getDifficulty(0.005)).toBe('hard');
    expect(getDifficulty(0.0)).toBe('hard');
  });
});

describe('getDifficultyLabel', () => {
  it('returns Chinese labels', () => {
    expect(getDifficultyLabel('easy')).toBe('简单');
    expect(getDifficultyLabel('medium')).toBe('中等');
    expect(getDifficultyLabel('hard')).toBe('困难');
  });
});

describe('getDifficultyColor', () => {
  it('returns appropriate color classes', () => {
    const easy = getDifficultyColor('easy');
    expect(easy).toContain('green');

    const medium = getDifficultyColor('medium');
    expect(medium).toContain('yellow');

    const hard = getDifficultyColor('hard');
    expect(hard).toContain('red');
  });
});
