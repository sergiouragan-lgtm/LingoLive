import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CurrentLevelWidget } from '../components/learning/CurrentLevelWidget';
import React from 'react';

describe('CurrentLevelWidget', () => {
    it('renders empty state when level is null', () => {
        render(<CurrentLevelWidget level={null} />);
        expect(screen.getByText(/Avaliação pendente/i)).toBeDefined();
    });

    it('renders level name when provided', () => {
        render(<CurrentLevelWidget level="B1" />);
        expect(screen.getByText(/B1/i)).toBeDefined();
    });

    it('renders loading state', () => {
        const { container } = render(<CurrentLevelWidget isLoading={true} />);
        expect(container.querySelector('[aria-hidden="true"]')).toBeDefined();
    });

    it('renders error state', () => {
        render(<CurrentLevelWidget isError={true} />);
        expect(screen.getByText(/Erro ao carregar nível/i)).toBeDefined();
    });
});
