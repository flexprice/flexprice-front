import { useSearchParams } from 'react-router';
import { useCallback } from 'react';

interface UsePaginationProps {
	initialLimit?: number;
	prefix?: PAGINATION_PREFIX | string;
}

export enum PAGINATION_PREFIX {
	WALLET_TRANSACTIONS = 'wallet_transactions',
	PLAN_CHARGES = 'plan_charges',
	COST_SHEET_CHARGES = 'cost_sheet_charges',
	GROUP_CHARGES = 'group_charges',
	SETTINGS_MEMBERS = 'settings_members',
	CUSTOMER_SUBSCRIPTIONS = 'customer_subscriptions',
	SUBSCRIPTION_LINE_ITEMS = 'subscription_line_items',
	TASK_RUNS = 'task_runs',
}

const usePagination = ({ initialLimit = 10, prefix }: UsePaginationProps = {}) => {
	const [searchParams, setSearchParams] = useSearchParams();

	// Determine the query parameter key based on prefix
	const pageKey = prefix ? `${prefix}_page` : 'page';
	const page = Number(searchParams.get(pageKey) || '1');

	const reset = useCallback(() => {
		if (page === 1) return;
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.set(pageKey, '1');
			return next;
		});
	}, [setSearchParams, pageKey, page]);

	const setPage = useCallback(
		(newPage: number) => {
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);
				next.set(pageKey, String(newPage));
				return next;
			});
		},
		[setSearchParams, pageKey],
	);

	const limit = initialLimit;
	const offset = limit > 0 ? Math.max((page - 1) * limit, 0) : 0;

	// Expose current page, limit, offset, and a setter for page
	return {
		limit,
		offset,
		page,
		setPage,
		reset,
	};
};

export default usePagination;
