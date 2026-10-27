import { AxiosClient } from '@/core/axios/verbs';
import {
	EntitlementFilter,
	EntitlementResponse,
	CreateEntitlementRequest,
	CreateSubscriptionGrantRequest,
	CreateBulkEntitlementRequest,
	CreateBulkEntitlementResponse,
	UpdateEntitlementRequest,
	ListEntitlementsResponse,
} from '@/types/dto/Entitlement';

class EntitlementApi {
	private static baseUrl = '/entitlements';

	/**
	 * Create a new entitlement
	 * @param data - Entitlement configuration
	 * @returns Promise<EntitlementResponse>
	 */
	public static async create(data: CreateEntitlementRequest) {
		return await AxiosClient.post<EntitlementResponse>(this.baseUrl, data);
	}

	/**
	 * Create a subscription grant: a dollar allowance over every usage line on a subscription
	 * @param data - Grant configuration
	 * @returns Promise<EntitlementResponse>
	 */
	public static async createSubscriptionGrant(data: CreateSubscriptionGrantRequest) {
		return await AxiosClient.post<EntitlementResponse>(this.baseUrl, data);
	}

	/**
	 * Create multiple entitlements in bulk
	 * @param data - Bulk entitlement configuration
	 * @returns Promise<CreateBulkEntitlementResponse>
	 */
	public static async createBulk(data: CreateBulkEntitlementRequest) {
		return await AxiosClient.post<CreateBulkEntitlementResponse>(`${this.baseUrl}/bulk`, data);
	}

	/**
	 * Get an entitlement by ID
	 * @param id - Entitlement ID
	 * @returns Promise<EntitlementResponse>
	 */
	public static async get(id: string) {
		return await AxiosClient.get<EntitlementResponse>(`${this.baseUrl}/${id}`);
	}

	/**
	 * Search entitlements with complex filters (POST /entitlements/search)
	 * @param filters - Complex filters, sorts, and pagination
	 * @returns Promise<ListEntitlementsResponse>
	 */
	public static async search(filters: EntitlementFilter) {
		return await AxiosClient.post<ListEntitlementsResponse>(`${this.baseUrl}/search`, filters);
	}

	/**
	 * Update an entitlement
	 * @param id - Entitlement ID
	 * @param data - Updated entitlement configuration
	 * @returns Promise<EntitlementResponse>
	 */
	public static async update(id: string, data: UpdateEntitlementRequest) {
		return await AxiosClient.put<EntitlementResponse>(`${this.baseUrl}/${id}`, data);
	}

	/**
	 * Delete an entitlement
	 * @param id - Entitlement ID
	 * @returns Promise<void>
	 */
	public static async delete(id: string) {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}
}

export default EntitlementApi;
