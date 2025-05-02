import { AxiosClient } from '@/core/axios/verbs';
import { Plan } from '@/models/Plan';
import { PaginationType } from '@/models/Pagination';
import { ExpandedPlan } from '@/utils/models/transformed_plan';
import { generateQueryParams } from '@/utils/common/api_helper';

export interface GetAllPlansResponse {
	items: Plan[] | ExpandedPlan[];
	pagination: PaginationType;
}

export class PlanApi {
	private static baseUrl = '/plans';

	public static async createPlan(data: Partial<Plan>) {
		return await AxiosClient.post<Plan, Partial<Plan>>(this.baseUrl, data);
	}

	public static async getAllPlans({ limit, offset }: PaginationType) {
		const payload = {
			limit,
			offset,
			expand: 'entitlements%2Cprices%2Cmeters%2Cfeatures',
		};
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get<GetAllPlansResponse>(url);
	}
	public static async getAllActivePlans({ limit, offset }: PaginationType) {
		const payload = {
			status: 'published',
			limit,
			offset,
			expand: 'entitlements%2Cprices%2Cmeters%2Cfeatures',
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
	public static async getActiveExpandedPlan() {
		const payload = {
			expand: 'prices%2Cmeters',
			status: 'published',
		};
		const url = generateQueryParams(this.baseUrl, payload);
		const response = await AxiosClient.get<GetAllPlansResponse>(url);
		return response.items as ExpandedPlan[];
	}

	public static async getPlanById(id: string) {
		const payload = {
			expand: 'meters%2Centitlements%2Cprices%2Cfeatures',
		};
		const url = generateQueryParams(`${this.baseUrl}/${id}`, payload);
		return await AxiosClient.get<Plan>(url);
	}

	public static async updatePlan(id: string, data: Partial<Plan>) {
		const payload = {
			expand: 'meters%2Centitlements%2Cprices%2Cfeatures',
		};
		const url = generateQueryParams(`${this.baseUrl}/${id}`, payload);
		return await AxiosClient.put<Plan, Partial<Plan>>(url, data);
	}

	public static async deletePlan(id: string) {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}
}
