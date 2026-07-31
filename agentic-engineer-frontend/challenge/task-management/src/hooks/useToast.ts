import { useState, useCallback } from 'react';

// Custom hook for managing temporary notification toasts
// Each toast auto-dismisses after 3 seconds

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add a toast and schedule its removal after 3 seconds
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = String(Date.now());
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}
