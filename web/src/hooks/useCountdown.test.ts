import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from './useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with the given duration', () => {
    const { result } = renderHook(() => useCountdown(15));
    expect(result.current.secondsLeft).toBe(15);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isExpired).toBe(false);
  });

  it('counts down when started', () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => result.current.start());
    expect(result.current.isRunning).toBe(true);

    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.secondsLeft).toBe(7);
  });

  it('fires onExpire when reaching zero', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown(3, onExpire));

    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(3000); });

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it('can be paused and resumed', () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.secondsLeft).toBe(7);

    act(() => result.current.pause());
    expect(result.current.isRunning).toBe(false);

    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.secondsLeft).toBe(7);

    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.secondsLeft).toBe(5);
  });

  it('can be reset to original duration', () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.secondsLeft).toBe(5);

    act(() => result.current.reset());
    expect(result.current.secondsLeft).toBe(10);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isExpired).toBe(false);
  });

  it('does not go below zero', () => {
    const { result } = renderHook(() => useCountdown(2));

    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.secondsLeft).toBe(0);
  });

  it('returns progress as a fraction', () => {
    const { result } = renderHook(() => useCountdown(10));

    expect(result.current.progress).toBe(1);

    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.progress).toBe(0.5);

    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.progress).toBe(0);
  });
});
