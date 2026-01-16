import { AxiosClient } from '@/core/axios/verbs';
import { WindowSize } from '@/models';

export interface DashboardRevenuesRequest {
	revenue_trend?: {
		window_size?: WindowSize | string;
		window_count?: number;
	};
}

export interface RevenueTrendWindow {
	window_start: string;
	window_end: string;
	window_label: string;
	total_revenue: string; // String from backend
}

export interface CurrencyRevenueWindows {
	[currency: string]: {
		windows: RevenueTrendWindow[];
	};
}

export interface RevenueTrendResponse {
	currency_revenue_windows: CurrencyRevenueWindows;
	window_size?: string;
	window_count?: number;
	period_start?: string;
	period_end?: string;
}

export interface RecentSubscriptionPlan {
	plan_id: string;
	plan_name: string;
	count: number;
}

export interface RecentSubscriptionsResponse {
	total_count: number;
	plans: RecentSubscriptionPlan[]; // Changed from "by_plan" to "plans"
	period_start: string;
	period_end: string;
}

export interface InvoicePaymentStatusResponse {
	paid: number;
	pending: number;
	failed: number;
	processing?: number;
	refunded?: number;
	period_start: string;
	period_end: string;
}

export interface DashboardRevenuesResponse {
	revenue_trend?: RevenueTrendResponse;
	recent_subscriptions?: RecentSubscriptionsResponse;
	invoice_payment_status?: InvoicePaymentStatusResponse;
}

class DashboardApi {
	private static baseUrl = '/dashboard';

	/**
	 * Get dashboard revenues data
	 * POST /dashboard/revenues
	 * Returns aggregated dashboard data including revenue trends, recent subscriptions, and invoice payment status
	 */
	public static async getRevenues(payload?: DashboardRevenuesRequest): Promise<DashboardRevenuesResponse> {
		// Transform nested request format to flat format if needed
		const requestPayload = payload?.revenue_trend
			? {
					window_size: payload.revenue_trend.window_size || 'MONTH',
					window_count: payload.revenue_trend.window_count || 3,
				}
			: {
					window_size: 'MONTH',
					window_count: 3,
				};
		return await AxiosClient.post<DashboardRevenuesResponse>(`${this.baseUrl}/revenues`, requestPayload);
	}
}

export default DashboardApi;
