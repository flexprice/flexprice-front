import { AxiosClient } from '@/core/axios/verbs';
import Customer from '@/models/Customer';
import { PaginationType } from '@/models/Pagination';
import { Subscription } from '@/models/Subscription';
import {
	GetCustomerResponse,
	GetCustomerByFiltersPayload,
	GetCustomerSubscriptionsResponse,
	GetCustomerEntitlementPayload,
	GetUsageSummaryResponse,
	CreateCustomerSubscriptionPayload,
	GetCustomerEntitlementsResponse,
} from '@/types/dto/Customer';
import { generateQueryParams } from '@/utils/common/api_helper';

class CustomerApi {
	private static baseUrl = '/customers';

	public static async getCustomerById(id: string): Promise<Customer> {
		return await AxiosClient.get(`${this.baseUrl}/${id}`);
	}
	public static async getAllCustomers({ limit = 10, offset = 0 }: PaginationType): Promise<GetCustomerResponse> {
		const url = generateQueryParams(this.baseUrl, { limit, offset });
		return await AxiosClient.get(url);
	}

	public static async getCustomersByFilters(payload: GetCustomerByFiltersPayload): Promise<GetCustomerResponse> {
		return await AxiosClient.post(`${this.baseUrl}/search`, payload);
	}

	public static async deleteCustomerById(id: string): Promise<void> {
		return await AxiosClient.delete(`${this.baseUrl}/${id}`);
	}

	public static async createCustomerSubscription(payload: CreateCustomerSubscriptionPayload): Promise<void> {
		return await AxiosClient.post(`/subscriptions`, payload);
	}

	public static async getCustomerSubscriptions(id: string): Promise<GetCustomerSubscriptionsResponse> {
		return await AxiosClient.get(`/subscriptions?customer_id=${id}`);
	}

	public static async getCustomerSubscriptionById(id: string): Promise<Subscription> {
		return await AxiosClient.get(`/subscriptions/${id}`);
	}

	public static async createCustomer(customer: Partial<Customer>): Promise<Customer> {
		return await AxiosClient.post(`${this.baseUrl}`, customer);
	}
	public static async updateCustomer(customer: Partial<Customer>, id: string): Promise<Customer> {
		return await AxiosClient.put(`${this.baseUrl}/${id}`, customer);
	}

	public static async getEntitlements(payload: GetCustomerEntitlementPayload): Promise<GetCustomerEntitlementsResponse> {
		return await AxiosClient.get(`${this.baseUrl}/${payload.customer_id}/entitlements`);
	}

	public static async getUsageSummary(payload: GetCustomerEntitlementPayload): Promise<GetUsageSummaryResponse> {
		return await AxiosClient.get(`${this.baseUrl}/${payload.customer_id}/usage`);
	}
}

export default CustomerApi;
