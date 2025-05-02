import { AxiosClient } from '@/core/axios/verbs';
import { Plan } from '@/models/Plan';
import { PaginationType } from '@/models/Pagination';
import { ExpandedPlan } from '@/utils/models/transformed_plan';

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
		return await AxiosClient.get<GetAllPlansResponse>(
			`${this.baseUrl}?limit=${limit}&offset=${offset}&expand=entitlements%2Cprices%2Cmeters%2Cfeatures`,
		);
	}
	public static async getAllActivePlans({ limit, offset }: PaginationType) {
		return await AxiosClient.get<GetAllPlansResponse>(
			`${this.baseUrl}?status=published&limit=${limit}&offset=${offset}&expand=entitlements%2Cprices%2Cmeters%2Cfeatures`,
		);
	}

	public static async getExpandedPlan() {
		const response = await AxiosClient.get<GetAllPlansResponse>(`${this.baseUrl}?expand=prices%2Cmeters%2Centitlements`);
		return response.items as ExpandedPlan[];
	}
	public static async getActiveExpandedPlan() {
		const response = await AxiosClient.get<GetAllPlansResponse>(`${this.baseUrl}?expand=prices%2Cmeters&status=published`);
		return response.items as ExpandedPlan[];
	}

	public static async getPlanById(id: string) {
		return await AxiosClient.get<Plan>(`${this.baseUrl}/${id}?expand=meters%2Centitlements%2Cprices%2Cfeatures`);
	}

	public static async updatePlan(id: string, data: Partial<Plan>) {
		return await AxiosClient.put<Plan, Partial<Plan>>(`${this.baseUrl}/${id}`, data);
	}

	public static async deletePlan(id: string) {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}
}
