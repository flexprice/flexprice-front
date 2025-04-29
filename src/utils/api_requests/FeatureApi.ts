import { AxiosClient } from '@/core/axios/verbs';
import Feature from '@/models/Feature';
import { generateQueryParams } from '../common/api_helper';
import { PaginationType } from '@/models/Pagination';
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
}

export default FeatureApi;
