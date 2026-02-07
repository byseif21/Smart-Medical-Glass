import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingSpinner from '../../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders correctly', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with text when provided', () => {
    const testText = 'Loading data...';
    render(<LoadingSpinner text={testText} />);
    expect(screen.getByText(testText)).toBeInTheDocument();
  });

  it('applies correct size class', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('w-16');
    expect(spinner).toHaveClass('h-16');
  });

  it('renders fullscreen when prop is true', () => {
    const { container } = render(<LoadingSpinner fullScreen={true} />);
    expect(container.firstChild).toHaveClass('min-h-screen');
  });
});
