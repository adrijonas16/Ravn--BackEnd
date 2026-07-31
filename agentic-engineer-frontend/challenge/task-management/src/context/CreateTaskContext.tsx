import { useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { CreateTaskContext } from './createTaskContextValue';

// Provider that bridges the "create task" action between distant components
// Uses a ref to store the callback so the provider value stays stable (no unnecessary re-renders)
export function CreateTaskProvider({ children }: { children: ReactNode }) {
  const onCreateRef = useRef<(() => void) | null>(null);

  const requestCreate = useCallback(() => {
    onCreateRef.current?.();
  }, []);

  const setOnCreate = useCallback((fn: () => void) => {
    onCreateRef.current = fn;
  }, []);

  const value = useMemo(
    () => ({ requestCreate, setOnCreate }),
    [requestCreate, setOnCreate],
  );

  return (
    <CreateTaskContext.Provider value={value}>
      {children}
    </CreateTaskContext.Provider>
  );
}
