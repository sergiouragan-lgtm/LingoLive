import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { StudyStreakTracker } from '../components/learning/StudyStreakTracker';
import React from 'react';

describe('StudyStreakTracker', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders empty state when history is empty', () => {
        render(<StudyStreakTracker history={[]} />);
        expect(screen.getByText(/Sem sequência/i)).toBeDefined();
    });

    it('renders streak 1 for one day', () => {
        const today = new Date().toISOString().split('T')[0];
        render(<StudyStreakTracker history={[today]} />);
        expect(screen.getByText(/1 dia/i)).toBeDefined();
    });

    it('renders streak 2 for two consecutive days', () => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        render(<StudyStreakTracker history={[today.toISOString(), yesterday.toISOString()]} />);
        expect(screen.getByText(/2 dias/i)).toBeDefined();
    });

    it('renders streak 0 when streak is broken', () => {
        const today = new Date();
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(today.getDate() - 2);
        render(<StudyStreakTracker history={[twoDaysAgo.toISOString()]} />);
        expect(screen.getByText(/Sem sequência/i)).toBeDefined();
    });
});
