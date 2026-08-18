import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CurrentLanguageWidget } from '../components/learning/CurrentLanguageWidget';
import React from 'react';

describe('CurrentLanguageWidget', () => {
    it('renders empty state when language is null', () => {
        render(<CurrentLanguageWidget learningLanguage={null} />);
        expect(screen.getByText(/Idioma não definido/i)).toBeDefined();
    });

    it('renders language name and flag when provided', () => {
        render(<CurrentLanguageWidget name="Português" flag="🇵🇹" />);
        expect(screen.getByText(/Português/i)).toBeDefined();
        expect(screen.getByText(/🇵🇹/i)).toBeDefined();
    });

    it('renders loading state', () => {
        const { container } = render(<CurrentLanguageWidget isLoading={true} />);
        expect(container.querySelector('[aria-hidden="true"]')).toBeDefined();
    });

    it('renders error state', () => {
        render(<CurrentLanguageWidget isError={true} />);
        expect(screen.getByText(/Erro/i)).toBeDefined();
    });
});
