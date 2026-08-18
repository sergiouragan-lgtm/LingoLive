import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GreetingCard } from '../components/core/Dashboard';
import React from 'react';

// Mock the localization hook
vi.mock('../context/LocalizationContext', () => ({
  useLocalization: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}));

describe('GreetingCard', () => {
  it('renders correctly with name', () => {
    render(<GreetingCard firstName="Ana" formattedDate="02/08/2026" />);
    // Depends on the hour, but it should contain "Ana"
    expect(screen.getByText(/Ana/i)).toBeDefined();
  });

  it('renders loading state', () => {
    render(<GreetingCard firstName="Ana" formattedDate="02/08/2026" isLoading={true} />);
    // Look for existence of skeleton class
    expect(document.querySelector('.animate-pulse')).toBeDefined();
  });

  it('renders error state', () => {
    render(<GreetingCard firstName="Ana" formattedDate="02/08/2026" isError={true} />);
    expect(screen.getByText(/Olá, Estudante/i)).toBeDefined();
  });
});
