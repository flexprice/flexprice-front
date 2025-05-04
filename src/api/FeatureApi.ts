import { AxiosClient } from '@/core/axios/verbs';
import Feature from '@/models/Feature';
import { generateQueryParams } from '@/utils/common/api_helper';
import { PaginationType } from '@/models/Pagination';
import { TypedBackendSort, TypedBackendFilter } from '@/types/formatters/QueryBuilder';

interface GetFeaturesPayload {
	end_time?: string;
	expand?: string;
	feature_ids?: string[];
	limit?: number;
	lookup_key?: string;
	offset?: number;
	order?: string;
	sort?: string;
	name_contains?: string;
	start_time?: string;
	status?: string;
}

interface GetFeaturesResponse {
	items: Feature[];
	pagination: PaginationType;
}

interface GetFeatureByFilterPayload extends PaginationType {
	filters: TypedBackendFilter[];
	sort: TypedBackendSort[];
}

class FeatureApi {
	private static baseUrl = '/features';

	public static async getAllFeatures(payload: GetFeaturesPayload = {}): Promise<GetFeaturesResponse> {
		const url = generateQueryParams(this.baseUrl, {
			...payload,
			expand: 'meters',
		});
		return await AxiosClient.get<GetFeaturesResponse>(url);
	}

	public static async getFeatureById(id: string) {
		return await AxiosClient.get<Feature>(`${this.baseUrl}/${id}`);
	}

	public static async createFeature(data: Partial<Feature>) {
		return await AxiosClient.post<Feature, Partial<Feature>>(this.baseUrl, data);
	}

	public static async updateFeature(id: string, data: Partial<Feature>) {
		return await AxiosClient.put<Feature, Partial<Feature>>(`${this.baseUrl}/${id}`, data);
	}

	public static async deleteFeature(id: string) {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}

	public static async getFeaturesByFilter(payload: GetFeatureByFilterPayload) {
		return await AxiosClient.post<GetFeaturesResponse, GetFeatureByFilterPayload>(`${this.baseUrl}/search`, payload);
	}
}

export default FeatureApi;
