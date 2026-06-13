import { useSearchParams } from 'react-router';
import { useEffect, useCallback } from 'react';

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
	SUBSCRIPTION_DETAIL_LINE_ITEMS = 'subscription_detail_line_items',
	SUBSCRIPTION_ADDONS = 'subscription_addons',
	TASK_RUNS = 'task_runs',
}

const usePagination = ({ initialLimit = 10, prefix }: UsePaginationProps = {}) => {
	const [searchParams, setSearchParams] = useSearchParams();

	// Determine the query parameter key based on prefix
	const pageKey = prefix ? `${prefix}_page` : 'page';
	const page = Number(searchParams.get(pageKey) || '1');

	const reset = useCallback(() => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.set(pageKey, '1');
			return next;
		});
	}, [setSearchParams, pageKey]);

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

	// Ensure `page` is set in the query parameters
	useEffect(() => {
		if (!searchParams.get(pageKey)) {
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);
					next.set(pageKey, '1');
					return next;
				},
				{ replace: true },
			);
		}
	}, [searchParams, setSearchParams, pageKey]);

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
