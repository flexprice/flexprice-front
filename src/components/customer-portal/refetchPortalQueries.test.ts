import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

const WALLETS_KEY = 'portal-wallets';
let cache: Record<string, unknown> = {};
const refetchQueries = vi.fn();

vi.mock('@/core/services/tanstack/queryClient', () => ({
	refetchQueries: (...args: unknown[]) => refetchQueries(...args),
	queryClient: { getQueryData: (key: readonly string[]) => cache[key[0]] },
}));

const { refreshAfterPayment } = await import('./refetchPortalQueries');

/**
 * Documents why refetchPortalQueries exists. `refetchQueries` forwards its
 * argument as a single queryKey, and React Query treats that as one prefix.
 */
describe('multi-key refetch', () => {
	it('a list of distinct roots matches nothing as one prefix', () => {
		const qc = new QueryClient();
		qc.setQueryData(['portal-wallets'], 'a');
		qc.setQueryData(['portal-wallet-balance', 'w1'], 'b');

		const asOnePrefix = qc.getQueryCache().findAll({ queryKey: ['portal-wallets', 'portal-wallet-balance'], exact: false });

		expect(asOnePrefix).toHaveLength(0);
	});

	it('matches both when each root is queried separately', () => {
		const qc = new QueryClient();
		qc.setQueryData(['portal-wallets'], 'a');
		qc.setQueryData(['portal-wallet-balance', 'w1'], 'b');

		const matched = ['portal-wallets', 'portal-wallet-balance'].flatMap((key) =>
			qc.getQueryCache().findAll({ queryKey: [key], exact: false }),
		);

		expect(matched).toHaveLength(2);
	});
});

/**
 * A checkout reaching `completed` only means the gateway is done — the wallet
 * transaction and its invoice are written by a webhook that can land after the
 * response does. One refetch on completion therefore races the backend.
 */
describe('refreshAfterPayment', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		cache = {};
		refetchQueries.mockClear();
	});
	afterEach(() => vi.useRealTimers());

	/** Runs the loop to completion, advancing past every settle delay. */
	const runSettled = async (promise: Promise<void>) => {
		await vi.runAllTimersAsync();
		await promise;
	};

	it('stops as soon as the wallet reflects the payment', async () => {
		cache[WALLETS_KEY] = { balance: '5' };
		refetchQueries.mockImplementation(async () => {
			cache[WALLETS_KEY] = { balance: '15' };
		});

		await runSettled(refreshAfterPayment());

		// A single round: the credit already landed, so there is nothing to wait for.
		expect(refetchQueries.mock.calls.filter((c) => c[0] === 'portal-wallets')).toHaveLength(1);
	});

	it('keeps re-checking while the wallet is unchanged', async () => {
		cache[WALLETS_KEY] = { balance: '5' };
		refetchQueries.mockResolvedValue(undefined);

		await runSettled(refreshAfterPayment());

		const rounds = refetchQueries.mock.calls.filter((c) => c[0] === 'portal-wallets').length;
		expect(rounds).toBe(3);
	});

	// Without a baseline there is no way to tell whether the backend has caught
	// up, so spinning on a schedule it cannot evaluate would just be noise.
	it('refreshes once when nothing is cached to compare against', async () => {
		refetchQueries.mockResolvedValue(undefined);

		await runSettled(refreshAfterPayment());

		expect(refetchQueries.mock.calls.filter((c) => c[0] === 'portal-wallets')).toHaveLength(1);
	});

	it('includes the caller-supplied keys in every round', async () => {
		cache[WALLETS_KEY] = { balance: '5' };
		refetchQueries.mockResolvedValue(undefined);

		await runSettled(refreshAfterPayment(['portal-invoice']));

		expect(refetchQueries).toHaveBeenCalledWith('portal-invoice');
	});
});
