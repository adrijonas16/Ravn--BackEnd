import { X } from 'lucide-react';
import type { Toast as ToastType } from '../../hooks/useToast';

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

// Renders a stack of notification toasts in the bottom-right corner
// Uses aria-live="polite" so screen readers announce new notifications
export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <span>{toast.message}</span>
          <button type="button" className="toast__close" onClick={() => onRemove(toast.id)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
