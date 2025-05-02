import { AxiosClient } from '@/core/axios/verbs';
import Feature from '@/models/Feature';
import { generateQueryParams } from '@/utils/common/api_helper';
import { GetFeaturesPayload, GetFeaturesResponse, GetFeatureByFilterPayload } from '@/types/dto';

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
