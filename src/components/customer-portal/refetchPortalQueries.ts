import { queryClient, refetchQueries } from '@/core/services/tanstack/queryClient';
import { PORTAL_BALANCE_QUERY_ROOTS, portalWalletsQueryKey } from './queryKeys';

/**
 * Refetch several unrelated query keys.
 *
 * `refetchQueries` passes its argument straight through as a single `queryKey`,
 * which React Query treats as one prefix — so `['portal-wallets',
 * 'portal-wallet-balance']` matches a query whose key *starts with both*, and
 * therefore matches neither `['portal-wallets']` nor
 * `['portal-wallet-balance', id]`. Passing a list of distinct roots silently
 * refreshed nothing. Each root has to be its own call.
 */
export const refetchPortalQueries = async (keys: string[]) => {
	await Promise.all(keys.map((key) => refetchQueries(key)));
};

/**
 * When to re-check after a payment reports success.
 *
 * A checkout reaching `completed` only means the gateway is done. The wallet
 * transaction and its invoice are written by a webhook that can land a moment
 * later, so a single refetch fired on completion races the backend and the
 * customer sees the payment they just made missing from the list.
 */
const SETTLE_DELAYS_MS = [0, 1500, 4000];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Serialised wallet state, or null when there is nothing to compare against. */
const walletSnapshot = (): string | null => {
	try {
		const data = queryClient?.getQueryData(portalWalletsQueryKey);
		return data === undefined ? null : JSON.stringify(data);
	} catch {
		return null;
	}
};

/**
 * Refresh everything a completed payment touches, waiting for it to show up.
 *
 * Re-checks on the schedule above and stops as soon as the wallet actually
 * changes, so the usual case costs one round. Without a baseline to compare
 * against — nothing cached yet — there is no way to tell whether the backend has
 * caught up, so it refreshes once rather than spinning on a schedule it cannot
 * evaluate.
 */
export const refreshAfterPayment = async (extraKeys: string[] = []) => {
	const before = walletSnapshot();
	const keys = [...PORTAL_BALANCE_QUERY_ROOTS, ...extraKeys];

	for (const delay of SETTLE_DELAYS_MS) {
		if (delay) await wait(delay);
		await refetchPortalQueries(keys);
		if (before === null || walletSnapshot() !== before) return;
	}
};
