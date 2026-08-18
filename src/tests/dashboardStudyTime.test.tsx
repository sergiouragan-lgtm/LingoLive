import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudyTimeTracker } from '../components/learning/StudyTimeTracker';
import React from 'react';
import * as firestore from 'firebase/firestore';

vi.mock('../../firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user' } }
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    Timestamp: actual.Timestamp
  };
});

describe('StudyTimeTracker', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calculates total minutes from sessions and deduplicates', async () => {
        const mockDocs = [
            { id: '1', data: () => ({ sessionId: 's1', durationSeconds: 600 }) }, // 10 min
            { id: '2', data: () => ({ sessionId: 's1', durationSeconds: 600 }) }, // duplicate, should be ignored
            { id: '3', data: () => ({ sessionId: 's2', durationSeconds: 1200 }) }, // 20 min
        ];

        (firestore.getDocs as any).mockResolvedValue({
            forEach: (cb: any) => mockDocs.forEach(cb)
        });

        render(<StudyTimeTracker userId="test-user" />);

        await waitFor(() => {
            expect(screen.getByText(/30 min/i)).toBeDefined();
        });
    });

    it('shows unavailable state when no data', async () => {
        (firestore.getDocs as any).mockResolvedValue({
            forEach: (cb: any) => {}
        });

        render(<StudyTimeTracker userId="test-user" />);

        await waitFor(() => {
            expect(screen.getByText(/Tempo de estudo ainda não disponível/i)).toBeDefined();
        });
    });

    it('handles durationMinutes correctly', async () => {
        const mockDocs = [
            { id: '1', data: () => ({ sessionId: 's1', durationMinutes: 15 }) }, 
        ];

        (firestore.getDocs as any).mockResolvedValue({
            forEach: (cb: any) => mockDocs.forEach(cb)
        });

        render(<StudyTimeTracker userId="test-user" />);

        await waitFor(() => {
            expect(screen.getByText(/15 min/i)).toBeDefined();
        });
    });

    it('handles startedAt and endedAt correctly', async () => {
        const mockDocs = [
            { id: '1', data: () => ({ sessionId: 's1', startedAt: new Date(2026, 0, 1, 10, 0, 0), endedAt: new Date(2026, 0, 1, 10, 30, 0) }) }, 
        ];

        (firestore.getDocs as any).mockResolvedValue({
            forEach: (cb: any) => mockDocs.forEach(cb)
        });

        render(<StudyTimeTracker userId="test-user" />);

        await waitFor(() => {
            expect(screen.getByText(/30 min/i)).toBeDefined();
        });
    });
});
