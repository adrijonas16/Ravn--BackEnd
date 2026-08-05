import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders the spinner container', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('renders the animated circle', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.loading-spinner__circle')).toBeInTheDocument();
  });
});
