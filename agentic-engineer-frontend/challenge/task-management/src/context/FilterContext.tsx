import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { FilterInput } from '../types/task';

// Context that shares the active filter state across all pages
// Any component can read or update filters without prop drilling

interface FilterContextValue {
  filters: FilterInput;
  setFilters: (filters: FilterInput) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterInput>({});
  const clearFilters = useCallback(() => setFilters({}), []);

  // Memoize the context value so consumers only re-render when filters actually change
  const value = useMemo(
    () => ({ filters, setFilters, clearFilters }),
    [filters, clearFilters],
  );

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
