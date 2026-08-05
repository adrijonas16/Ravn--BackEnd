import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from './useToast';

describe('useToast', () => {
  it('starts with no toasts', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toHaveLength(0);
  });

  it('adds a success toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Task created', 'success');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Task created');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('adds an error toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Something failed', 'error');
    });

    expect(result.current.toasts[0].type).toBe('error');
  });

  it('removes a toast manually', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Will be removed', 'success');
    });

    const id = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(id);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('can add multiple toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('First', 'success');
      result.current.showToast('Second', 'error');
    });

    expect(result.current.toasts).toHaveLength(2);
  });

  it('auto-removes toast after 3 seconds', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Temporary', 'success');
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.toasts).toHaveLength(0);
    vi.useRealTimers();
  });

  it('each toast has an id', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('A', 'success');
    });

    expect(result.current.toasts[0].id).toBeDefined();
    expect(typeof result.current.toasts[0].id).toBe('string');
  });
});
