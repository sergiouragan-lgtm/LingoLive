import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DailyGoalTracker } from '../components/learning/DailyGoalTracker';
import React from 'react';

// Mock auth
vi.mock('../firebase', () => ({
    auth: { currentUser: { uid: 'test-user' } }
}));

describe('DailyGoalTracker', () => {
    const today = new Date().toISOString().split('T')[0];
    const mockStreakData = { history: [today] }; // 20 mins

    it('renders progress correctly', () => {
        render(<DailyGoalTracker streakData={mockStreakData as any} />);
        expect(screen.getByText(/20 min/i)).toBeDefined();
    });

    it('renders loading state', () => {
        render(<DailyGoalTracker isLoading={true} />);
        expect(document.querySelector('.animate-pulse')).toBeDefined();
    });

    it('renders error state', () => {
        render(<DailyGoalTracker isError={true} />);
        expect(screen.getByText(/Erro ao carregar dados/i)).toBeDefined();
    });
});
