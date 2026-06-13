import { AxiosClient } from '@/core/axios/verbs';
import { SubscriptionUsage } from '@/models';
import {
	ListSubscriptionsPayload,
	ListSubscriptionsResponse,
	GetSubscriptionDetailsPayload,
	GetSubscriptionPreviewResponse,
	CancelSubscriptionPayload,
	CreateSubscriptionRequest,
	UpdateSubscriptionRequest,
	CancelSubscriptionRequest,
	CancelSubscriptionResponse,
	SubscriptionResponse,
	GetUsageBySubscriptionRequest,
	GetUsageBySubscriptionResponse,
	AddAddonRequest,
	RemoveAddonRequest,
	AddonAssociationResponse,
	ListAddonAssociationsResponse,
	CreateSubscriptionLineItemRequest,
	UpdateSubscriptionLineItemRequest,
	DeleteSubscriptionLineItemRequest,
	SubscriptionLineItemResponse,
	PreviewSubscriptionChangeRequest,
	PreviewSubscriptionChangeResponse,
	ExecuteSubscriptionChangeRequest,
	ExecuteSubscriptionChangeResponse,
	ExecuteSubscriptionModifyRequest,
	SubscriptionModifyResponse,
	SubscriptionLineItemFilter,
	ListSubscriptionLineItemsResponse,
} from '@/types/dto/Subscription';
import { ListCreditGrantApplicationsResponse } from '@/types/dto';
import { generateQueryParams } from '@/utils/common/api_helper';

class SubscriptionApi {
	private static baseUrl = '/subscriptions';

	// =============================================================================
	// CORE SUBSCRIPTION METHODS
	// =============================================================================

	/**
	 * Get a subscription by ID (full response)
	 */
	public static async getSubscription(id: string): Promise<SubscriptionResponse> {
		return await AxiosClient.get<SubscriptionResponse>(`${this.baseUrl}/${id}`);
	}

	/**
	 * Get a subscription by ID with expand options (v2 - minimal response support)
	 * @param id - Subscription ID
	 * @param options - Optional parameters
	 * @param options.expand - Comma-separated list of fields to expand (e.g., 'plan,schedule'). Pass empty string for minimal response.
	 */
	public static async getSubscriptionV2(id: string, options?: { expand?: string }): Promise<SubscriptionResponse> {
		const params = new URLSearchParams();
		if (options?.expand !== undefined) {
			params.append('expand', options.expand);
		}
		const queryString = params.toString();
		const url = queryString ? `${this.baseUrl}/${id}/v2?${queryString}` : `${this.baseUrl}/${id}/v2`;
		return await AxiosClient.get<SubscriptionResponse>(url);
	}

	/**
	 * Create a new subscription
	 */
	public static async createSubscription(payload: CreateSubscriptionRequest): Promise<SubscriptionResponse> {
		return await AxiosClient.post(this.baseUrl, payload);
	}

	/**
	 * Update a subscription (PUT /subscriptions/:id)
	 */
	public static async updateSubscription(id: string, payload: UpdateSubscriptionRequest): Promise<SubscriptionResponse> {
		return await AxiosClient.put<SubscriptionResponse>(`${this.baseUrl}/${id}`, payload);
	}

	/**
	 * List subscriptions
	 */
	public static async listSubscriptions(payload: ListSubscriptionsPayload): Promise<ListSubscriptionsResponse> {
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get<ListSubscriptionsResponse>(url);
	}

	/**
	 * Search subscriptions
	 */
	public static async searchSubscriptions(payload: ListSubscriptionsPayload): Promise<ListSubscriptionsResponse> {
		return await AxiosClient.post(`${this.baseUrl}/search`, { ...payload });
	}

	/**
	 * Cancel subscription
	 */
	public static async cancelSubscription(
		id: string,
		payload: CancelSubscriptionPayload | CancelSubscriptionRequest,
	): Promise<void | CancelSubscriptionResponse> {
		return await AxiosClient.post(`${this.baseUrl}/${id}/cancel`, payload);
	}

	// =============================================================================
	// SUBSCRIPTION STATUS METHODS
	// =============================================================================

	/**
	 * Activate draft subscription
	 */
	public static async activateSubscription(id: string, payload: { start_date: string }): Promise<SubscriptionResponse> {
		return await AxiosClient.post<SubscriptionResponse>(`${this.baseUrl}/${id}/activate`, payload);
	}

	// =============================================================================
	// USAGE & ANALYTICS METHODS
	// =============================================================================

	/**
	 * Get subscription usage (legacy)
	 */
	public static async getSubscriptionUsage(id: string): Promise<SubscriptionUsage> {
		return await AxiosClient.post(`${this.baseUrl}/usage`, { subscription_id: id });
	}

	/**
	 * Get usage by subscription
	 */
	public static async getUsageBySubscription(
		payload: GetUsageBySubscriptionRequest | { subscription_id: string },
	): Promise<GetUsageBySubscriptionResponse> {
		return await AxiosClient.post<GetUsageBySubscriptionResponse>(`${this.baseUrl}/usage`, payload);
	}

	/**
	 * Get subscription invoices preview
	 */
	public static async getSubscriptionInvoicesPreview(payload: GetSubscriptionDetailsPayload): Promise<GetSubscriptionPreviewResponse> {
		return await AxiosClient.post('/invoices/preview', payload, {
			timeout: 60000, // 1 minute
		});
	}

	// =============================================================================
	// ADDON MANAGEMENT METHODS
	// =============================================================================

	/**
	 * Add addon to subscription
	 */
	public static async addAddonToSubscription(payload: AddAddonRequest): Promise<AddonAssociationResponse> {
		return await AxiosClient.post<AddonAssociationResponse>(`${this.baseUrl}/addon`, payload);
	}

	/**
	 * Get active addons for a subscription
	 */
	public static async getActiveAddons(
		subscriptionId: string,
		params?: { limit?: number; offset?: number },
	): Promise<ListAddonAssociationsResponse> {
		const url = params
			? generateQueryParams(`${this.baseUrl}/${subscriptionId}/addons/associations`, params)
			: `${this.baseUrl}/${subscriptionId}/addons/associations`;
		return await AxiosClient.get<ListAddonAssociationsResponse>(url);
	}

	/**
	 * Remove addon from subscription
	 */
	public static async removeAddonFromSubscription(payload: RemoveAddonRequest): Promise<{ message: string }> {
		return await AxiosClient.delete(`${this.baseUrl}/addon`, payload);
	}

	// =============================================================================
	// SUBSCRIPTION LINE ITEM METHODS
	// =============================================================================

	/**
	 * Create a new subscription line item (POST /subscriptions/{id}/lineitems)
	 */
	public static async createSubscriptionLineItem(
		subscriptionId: string,
		payload: CreateSubscriptionLineItemRequest,
	): Promise<SubscriptionLineItemResponse> {
		return await AxiosClient.post<SubscriptionLineItemResponse>(`${this.baseUrl}/${subscriptionId}/lineitems`, payload);
	}

	/**
	 * Update a subscription line item
	 */
	public static async updateSubscriptionLineItem(
		id: string,
		payload: UpdateSubscriptionLineItemRequest,
	): Promise<SubscriptionLineItemResponse> {
		return await AxiosClient.put<SubscriptionLineItemResponse>(`${this.baseUrl}/lineitems/${id}`, payload);
	}

	/**
	 * Delete a subscription line item
	 */
	public static async deleteSubscriptionLineItem(id: string, payload: DeleteSubscriptionLineItemRequest): Promise<void> {
		return await AxiosClient.delete(`${this.baseUrl}/lineitems/${id}`, payload);
	}

	/**
	 * Search subscription line items (POST /subscriptions/lineitems/search).
	 * JSON body matches {@link SubscriptionLineItemFilter} (subscription/customer/price, pagination, expand=prices, etc.).
	 */
	public static async searchSubscriptionLineItems(filter: SubscriptionLineItemFilter): Promise<ListSubscriptionLineItemsResponse> {
		return await AxiosClient.post<ListSubscriptionLineItemsResponse>(`${this.baseUrl}/lineitems/search`, filter);
	}

	// =============================================================================
	// SUBSCRIPTION ENTITLEMENT METHODS
	// =============================================================================

	/**
	 * Get subscription entitlements
	 */
	public static async getSubscriptionEntitlements(subscriptionId: string) {
		return await AxiosClient.get<{ features: any[]; subscription_id: string; plan_id: string }>(
			`${this.baseUrl}/${subscriptionId}/entitlements`,
		);
	}

	// =============================================================================
	// CREDIT GRANT APPLICATION METHODS
	// =============================================================================

	/**
	 * Get upcoming credit grant applications for a subscription
	 */
	public static async getUpcomingCreditGrantApplications(subscriptionId: string): Promise<ListCreditGrantApplicationsResponse> {
		return await AxiosClient.get<ListCreditGrantApplicationsResponse>(`${this.baseUrl}/${subscriptionId}/grants/upcoming`);
	}

	// =============================================================================
	// SUBSCRIPTION CHANGE METHODS
	// =============================================================================

	/**
	 * Preview subscription change (upgrade/downgrade)
	 * POST /subscriptions/:id/change/preview
	 */
	public static async previewSubscriptionChange(
		id: string,
		payload: PreviewSubscriptionChangeRequest,
	): Promise<PreviewSubscriptionChangeResponse> {
		return await AxiosClient.post<PreviewSubscriptionChangeResponse>(`${this.baseUrl}/${id}/change/preview`, payload);
	}

	/**
	 * Execute subscription change (upgrade/downgrade)
	 * POST /subscriptions/:id/change/execute
	 */
	public static async executeSubscriptionChange(
		id: string,
		payload: ExecuteSubscriptionChangeRequest,
	): Promise<ExecuteSubscriptionChangeResponse> {
		return await AxiosClient.post<ExecuteSubscriptionChangeResponse>(`${this.baseUrl}/${id}/change/execute`, payload);
	}

	// =============================================================================
	// SUBSCRIPTION MODIFY METHODS (inheritance | quantity_change | grouped_invoicing)
	// =============================================================================

	/**
	 * Preview mid-cycle subscription modification without committing.
	 * POST /subscriptions/:id/modify/preview
	 */
	public static async previewSubscriptionModify(
		id: string,
		payload: ExecuteSubscriptionModifyRequest,
	): Promise<SubscriptionModifyResponse> {
		return await AxiosClient.post<SubscriptionModifyResponse>(`${this.baseUrl}/${id}/modify/preview`, payload);
	}

	/**
	 * Execute mid-cycle subscription modification (`inheritance`, `quantity_change`, or `grouped_invoicing`).
	 * POST /subscriptions/:id/modify/execute
	 */
	public static async executeSubscriptionModify(
		id: string,
		payload: ExecuteSubscriptionModifyRequest,
	): Promise<SubscriptionModifyResponse> {
		return await AxiosClient.post<SubscriptionModifyResponse>(`${this.baseUrl}/${id}/modify/execute`, payload);
	}
}

export default SubscriptionApi;
