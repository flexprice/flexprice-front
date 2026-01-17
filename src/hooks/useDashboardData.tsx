import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import DashboardApi, { DashboardRevenuesResponse } from '@/api/DashboardApi';
import EnvironmentApi from '@/api/EnvironmentApi';
import { WindowSize } from '@/models';

// Default values matching backend
const DEFAULT_WINDOW_SIZE = WindowSize.MONTH;
const DEFAULT_WINDOW_COUNT = 3;

/**
 * Shared base hook for fetching dashboard revenues data
 * This hook is used by all dashboard-related hooks to avoid duplicate API calls
 */
const useDashboardRevenues = () => {
	const environmentId = EnvironmentApi.getActiveEnvironmentId();

	const {
		data: dashboardData,
		isLoading,
		error,
	} = useQuery<DashboardRevenuesResponse>({
		queryKey: ['dashboard', 'revenues', environmentId],
		queryFn: async () => {
			return await DashboardApi.getRevenues({
				revenue_trend: {
					window_size: DEFAULT_WINDOW_SIZE,
					window_count: DEFAULT_WINDOW_COUNT,
				},
			});
		},
		enabled: !!environmentId, // Only run if environment ID exists
	});

	return { dashboardData, isLoading, error };
};

export const useRecentSubscriptions = () => {
	const { dashboardData, isLoading, error } = useDashboardRevenues();

	const subscriptionsByPlan = useMemo(() => {
		if (!dashboardData?.recent_subscriptions?.plans) return [];
		return dashboardData.recent_subscriptions.plans.map((sub) => ({
			count: sub.count,
			plan_name: sub.plan_name,
			plan_id: sub.plan_id,
		}));
	}, [dashboardData]);

	return {
		subscriptionsCount: dashboardData?.recent_subscriptions?.total_count ?? 0,
		subscriptionsByPlan,
		isLoading,
		error,
	};
};

export const useRevenueData = () => {
	const { dashboardData, isLoading, error } = useDashboardRevenues();

	const revenueData = useMemo(() => {
		if (!dashboardData?.revenue_trend?.currency_revenue_windows) return [];

		// Flatten currency_revenue_windows into an array with currency info
		const allRevenueData: Array<{ month: string; revenue: number; currency: string }> = [];

		Object.entries(dashboardData.revenue_trend.currency_revenue_windows).forEach(([currency, currencyData]) => {
			if (currencyData?.windows) {
				currencyData.windows.forEach((window) => {
					allRevenueData.push({
						month: window.window_label,
						revenue: parseFloat(window.total_revenue ?? '0'),
						currency: currency.toUpperCase(), // Convert lowercase currency code to uppercase (e.g., "usd" -> "USD")
					});
				});
			}
		});

		return allRevenueData;
	}, [dashboardData]);

	return {
		revenueData,
		isLoading,
		error,
	};
};

export const useInvoiceIssues = () => {
	const { dashboardData, isLoading, error } = useDashboardRevenues();

	// Transform invoice payment status counts to match component expectations
	const invoicesByStatus = useMemo(() => {
		const invoiceStatus = dashboardData?.invoice_payment_status;
		if (!invoiceStatus) {
			return {
				paid: [],
				failed: [],
				pending: [],
				processing: [],
				refunded: [],
				total: 0,
			};
		}

		// Create arrays with placeholder invoice objects for each count
		// The component only uses the length, so we create empty objects
		const paid = invoiceStatus.paid ?? 0;
		const failed = invoiceStatus.failed ?? 0;
		const pending = invoiceStatus.pending ?? 0;
		const processing = invoiceStatus.processing ?? 0;
		const refunded = invoiceStatus.refunded ?? 0;

		return {
			paid: Array(paid).fill({}),
			failed: Array(failed).fill({}),
			pending: Array(pending).fill({}),
			processing: Array(processing).fill({}),
			refunded: Array(refunded).fill({}),
			total: paid + failed + pending + processing + refunded,
		};
	}, [dashboardData]);

	return {
		invoicesByStatus,
		pastDueSubscriptions: [], // Not provided by new API
		isLoading,
		errors: error ? [error] : [],
		// Legacy support - keeping these for backward compatibility
		failedPaymentInvoices: invoicesByStatus.failed,
	};
};
