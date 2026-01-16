import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import DashboardApi from '@/api/DashboardApi';
import EnvironmentApi from '@/api/EnvironmentApi';
import { WindowSize } from '@/models';

// Default values matching backend
const DEFAULT_WINDOW_SIZE = WindowSize.MONTH;
const DEFAULT_WINDOW_COUNT = 3;

export const useRecentSubscriptions = () => {
	const environmentId = EnvironmentApi.getActiveEnvironmentId();

	const {
		data: dashboardData,
		isLoading: subscriptionsLoading,
		error: subscriptionsError,
	} = useQuery({
		queryKey: ['dashboard', 'revenues', environmentId],
		queryFn: async () => {
			return await DashboardApi.getRevenues({
				revenue_trend: {
					window_size: DEFAULT_WINDOW_SIZE,
					window_count: DEFAULT_WINDOW_COUNT,
				},
			});
		},
		staleTime: 0, // No caching
		gcTime: 0, // No garbage collection time
		refetchOnWindowFocus: true,
		refetchOnMount: true,
		enabled: !!environmentId, // Only run if environment ID exists
	});

	const subscriptionsByPlan = useMemo(() => {
		if (!dashboardData?.recent_subscriptions?.plans) return [];
		return dashboardData.recent_subscriptions.plans.map((sub) => ({
			count: sub.count,
			plan_name: sub.plan_name,
			plan_id: sub.plan_id,
		}));
	}, [dashboardData]);

	return {
		subscriptionsCount: dashboardData?.recent_subscriptions?.total_count || 0,
		subscriptionsByPlan,
		isLoading: subscriptionsLoading,
		error: subscriptionsError,
	};
};

export const useRevenueData = () => {
	const environmentId = EnvironmentApi.getActiveEnvironmentId();

	const {
		data: dashboardData,
		isLoading: revenueLoading,
		error: revenueError,
	} = useQuery({
		queryKey: ['dashboard', 'revenues', environmentId],
		queryFn: async () => {
			return await DashboardApi.getRevenues({
				revenue_trend: {
					window_size: DEFAULT_WINDOW_SIZE,
					window_count: DEFAULT_WINDOW_COUNT,
				},
			});
		},
		staleTime: 0, // No caching
		gcTime: 0, // No garbage collection time
		refetchOnWindowFocus: true,
		refetchOnMount: true,
		enabled: !!environmentId, // Only run if environment ID exists
	});

	const revenueData = useMemo(() => {
		if (!dashboardData?.revenue_trend?.currency_revenue_windows) return [];

		// Flatten currency_revenue_windows into an array with currency info
		const allRevenueData: Array<{ month: string; revenue: number; currency: string }> = [];

		Object.entries(dashboardData.revenue_trend.currency_revenue_windows).forEach(([currency, currencyData]) => {
			if (currencyData && currencyData.windows) {
				currencyData.windows.forEach((window) => {
					allRevenueData.push({
						month: window.window_label,
						revenue: parseFloat(window.total_revenue || '0'),
						currency: currency.toUpperCase(), // Convert lowercase currency code to uppercase (e.g., "usd" -> "USD")
					});
				});
			}
		});

		return allRevenueData;
	}, [dashboardData]);

	return {
		revenueData,
		isLoading: revenueLoading,
		error: revenueError,
	};
};

export const useInvoiceIssues = () => {
	const environmentId = EnvironmentApi.getActiveEnvironmentId();

	const {
		data: dashboardData,
		isLoading: invoiceIssuesLoading,
		error: invoiceErrors,
	} = useQuery({
		queryKey: ['dashboard', 'revenues', environmentId],
		queryFn: async () => {
			return await DashboardApi.getRevenues({
				revenue_trend: {
					window_size: DEFAULT_WINDOW_SIZE,
					window_count: DEFAULT_WINDOW_COUNT,
				},
			});
		},
		staleTime: 0, // No caching
		gcTime: 0, // No garbage collection time
		refetchOnWindowFocus: true,
		refetchOnMount: true,
		enabled: !!environmentId, // Only run if environment ID exists
	});

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
		return {
			paid: Array(invoiceStatus.paid || 0).fill({}),
			failed: Array(invoiceStatus.failed || 0).fill({}),
			pending: Array(invoiceStatus.pending || 0).fill({}),
			processing: Array(invoiceStatus.processing || 0).fill({}),
			refunded: Array(invoiceStatus.refunded || 0).fill({}),
			total:
				(invoiceStatus.paid || 0) +
				(invoiceStatus.failed || 0) +
				(invoiceStatus.pending || 0) +
				(invoiceStatus.processing || 0) +
				(invoiceStatus.refunded || 0),
		};
	}, [dashboardData]);

	return {
		invoicesByStatus,
		pastDueSubscriptions: [], // Not provided by new API
		isLoading: invoiceIssuesLoading,
		errors: invoiceErrors ? [invoiceErrors] : [],
		// Legacy support - keeping these for backward compatibility
		failedPaymentInvoices: invoicesByStatus.failed,
	};
};
