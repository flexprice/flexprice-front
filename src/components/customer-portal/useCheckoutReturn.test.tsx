import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import useCheckoutReturn, { rememberPendingCheckout, subscribeToCheckoutSettled } from './useCheckoutReturn';

vi.mock('@/api/CustomerPortalApi', () => ({
	default: { getCheckoutSession: vi.fn() },
}));

vi.mock('@/core/services/tanstack/queryClient', () => ({
	refetchQueries: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('react-hot-toast', () => ({
	default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useCheckoutReturn', () => {
	beforeEach(() => sessionStorage.clear());
	afterEach(() => vi.clearAllMocks());

	it('does nothing when no checkout is pending', () => {
		const { result } = renderHook(() => useCheckoutReturn(), { wrapper });
		expect(result.current.isResolving).toBe(false);
		expect(CustomerPortalApi.getCheckoutSession).not.toHaveBeenCalled();
	});

	// The tab that opens the checkout has already mounted this hook, and writing
	// to sessionStorage fires no event in the tab that wrote it — so without an
	// explicit hand-off the tab the customer started from never resolves the
	// payment it started, and its balances stay stale.
	it('picks up a checkout started after mount', async () => {
		vi.mocked(CustomerPortalApi.getCheckoutSession).mockResolvedValue({
			id: 'cs_late',
			checkout_status: 'completed',
			payment_provider: 'razorpay',
			expires_at: '2026-01-01T00:00:00Z',
		} as never);

		const { result } = renderHook(() => useCheckoutReturn(), { wrapper });
		expect(result.current.isResolving).toBe(false);

		act(() => rememberPendingCheckout('cs_late'));

		await waitFor(() => expect(CustomerPortalApi.getCheckoutSession).toHaveBeenCalledWith('cs_late'));
		await waitFor(() => expect(toast.success).toHaveBeenCalledWith('checkoutReturn.completed'));
	});

	// The provider redirects back without saying whether payment succeeded, so the
	// session is the only source of truth.
	it('reports success and refreshes balances when the session completed', async () => {
		rememberPendingCheckout('cs_1');
		vi.mocked(CustomerPortalApi.getCheckoutSession).mockResolvedValue({
			id: 'cs_1',
			checkout_status: 'completed',
			payment_provider: 'chargebee',
			expires_at: '2026-01-01T00:00:00Z',
		} as never);

		renderHook(() => useCheckoutReturn(), { wrapper });

		await waitFor(() => expect(toast.success).toHaveBeenCalledWith('checkoutReturn.completed'));
	});

	// The hand-off dialog points at a payment that is now done — leaving "Complete
	// your payment" sitting over a balance that has already gone up.
	it('tells subscribers when a checkout settles', async () => {
		const onSettle = vi.fn();
		const unsubscribe = subscribeToCheckoutSettled(onSettle);
		rememberPendingCheckout('cs_settled');
		vi.mocked(CustomerPortalApi.getCheckoutSession).mockResolvedValue({
			id: 'cs_settled',
			checkout_status: 'completed',
			payment_provider: 'razorpay',
			expires_at: '2026-01-01T00:00:00Z',
		} as never);

		renderHook(() => useCheckoutReturn(), { wrapper });

		await waitFor(() => expect(onSettle).toHaveBeenCalledWith('completed'));
		unsubscribe();
	});

	// The outcome travels with the signal, so a failed checkout can leave its link
	// up to retry instead of being dismissed like a success.
	it('reports a failed outcome to subscribers too', async () => {
		const onSettle = vi.fn();
		const unsubscribe = subscribeToCheckoutSettled(onSettle);
		rememberPendingCheckout('cs_failed_signal');
		vi.mocked(CustomerPortalApi.getCheckoutSession).mockResolvedValue({
			id: 'cs_failed_signal',
			checkout_status: 'failed',
			payment_provider: 'razorpay',
			expires_at: '2026-01-01T00:00:00Z',
		} as never);

		renderHook(() => useCheckoutReturn(), { wrapper });

		await waitFor(() => expect(onSettle).toHaveBeenCalledWith('failed'));
		unsubscribe();
	});

	// A failure reason from the gateway is more use than our generic wording.
	it('prefers the gateway failure reason over the generic message', async () => {
		rememberPendingCheckout('cs_2');
		vi.mocked(CustomerPortalApi.getCheckoutSession).mockResolvedValue({
			id: 'cs_2',
			checkout_status: 'failed',
			payment_provider: 'chargebee',
			expires_at: '2026-01-01T00:00:00Z',
			failure_reason: 'card declined',
		} as never);

		renderHook(() => useCheckoutReturn(), { wrapper });

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith('card declined'));
	});

	it('reports an expired session distinctly from a failure', async () => {
		rememberPendingCheckout('cs_3');
		vi.mocked(CustomerPortalApi.getCheckoutSession).mockResolvedValue({
			id: 'cs_3',
			checkout_status: 'expired',
			payment_provider: 'chargebee',
			expires_at: '2026-01-01T00:00:00Z',
		} as never);

		renderHook(() => useCheckoutReturn(), { wrapper });

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith('checkoutReturn.expired'));
	});

	// Otherwise a returning customer would resolve the same checkout on every visit.
	it('clears the pending checkout once it reaches a terminal state', async () => {
		rememberPendingCheckout('cs_4');
		vi.mocked(CustomerPortalApi.getCheckoutSession).mockResolvedValue({
			id: 'cs_4',
			checkout_status: 'completed',
			payment_provider: 'chargebee',
			expires_at: '2026-01-01T00:00:00Z',
		} as never);

		renderHook(() => useCheckoutReturn(), { wrapper });

		await waitFor(() => expect(sessionStorage.getItem('flexprice.portal.pendingCheckout')).toBeNull());
	});

	// A webhook may still be in flight, so a pending session must not be treated
	// as either success or failure.
	it('stays quiet while the session is still pending', async () => {
		rememberPendingCheckout('cs_5');
		vi.mocked(CustomerPortalApi.getCheckoutSession).mockResolvedValue({
			id: 'cs_5',
			checkout_status: 'pending',
			payment_provider: 'chargebee',
			expires_at: '2026-01-01T00:00:00Z',
		} as never);

		renderHook(() => useCheckoutReturn(), { wrapper });

		await waitFor(() => expect(CustomerPortalApi.getCheckoutSession).toHaveBeenCalled());
		expect(toast.success).not.toHaveBeenCalled();
		expect(toast.error).not.toHaveBeenCalled();
	});
});
