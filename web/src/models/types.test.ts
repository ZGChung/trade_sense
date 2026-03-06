import { describe, it, expect } from 'vitest';
import {
  PredictionOption,
  getPerformanceCategory,
  getFormattedPerformance,
  getAllCategories,
  StockCategory,
} from './types';

describe('getPerformanceCategory', () => {
  it('returns RISE for performance > 1%', () => {
    expect(getPerformanceCategory(0.05)).toBe(PredictionOption.RISE);
    expect(getPerformanceCategory(0.02)).toBe(PredictionOption.RISE);
    expect(getPerformanceCategory(0.011)).toBe(PredictionOption.RISE);
  });

  it('returns FALL for performance < -1%', () => {
    expect(getPerformanceCategory(-0.05)).toBe(PredictionOption.FALL);
    expect(getPerformanceCategory(-0.02)).toBe(PredictionOption.FALL);
    expect(getPerformanceCategory(-0.011)).toBe(PredictionOption.FALL);
  });

  it('returns FLAT for performance between -1% and 1%', () => {
    expect(getPerformanceCategory(0.0)).toBe(PredictionOption.FLAT);
    expect(getPerformanceCategory(0.005)).toBe(PredictionOption.FLAT);
    expect(getPerformanceCategory(-0.005)).toBe(PredictionOption.FLAT);
    expect(getPerformanceCategory(0.01)).toBe(PredictionOption.FLAT);
    expect(getPerformanceCategory(-0.01)).toBe(PredictionOption.FLAT);
  });
});

describe('getFormattedPerformance', () => {
  it('formats positive performance with + sign', () => {
    expect(getFormattedPerformance(0.05)).toBe('+5.0%');
    expect(getFormattedPerformance(0.123)).toBe('+12.3%');
  });

  it('formats negative performance with - sign', () => {
    expect(getFormattedPerformance(-0.05)).toBe('-5.0%');
    expect(getFormattedPerformance(-0.087)).toBe('-8.7%');
  });

  it('formats zero as +0.0%', () => {
    expect(getFormattedPerformance(0)).toBe('+0.0%');
  });
});

describe('getAllCategories', () => {
  it('returns categories without OTHER', () => {
    const cats = getAllCategories();
    expect(cats).not.toContain(StockCategory.OTHER);
  });

  it('includes the main categories', () => {
    const cats = getAllCategories();
    expect(cats).toContain(StockCategory.TECH);
    expect(cats).toContain(StockCategory.FINANCE);
    expect(cats).toContain(StockCategory.CONSUMER);
    expect(cats).toContain(StockCategory.ENERGY);
    expect(cats).toContain(StockCategory.MEDICAL);
  });
});
