import { AxiosClient } from '@/core/axios/verbs';
import { Entitlement } from '@/models/Entitlement';
import { Plan } from '@/models/Plan';
import { generateQueryParams } from '@/utils/common/api_helper';
import { PaginationType } from '@/models/Pagination';
import Feature from '@/models/Feature';
import { BaseEntityStatus } from '@/types/common';
interface EntitlementFilters {
	end_time?: string;
	expand?: string;
	feature_ids?: string[];
	feature_type?: 'metered' | 'boolean' | 'static';
	is_enabled?: boolean;
	limit?: number;
	offset?: number;
	order?: 'asc' | 'desc';
	plan_ids?: string[];
	sort?: string;
	start_time?: string;
	status?: BaseEntityStatus;
}

export interface ExtendedEntitlement extends Entitlement {
	plan: Plan;
	feature: Feature;
}

interface EntitlementResponse {
	items: ExtendedEntitlement[] | Entitlement[];
	pagination: PaginationType;
}

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
