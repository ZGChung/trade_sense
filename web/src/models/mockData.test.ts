import { describe, it, expect } from 'vitest';
import { mockData, getRandomEventGroup, getStockCategory } from './mockData';

describe('mockData integrity', () => {
  it('has no empty event groups', () => {
    const empty = mockData.filter((g) => g.events.length === 0);
    expect(empty).toHaveLength(0);
  });

  it('has no undefined stock symbols or names', () => {
    for (const group of mockData) {
      expect(group.stockSymbol).not.toBe('undefined');
      expect(group.stockName).not.toBe('undefined');
      expect(group.stockSymbol.length).toBeGreaterThan(0);
      expect(group.stockName.length).toBeGreaterThan(0);
    }
  });

  it('every event has required fields', () => {
    for (const group of mockData) {
      for (const event of group.events) {
        expect(event.id).toBeTruthy();
        expect(event.description.length).toBeGreaterThan(3);
        expect(event.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(event.stockSymbol).toBe(group.stockSymbol);
        expect(event.stockName).toBe(group.stockName);
        expect(typeof event.actualPerformance).toBe('number');
        expect(event.daysAfterEvent).toBeGreaterThan(0);
      }
    }
  });

  it('every group has a unique id', () => {
    const ids = mockData.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every group has at least 2 events', () => {
    for (const group of mockData) {
      expect(group.events.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('getRandomEventGroup', () => {
  it('returns a valid event group', () => {
    const group = getRandomEventGroup();
    expect(group.stockSymbol).toBeTruthy();
    expect(group.events.length).toBeGreaterThan(0);
  });
});

describe('getStockCategory', () => {
  it('returns correct category for known stocks', () => {
    expect(getStockCategory('AAPL')).toBe('科技');
    expect(getStockCategory('JPM')).toBe('金融');
    expect(getStockCategory('XOM')).toBe('能源');
    expect(getStockCategory('PFE')).toBe('医疗');
    expect(getStockCategory('NKE')).toBe('消费');
  });

  it('returns OTHER for unknown stocks', () => {
    expect(getStockCategory('ZZZZZ')).toBe('其他');
  });
});
