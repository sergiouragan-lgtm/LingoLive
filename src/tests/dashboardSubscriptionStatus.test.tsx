import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SubscriptionStatusWidget } from '../components/billing/SubscriptionStatusWidget';
import React from 'react';

vi.mock('../context/LocalizationContext', () => ({
    useLocalization: () => ({
        translateMessage: (_key: string, defaultText: string) => defaultText,
        formatDate: (date: Date) => date.toLocaleDateString(),
    }),
}));

describe('SubscriptionStatusWidget', () => {
    afterEach(cleanup);
    it('renders plan name correctly', () => {
        render(<SubscriptionStatusWidget planId="school_pro" />);
        expect(screen.getByText(/Premium Pro/i)).toBeDefined();
    });

    it('renders active state correctly', async () => {
        render(<SubscriptionStatusWidget planId="school_pro" subscriptionStatus="active" subscriptionActive={true} paidUntil={new Date(Date.now() + 1000000).toISOString()} />);
        // Wait for it to not be loading or have the state updated
        expect(await screen.findByTestId('subscription-status-text')).toHaveTextContent('active');
    });

    it('calls onManagePlan when button is clicked', async () => {
        const onManagePlan = vi.fn();
        render(<SubscriptionStatusWidget planId="school_pro" subscriptionStatus="active" subscriptionActive={true} onManagePlan={onManagePlan} />);
        
        const button = await screen.findByTestId('manage-plan-button');
        fireEvent.click(button);
        
        await waitFor(() => expect(onManagePlan).toHaveBeenCalled());
    });

    it('renders loading state', () => {
        const { container } = render(<SubscriptionStatusWidget isLoading={true} />);
        expect(container.querySelector('[aria-hidden="true"]')).toBeDefined();
    });

    it('renders error state', () => {
        render(<SubscriptionStatusWidget isError={true} />);
        expect(screen.getByText(/Erro ao carregar assinatura/i)).toBeDefined();
    });

    it('renders expired state', async () => {
        render(<SubscriptionStatusWidget planId="school_pro" subscriptionStatus="expired" paidUntil={new Date(Date.now() - 100000).toISOString()} />);
        expect(await screen.findByTestId('subscription-status-text')).toHaveTextContent('expired');
    });

    it('renders unknown state when planId is absent', async () => {
        render(<SubscriptionStatusWidget />);
        expect(await screen.findByTestId('subscription-status-text')).toHaveTextContent('unknown');
    });

    it('renders review_required state when planId is unknown', async () => {
        render(<SubscriptionStatusWidget planId="invalid_plan" />);
        expect(await screen.findByTestId('subscription-status-text')).toHaveTextContent('review_required');
    });
});
