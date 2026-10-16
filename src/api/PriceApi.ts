import { AxiosClient } from '@/core/axios/verbs';
import {
	CreatePriceRequest,
	UpdatePriceRequest,
	CreateBulkPriceRequest,
	CreateBulkPriceResponse,
	PriceResponse,
	DeletePriceRequest,
	SearchPricesRequest,
	SearchPricesResponse,
	PriceFilter,
	GetAllPricesResponse,
} from '@/types/dto';
import { generateQueryParams } from '@/utils/common/api_helper';

export class PriceApi {
	private static baseUrl = '/prices';

	public static async getPriceById(id: string): Promise<PriceResponse> {
		return await AxiosClient.get<PriceResponse>(`${this.baseUrl}/${id}`);
	}

	/**
	 * List prices with optional filters
	 * @param filters - Optional price filters
	 * @returns Promise<GetAllPricesResponse>
	 */
	public static async ListPrices(filters?: PriceFilter) {
		const url = filters ? generateQueryParams(this.baseUrl, filters) : this.baseUrl;
		return await AxiosClient.get<GetAllPricesResponse>(url);
	}

	/**
	 * Get a price by ID with expanded meter and price unit information
	 * @param id - Price ID
	 * @returns Promise<PriceResponse>
	 */
	public static async GetPriceById(id: string) {
		return await AxiosClient.get<PriceResponse>(`${this.baseUrl}/${id}`);
	}

	/**
	 * Create a new price with the specified configuration
	 * Supports both regular and price unit configurations
	 * @param data - Price configuration
	 * @returns Promise<PriceResponse>
	 */
	public static async CreatePrice(data: CreatePriceRequest) {
		return await AxiosClient.post<PriceResponse>(this.baseUrl, data);
	}

	/**
	 * Create multiple prices in bulk with the specified configurations
	 * Supports both regular and price unit configurations
	 * @param data - Bulk price configuration
	 * @returns Promise<CreateBulkPriceResponse>
	 */
	public static async CreateBulkPrice(data: CreateBulkPriceRequest) {
		return await AxiosClient.post<CreateBulkPriceResponse>(`${this.baseUrl}/bulk`, data);
	}

	/**
	 * Update a price with the specified configuration
	 * Critical fields (amount, billing_model, tier_mode, tiers, transform_quantity)
	 * will create a new price version if effective_from is provided
	 * @param id - Price ID
	 * @param data - Price configuration updates
	 * @returns Promise<PriceResponse>
	 */
	public static async UpdatePrice(id: string, data: UpdatePriceRequest) {
		// allowEmptyKeys so that group_id: '' is sent when user selects "None" to clear the group
		return await AxiosClient.put<PriceResponse>(`${this.baseUrl}/${id}`, data, { allowEmptyKeys: ['group_id'] });
	}

	/**
	 * Delete a price
	 * @param id - Price ID
	 * @param data - Optional delete configuration with end_date
	 * @returns Promise<void>
	 */
	public static async DeletePrice(id: string, data?: DeletePriceRequest) {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`, data || {});
	}

	/**
	 * Search prices by entity and filters (POST /prices/search)
	 * @param payload - entity_ids, entity_type, filters, allow_expired_prices, limit, offset
	 * @returns Promise<SearchPricesResponse>
	 */
	public static async searchPrices(payload: SearchPricesRequest) {
		return await AxiosClient.post<SearchPricesResponse>(`${this.baseUrl}/search`, payload);
	}
}
