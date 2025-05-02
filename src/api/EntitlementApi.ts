import { AxiosClient } from '@/core/axios/verbs';
import { Entitlement } from '@/models/Entitlement';
import { generateQueryParams } from '@/utils/common/api_helper';
import { EntitlementFilters, EntitlementResponse } from '@/types/dto';

class EntitlementApi {
	private static baseUrl = '/entitlements';

	public static async getAllEntitlements(filters: EntitlementFilters) {
		const url = generateQueryParams(this.baseUrl, filters);
		return await AxiosClient.get<EntitlementResponse>(url);
	}

	public static async getEntitlementById(id: string) {
		return await AxiosClient.get<Entitlement>(`${this.baseUrl}/${id}`);
	}

	public static async deleteEntitlementById(id: string) {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}
}

export default EntitlementApi;
