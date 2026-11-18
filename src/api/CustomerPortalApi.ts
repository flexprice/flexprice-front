import { AxiosClient } from '@/core/axios/verbs';
import { Customer, Invoice, RealtimeWalletBalance } from '@/models';
import {
	UpdateCustomerRequest,
	GetUsageSummaryResponse,
	PortalPropertyKeysRequest,
	PortalPropertyValuesRequest,
	PropertyKeysResponse,
	PropertyValuesResponse,
} from '@/types/dto';
import {
	GetCustomerUsageSummaryRequest,
	DashboardPaginatedRequest,
	DashboardAnalyticsRequest,
	DashboardCostAnalyticsRequest,
} from '@/types';
import { SubscriptionResponse, ListSubscriptionsResponse } from '@/types/dto/Subscription';
import { GetInvoicesResponse } from '@/types/dto/InvoiceApi';
import { WalletResponse, WalletTransactionResponse } from '@/types/dto/Wallet';
import { GetUsageAnalyticsResponse } from '@/types/dto/Events';
import { GetDetailedCostAnalyticsResponse } from '@/types/dto/Cost';
import { generateQueryParams } from '@/utils/common/api_helper';
import { PortalConfig, DEFAULT_PORTAL_CONFIG, deepMergePortalConfig } from '@/types/dto/PortalConfig';
import {
	PortalTopUpRequest,
	PortalTopUpResponse,
	PortalAutoTopupRequest,
	PortalListPaymentMethodsQuery,
	SavedPaymentMethodsResponse,
	PortalAddPaymentMethodRequest,
	AddPaymentMethodResponse,
	PortalDeletePaymentMethodRequest,
	PortalSetDefaultPaymentMethodRequest,
	PortalPayInvoiceRequest,
	PortalPayInvoiceResponse,
	PortalIntegrationsResponse,
	PortalCheckoutSession,
} from '@/types/dto/CustomerPortalBilling';

/**
 * CustomerPortalApi - Customer-facing dashboard APIs
 * All methods require dashboard token authentication (set via setRuntimeCredentials)
 */
class CustomerPortalApi {
	private static baseUrl = '/customer/portal';

	/**
	 * Get the authenticated customer's information
	 */
	public static async getCustomer(): Promise<Customer> {
		return await AxiosClient.get<Customer>(`${this.baseUrl}/info`);
	}

	/**
	 * Update the authenticated customer's information
	 */
	public static async updateCustomer(payload: UpdateCustomerRequest): Promise<Customer> {
		return await AxiosClient.put<Customer>(`${this.baseUrl}/info`, payload);
	}

	/**
	 * Get usage summary for the authenticated customer
	 */
	public static async getUsageSummary(query?: GetCustomerUsageSummaryRequest): Promise<GetUsageSummaryResponse> {
		// refresh_grants measures grant usage now instead of returning the last alert run's snapshot.
		const url = generateQueryParams(`${this.baseUrl}/usage`, { ...query, refresh_grants: true });
		return await AxiosClient.get<GetUsageSummaryResponse>(url);
	}

	/**
	 * Get subscriptions for the authenticated customer with pagination
	 */
	public static async getSubscriptions(payload: DashboardPaginatedRequest): Promise<ListSubscriptionsResponse> {
		return await AxiosClient.post<ListSubscriptionsResponse>(`${this.baseUrl}/subscriptions`, payload);
	}

	/**
	 * Get a specific subscription by ID for the authenticated customer
	 */
	public static async getSubscription(id: string): Promise<SubscriptionResponse> {
		return await AxiosClient.get<SubscriptionResponse>(`${this.baseUrl}/subscriptions/${id}`);
	}

	/**
	 * Get invoices for the authenticated customer with pagination
	 */
	public static async getInvoices(payload: DashboardPaginatedRequest): Promise<GetInvoicesResponse> {
		return await AxiosClient.post<GetInvoicesResponse>(`${this.baseUrl}/invoices`, payload);
	}

	/**
	 * Get a specific invoice by ID for the authenticated customer
	 */
	public static async getInvoice(id: string): Promise<Invoice> {
		return await AxiosClient.get<Invoice>(`${this.baseUrl}/invoices/${id}`);
	}

	/**
	 * Get wallets for the authenticated customer
	 */
	public static async getWallets(): Promise<WalletResponse[]> {
		return await AxiosClient.post<WalletResponse[]>(`${this.baseUrl}/wallets`, {});
	}

	/**
	 * Get a specific wallet by ID for the authenticated customer
	 */
	public static async getWallet(id: string): Promise<WalletResponse> {
		return await AxiosClient.get<WalletResponse>(`${this.baseUrl}/wallets/${id}`);
	}

	/**
	 * Get usage analytics for the authenticated customer
	 */
	public static async getAnalytics(payload: DashboardAnalyticsRequest): Promise<GetUsageAnalyticsResponse> {
		return await AxiosClient.post<GetUsageAnalyticsResponse>(`${this.baseUrl}/analytics/revenue`, payload);
	}

	/**
	 * Property keys the customer may group or filter usage by, most seen first
	 */
	public static async getPropertyKeys(payload: PortalPropertyKeysRequest): Promise<PropertyKeysResponse> {
		return await AxiosClient.post<PropertyKeysResponse>(`${this.baseUrl}/analytics/properties`, payload);
	}

	/**
	 * Values of one property key in the customer's usage, most seen first
	 */
	public static async getPropertyValues(payload: PortalPropertyValuesRequest): Promise<PropertyValuesResponse> {
		return await AxiosClient.post<PropertyValuesResponse>(`${this.baseUrl}/analytics/properties/values`, payload);
	}

	/**
	 * Get cost analytics for the authenticated customer
	 */
	public static async getCostAnalytics(payload: DashboardCostAnalyticsRequest): Promise<GetDetailedCostAnalyticsResponse> {
		return await AxiosClient.post<GetDetailedCostAnalyticsResponse>(`${this.baseUrl}/analytics/cost`, payload);
	}

	/**
	 * Get a presigned URL for downloading an invoice PDF for the authenticated customer
	 */
	public static async downloadInvoicePdf(invoiceId: string): Promise<void> {
		const url = generateQueryParams(`${this.baseUrl}/invoices/${invoiceId}/pdf`, { url: true });
		const response = await AxiosClient.get<{ presigned_url: string }>(url);
		const presignedUrl = response.presigned_url;
		window.open(presignedUrl, '_blank');
	}

	/**
	 * Get real-time balance for a wallet belonging to the authenticated customer
	 */
	public static async getWalletBalance(walletId: string): Promise<RealtimeWalletBalance> {
		return await AxiosClient.get<RealtimeWalletBalance>(`${this.baseUrl}/wallets/${walletId}`);
	}

	/**
	 * Get transactions for a wallet belonging to the authenticated customer with pagination
	 */
	public static async getWalletTransactions(payload: {
		walletId: string;
		limit?: number;
		offset?: number;
	}): Promise<WalletTransactionResponse> {
		const { walletId, limit = 10, offset = 0 } = payload;
		const url = generateQueryParams(`${this.baseUrl}/wallets/${walletId}/transactions`, { limit, offset });
		return await AxiosClient.get<WalletTransactionResponse>(url);
	}

	/**
	 * Top up a wallet. Pass `checkout` to charge now; omit it to raise an invoice
	 * the customer settles later.
	 */
	public static async topUpWallet(walletId: string, payload: PortalTopUpRequest): Promise<PortalTopUpResponse> {
		return await AxiosClient.post<PortalTopUpResponse>(`${this.baseUrl}/wallets/${walletId}/top-up`, payload);
	}

	/**
	 * Configure auto top-up. The payload is flat: invoicing is the tenant's call,
	 * and enabling auto top-up is itself the consent to be charged unattended.
	 */
	public static async updateAutoTopup(walletId: string, payload: PortalAutoTopupRequest): Promise<unknown> {
		return await AxiosClient.put<unknown>(`${this.baseUrl}/wallets/${walletId}/auto-topup`, payload);
	}

	/**
	 * Start payment for an invoice. The amount comes from the invoice — a customer
	 * cannot part-pay. Read `payment_action` for what to do next.
	 */
	public static async payInvoice(invoiceId: string, payload: PortalPayInvoiceRequest = {}): Promise<PortalPayInvoiceResponse> {
		return await AxiosClient.post<PortalPayInvoiceResponse>(`${this.baseUrl}/invoices/${invoiceId}/pay`, payload);
	}

	/**
	 * Saved payment methods, grouped by provider. A group may carry an `error`
	 * instead of items — that is "we could not ask", not "none saved".
	 */
	public static async getPaymentMethods(query?: PortalListPaymentMethodsQuery): Promise<SavedPaymentMethodsResponse> {
		const url = generateQueryParams(`${this.baseUrl}/payment-methods`, query || {});
		return await AxiosClient.get<SavedPaymentMethodsResponse>(url);
	}

	/**
	 * Begin adding a payment method. Returns an action, not a method — nothing is
	 * vaulted yet. Follow `action.url` when `action.type` is 'redirect'.
	 */
	public static async addPaymentMethod(payload: PortalAddPaymentMethodRequest): Promise<AddPaymentMethodResponse> {
		return await AxiosClient.post<AddPaymentMethodResponse>(`${this.baseUrl}/payment-methods`, payload);
	}

	/**
	 * Remove a saved payment method. Returns the refreshed list — the backend
	 * re-reads the affected gateway — so callers can seed the cache rather than
	 * spend another round trip on it.
	 */
	public static async deletePaymentMethod(payload: PortalDeletePaymentMethodRequest): Promise<SavedPaymentMethodsResponse> {
		return await AxiosClient.post<SavedPaymentMethodsResponse>(`${this.baseUrl}/payment-methods/delete`, payload);
	}

	/** Defaults are scoped per provider, so the provider is required. Returns the refreshed list. */
	public static async setDefaultPaymentMethod(payload: PortalSetDefaultPaymentMethodRequest): Promise<SavedPaymentMethodsResponse> {
		return await AxiosClient.post<SavedPaymentMethodsResponse>(`${this.baseUrl}/payment-methods/default`, payload);
	}

	/**
	 * Which providers are connected and what each can do. Drives whether the portal
	 * offers checkout, saved-card management or a default-method control at all.
	 */
	public static async getIntegrations(): Promise<PortalIntegrationsResponse> {
		return await AxiosClient.get<PortalIntegrationsResponse>(`${this.baseUrl}/integrations`);
	}

	/** Poll a checkout session to see whether the customer completed payment. */
	public static async getCheckoutSession(sessionId: string): Promise<PortalCheckoutSession> {
		return await AxiosClient.get<PortalCheckoutSession>(`${this.baseUrl}/checkout-sessions/${sessionId}`);
	}

	public static async cancelCheckoutSession(sessionId: string): Promise<PortalCheckoutSession> {
		return await AxiosClient.post<PortalCheckoutSession>(`${this.baseUrl}/checkout-sessions/${sessionId}/cancel`, {});
	}

	/**
	 * Get the portal configuration for this tenant.
	 * Backend merges tenant-specific config with defaults and returns the resolved PortalConfig.
	 * Falls back to DEFAULT_PORTAL_CONFIG on any error (no config stored, expired token, etc.)
	 */
	public static async getConfig(): Promise<PortalConfig> {
		try {
			const response = await AxiosClient.get<{ value: Partial<PortalConfig> }>(`${this.baseUrl}/config`);
			if (response?.value) {
				return deepMergePortalConfig(DEFAULT_PORTAL_CONFIG, response.value);
			}
			return DEFAULT_PORTAL_CONFIG;
		} catch {
			// No config stored yet or network error — use bundled defaults silently
			return DEFAULT_PORTAL_CONFIG;
		}
	}
}

export default CustomerPortalApi;
