import { AxiosClient } from '@/core/axios/verbs';
import { Plan } from '@/models/Plan';
import { Pagination } from '@/models/Pagination';
import { ExpandedPlan } from '@/utils/models/transformed_plan';
import { generateQueryParams } from '@/utils/common/api_helper';
import { GetPlanCreditGrantsResponse, SynchronizePlanPricesWithSubscriptionResponse } from '@/types/dto/Plan';
import { TypedBackendFilter, TypedBackendSort } from '@/types/formatters/QueryBuilder';

export interface GetAllPlansResponse {
	items: Plan[] | ExpandedPlan[];
	pagination: Pagination;
}

export interface GetPlansByFilterPayload extends Pagination {
	filters: TypedBackendFilter[];
	sort: TypedBackendSort[];
}

export class PlanApi {
	private static baseUrl = '/plans';

	public static async createPlan(data: Partial<Plan>) {
		return await AxiosClient.post<Plan, Partial<Plan>>(this.baseUrl, data);
	}

	public static async getAllPlans({ limit, offset }: Pagination) {
		const payload = {
			limit,
			offset,
			expand: 'entitlements,prices,meters,features',
		};
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get<GetAllPlansResponse>(url);
	}
	public static async getAllActivePlans({ limit, offset }: Pagination) {
		const payload = {
			status: 'published',
			limit,
			offset,
			expand: 'entitlements,prices,meters,features',
		};
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get<GetAllPlansResponse>(url);
	}

	public static async getExpandedPlan() {
		const payload = {
			expand: 'prices%2Cmeters%2Centitlements',
		};
		const url = generateQueryParams(this.baseUrl, payload);
		const response = await AxiosClient.get<GetAllPlansResponse>(url);
		return response.items as ExpandedPlan[];
	}
	public static async getActiveExpandedPlan(query?: Pagination) {
		const payload = {
			expand: 'prices,meters',
			status: 'published',
			limit: query?.limit,
			offset: query?.offset,
		};
		const url = generateQueryParams(this.baseUrl, payload);
		const response = await AxiosClient.get<GetAllPlansResponse>(url);
		return response.items as ExpandedPlan[];
	}

	public static async getPlanById(id: string) {
		const payload = {
			expand: 'meters,entitlements,prices,features,credit_grant',
		};
		const url = generateQueryParams(`${this.baseUrl}/${id}`, payload);
		return await AxiosClient.get<Plan>(url);
	}

	public static async updatePlan(id: string, data: Partial<Plan>) {
		return await AxiosClient.put<Plan, Partial<Plan>>(`${this.baseUrl}/${id}`, data);
	}

	public static async deletePlan(id: string) {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}

	public static async synchronizePlanPricesWithSubscription(id: string) {
		return await AxiosClient.post<SynchronizePlanPricesWithSubscriptionResponse>(`${this.baseUrl}/${id}/sync/subscriptions`);
	}

	public static async getPlanCreditGrants(id: string) {
		return await AxiosClient.get<GetPlanCreditGrantsResponse>(`${this.baseUrl}/${id}/creditgrants`);
	}

	/**
	 * Get plans filtered and sorted by the provided criteria
	 * @param payload - Filter, sort, and pagination parameters
	 * @returns Plans matching the filter criteria
	 */
	public static async listPlansByFilter(payload: GetPlansByFilterPayload) {
		return await AxiosClient.post<GetAllPlansResponse, GetPlansByFilterPayload>(`${this.baseUrl}/search`, payload);
	}
}
