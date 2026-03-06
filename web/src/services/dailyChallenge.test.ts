import { describe, it, expect, beforeEach } from 'vitest';
import { getDailyChallenge, getDailyChallengeInfo, getDailyHighScore, saveDailyHighScore } from './dailyChallenge';

describe('getDailyChallenge', () => {
  it('returns the requested number of event groups', () => {
    const events = getDailyChallenge(5);
    expect(events).toHaveLength(5);
  });

  it('defaults to 10 event groups', () => {
    const events = getDailyChallenge();
    expect(events).toHaveLength(10);
  });

  it('returns deterministic results for the same day', () => {
    const first = getDailyChallenge(5);
    const second = getDailyChallenge(5);
    expect(first.map(e => e.stockSymbol)).toEqual(second.map(e => e.stockSymbol));
  });

  it('every returned group has events', () => {
    const events = getDailyChallenge(10);
    for (const group of events) {
      expect(group.events.length).toBeGreaterThan(0);
      expect(group.stockSymbol).toBeTruthy();
    }
  });

  it('does not return more than available data', () => {
    const events = getDailyChallenge(9999);
    expect(events.length).toBeLessThanOrEqual(9999);
    expect(events.length).toBeGreaterThan(0);
  });
});

describe('getDailyChallengeInfo', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('marks first access as new day', () => {
    const info = getDailyChallengeInfo();
    expect(info.isNewDay).toBe(true);
    expect(info.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(info.eventCount).toBe(10);
  });

  it('marks subsequent access as not new day', () => {
    getDailyChallengeInfo();
    const info = getDailyChallengeInfo();
    expect(info.isNewDay).toBe(false);
  });
});

describe('dailyHighScore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns 0 when no score is saved', () => {
    expect(getDailyHighScore()).toBe(0);
  });

  it('saves a new high score', () => {
    expect(saveDailyHighScore(5)).toBe(true);
    expect(getDailyHighScore()).toBe(5);
  });

  it('does not overwrite with lower score', () => {
    saveDailyHighScore(10);
    expect(saveDailyHighScore(5)).toBe(false);
    expect(getDailyHighScore()).toBe(10);
  });

  it('overwrites with higher score', () => {
    saveDailyHighScore(5);
    expect(saveDailyHighScore(10)).toBe(true);
    expect(getDailyHighScore()).toBe(10);
  });
});
