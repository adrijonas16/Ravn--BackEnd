import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { FilterProvider, useFilters } from './FilterContext';
import type { ReactNode } from 'react';

// Wrapper that provides the FilterContext
function wrapper({ children }: { children: ReactNode }) {
  return <FilterProvider>{children}</FilterProvider>;
}

describe('FilterContext', () => {
  it('starts with empty filters', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });
    expect(result.current.filters).toEqual({});
  });

  it('sets filters', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.setFilters({ name: 'test', status: 'DONE' });
    });

    expect(result.current.filters.name).toBe('test');
    expect(result.current.filters.status).toBe('DONE');
  });

  it('clears filters', () => {
    const { result } = renderHook(() => useFilters(), { wrapper });

    act(() => {
      result.current.setFilters({ name: 'test', status: 'TODO' });
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({});
  });

  it('throws when used outside the provider', () => {
    expect(() => {
      renderHook(() => useFilters());
    }).toThrow('useFilters must be used within FilterProvider');
  });
});
