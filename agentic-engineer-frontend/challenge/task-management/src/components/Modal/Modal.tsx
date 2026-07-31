import { useEffect, useRef, useCallback } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

// Reusable modal dialog with overlay backdrop
// Closes on Escape key or clicking outside the dialog
// Locks body scroll while open to prevent background scrolling
export function Modal({ isOpen, onClose, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  // Keep a ref to the latest onClose so the Escape listener doesn't go stale
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const stableClose = useCallback(() => {
    onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stableClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, stableClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') onClose();
  };

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      onKeyDown={handleOverlayKeyDown}
      role="presentation"
    >
      <dialog className="modal" open aria-label="Task dialog">
        {children}
      </dialog>
    </div>
  );
}
