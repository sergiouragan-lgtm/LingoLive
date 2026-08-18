import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GamificationWidget } from '../components/learning/GamificationWidget';
import { LocalizationProvider } from '../context/LocalizationContext';
import '@testing-library/jest-dom/vitest';

describe('GamificationWidget', () => {
  it('renders loading state', () => {
    render(<LocalizationProvider><GamificationWidget isLoading={true} /></LocalizationProvider>);
    expect(screen.getByTestId('loading-spinner')).toBeDefined();
  });

  it('renders error state', () => {
    render(<LocalizationProvider><GamificationWidget isError={true} /></LocalizationProvider>);
    expect(screen.getByText(/Erro ao carregar gamificação/i)).toBeDefined();
  });

  it('renders empty state', () => {
    render(<LocalizationProvider><GamificationWidget data={null} /></LocalizationProvider>);
    expect(screen.getByText(/Dados de gamificação não disponíveis/i)).toBeDefined();
  });

  it('renders success state with real data', () => {
    const mockData = { xp: 100, level: 5 };
    render(<LocalizationProvider><GamificationWidget data={mockData} /></LocalizationProvider>);
    expect(screen.getByText('100')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
  });
});
