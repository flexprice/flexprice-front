import { AxiosClient } from '@/core/axios/verbs';
import { generateQueryParams } from '@/utils/common/api_helper';
import {
	EntitlementFilters,
	EntitlementResponse,
	CreateEntitlementRequest,
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
	public static async createEntitlement(data: CreateEntitlementRequest) {
		return await AxiosClient.post<EntitlementResponse>(this.baseUrl, data);
	}

	/**
	 * Create multiple entitlements in bulk
	 * @param data - Bulk entitlement configuration
	 * @returns Promise<CreateBulkEntitlementResponse>
	 */
	public static async createBulkEntitlement(data: CreateBulkEntitlementRequest) {
		return await AxiosClient.post<CreateBulkEntitlementResponse>(`${this.baseUrl}/bulk`, data);
	}

	/**
	 * Get an entitlement by ID
	 * @param id - Entitlement ID
	 * @returns Promise<EntitlementResponse>
	 */
	public static async getEntitlementById(id: string) {
		return await AxiosClient.get<EntitlementResponse>(`${this.baseUrl}/${id}`);
	}

	/**
	 * Get entitlements with filters (GET method)
	 * @param filters - Filter parameters
	 * @returns Promise<ListEntitlementsResponse>
	 */
	public static async listEntitlements(filters: EntitlementFilters) {
		const url = generateQueryParams(this.baseUrl, filters);
		return await AxiosClient.get<ListEntitlementsResponse>(url);
	}

	/**
	 * Update an entitlement
	 * @param id - Entitlement ID
	 * @param data - Updated entitlement configuration
	 * @returns Promise<EntitlementResponse>
	 */
	public static async updateEntitlement(id: string, data: UpdateEntitlementRequest) {
		return await AxiosClient.put<EntitlementResponse>(`${this.baseUrl}/${id}`, data);
	}

	/**
	 * Delete an entitlement
	 * @param id - Entitlement ID
	 * @returns Promise<void>
	 */
	public static async deleteEntitlement(id: string) {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}

	/**
	 * List entitlements by filter (POST method for complex filters)
	 * @param filters - Filter parameters
	 * @returns Promise<ListEntitlementsResponse>
	 */
	public static async listEntitlementsByFilter(filters: EntitlementFilters) {
		return await AxiosClient.post<ListEntitlementsResponse>(`${this.baseUrl}/search`, filters);
	}

	// Legacy methods for backward compatibility
	/**
	 * @deprecated Use listEntitlements instead
	 */
	public static async getAllEntitlements(filters: EntitlementFilters) {
		return this.listEntitlements(filters);
	}

	/**
	 * @deprecated Use deleteEntitlement instead
	 */
	public static async deleteEntitlementById(id: string) {
		return this.deleteEntitlement(id);
	}

	/**
	 * @deprecated Use createBulkEntitlement instead
	 */
	public static async CreateBulkEntitlement(data: CreateBulkEntitlementRequest) {
		return this.createBulkEntitlement(data);
	}
}

export default EntitlementApi;
