import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NextActivityWidget } from '../components/learning/NextActivityWidget';
import React from 'react';

describe('NextActivityWidget', () => {
    it('renders empty state when activity is null', () => {
        render(<NextActivityWidget activity={null} />);
        expect(screen.getByText(/Sem actividade pendente/i)).toBeDefined();
    });

    it('renders activity details when provided', () => {
        const activity = { id: '1', title: 'Aula de teste' };
        render(<NextActivityWidget activity={activity} />);
        expect(screen.getByText(/Aula de teste/i)).toBeDefined();
    });

    it('calls onNavigate when button is clicked', async () => {
        const user = userEvent.setup();
        const onNavigate = vi.fn();
        render(<NextActivityWidget activity={{ id: '1', title: 'Aula' }} onNavigate={onNavigate} />);
        
        const buttons = screen.getAllByTestId('next-activity-button');
        
        for (const button of buttons) {
            await user.click(button);
        }
        
        expect(onNavigate).toHaveBeenCalled();
    });

    it('renders loading state', () => {
        const { container } = render(<NextActivityWidget isLoading={true} />);
        expect(container.querySelector('[aria-hidden="true"]')).toBeDefined();
    });

    it('renders error state', () => {
        render(<NextActivityWidget isError={true} />);
        expect(screen.getByText(/Erro ao carregar actividade/i)).toBeDefined();
    });
});
