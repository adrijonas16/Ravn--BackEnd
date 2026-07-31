import { Modal } from '../Modal';

// Reusable confirmation dialog for destructive actions (e.g. deleting a task)

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'default';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="confirm-dialog">
        <h2 className="confirm-dialog__title">{title}</h2>
        <p className="confirm-dialog__message">{message}</p>
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__cancel-btn" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className={`confirm-dialog__confirm-btn${variant === 'danger' ? ' confirm-dialog__confirm-btn--danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
