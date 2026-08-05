import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastContainer } from './Toast';

describe('ToastContainer', () => {
  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer toasts={[]} onRemove={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders a success toast', () => {
    const toasts = [{ id: '1', message: 'Task created', type: 'success' as const }];
    render(<ToastContainer toasts={toasts} onRemove={vi.fn()} />);

    expect(screen.getByText('Task created')).toBeInTheDocument();
  });

  it('renders an error toast', () => {
    const toasts = [{ id: '2', message: 'Failed', type: 'error' as const }];
    const { container } = render(<ToastContainer toasts={toasts} onRemove={vi.fn()} />);

    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(container.querySelector('.toast--error')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    const toasts = [
      { id: '1', message: 'First', type: 'success' as const },
      { id: '2', message: 'Second', type: 'error' as const },
    ];
    render(<ToastContainer toasts={toasts} onRemove={vi.fn()} />);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('calls onRemove when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const toasts = [{ id: '42', message: 'Hello', type: 'success' as const }];
    render(<ToastContainer toasts={toasts} onRemove={onRemove} />);

    await user.click(screen.getByLabelText('Dismiss'));
    expect(onRemove).toHaveBeenCalledWith('42');
  });

  it('has aria-live for accessibility', () => {
    const toasts = [{ id: '1', message: 'Test', type: 'success' as const }];
    const { container } = render(<ToastContainer toasts={toasts} onRemove={vi.fn()} />);

    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });
});
