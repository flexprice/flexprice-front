import { AxiosClient } from '@/core/axios/verbs';
import { generateQueryParams } from '@/utils/common/api_helper';
import {
	CreateFeatureRequest,
	UpdateFeatureRequest,
	FeatureResponse,
	ListFeaturesResponse,
	FeatureFilter,
	GetFeaturesPayload,
	GetFeaturesResponse,
	GetFeatureByFilterPayload,
	UpdateFeaturePayload,
	CloneFeatureRequest,
} from '@/types/dto';

class FeatureApi {
	private static baseUrl = '/features';

	/**
	 * Create a new feature
	 * @param data Feature creation data
	 * @returns Created feature response
	 */
	public static async createFeature(data: CreateFeatureRequest): Promise<FeatureResponse> {
		return await AxiosClient.post<FeatureResponse, CreateFeatureRequest>(this.baseUrl, data);
	}

	/**
	 * Get a feature by ID
	 * @param id Feature ID
	 * @returns Feature response
	 */
	public static async getFeatureById(id: string): Promise<FeatureResponse> {
		return await AxiosClient.get<FeatureResponse>(`${this.baseUrl}/${id}`);
	}

	/**
	 * List features with optional filtering (GET /features)
	 * @param filter Feature filter parameters
	 * @returns List of features with pagination
	 */
	public static async listFeatures(filter: FeatureFilter = {}): Promise<ListFeaturesResponse> {
		const url = generateQueryParams(this.baseUrl, filter);
		return await AxiosClient.get<ListFeaturesResponse>(url);
	}

	/**
	 * Update a feature by ID
	 * @param id Feature ID
	 * @param data Feature update data
	 * @returns Updated feature response
	 */
	public static async updateFeature(id: string, data: UpdateFeatureRequest): Promise<FeatureResponse> {
		return await AxiosClient.put<FeatureResponse, UpdateFeatureRequest>(`${this.baseUrl}/${id}`, data, {
			allowEmptyKeys: ['group_id'],
		});
	}

	/**
	 * Delete a feature by ID
	 * @param id Feature ID
	 */
	public static async deleteFeature(id: string): Promise<void> {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}

	/**
	 * List features by filter (POST /features/search)
	 * @param filter Feature filter parameters
	 * @returns List of features with pagination
	 */
	public static async listFeaturesByFilter(filter: FeatureFilter): Promise<ListFeaturesResponse> {
		return await AxiosClient.post<ListFeaturesResponse, FeatureFilter>(`${this.baseUrl}/search`, filter);
	}

	// ============================================
	// Legacy methods (for backwards compatibility)
	// ============================================

	/**
	 * @deprecated Use listFeatures instead
	 */
	public static async getAllFeatures(payload: GetFeaturesPayload = {}): Promise<GetFeaturesResponse> {
		const url = generateQueryParams(this.baseUrl, {
			...payload,
			expand: 'meters',
		});
		return await AxiosClient.get<GetFeaturesResponse>(url);
	}

	/**
	 * @deprecated Use listFeaturesByFilter instead
	 */
	public static async getFeaturesByFilter(payload: GetFeatureByFilterPayload): Promise<GetFeaturesResponse> {
		return await AxiosClient.post<GetFeaturesResponse, GetFeatureByFilterPayload>(`${this.baseUrl}/search`, payload);
	}

	/**
	 * @deprecated Use updateFeature instead
	 */
	public static async updateFeatureLegacy(id: string, data: UpdateFeaturePayload): Promise<FeatureResponse> {
		return await AxiosClient.put<FeatureResponse, UpdateFeaturePayload>(`${this.baseUrl}/${id}`, data);
	}

	/**
	 * Clone a Feature
	 * @param id Source feature ID
	 * @param data Clone payload
	 * @returns Newly created feature
	 */
	public static async cloneFeature(id: string, data: CloneFeatureRequest): Promise<FeatureResponse> {
		return await AxiosClient.post<FeatureResponse, CloneFeatureRequest>(`${this.baseUrl}/${id}/clone`, data);
	}
}

export default FeatureApi;
