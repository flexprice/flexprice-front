import { AxiosClient } from '@/core/axios/verbs';
import { Tenant } from '@/models/Tenant';
import { Subscription } from '@/models/Subscription';
import { PaginationType } from '@/models/Pagination';
import CustomerUsage from '@/models/CustomerUsage';

interface GetBillingdetailsResponse {
	subscriptions: Subscription[];
	usage: {
		customer_id: string;
		features: CustomerUsage[];
		pagination: PaginationType;
		period: {
			end_time: string;
			period: string;
			start_time: string;
		};
	};
}

class TenantApi {
	private static baseUrl = '/tenants';

	public static async getTenantById(id: string) {
		return await AxiosClient.get<Tenant>(`${this.baseUrl}/${id}`);
	}

	public static async updateTenant(id: string, data: Partial<Tenant>) {
		return await AxiosClient.put<Tenant, Partial<Tenant>>(`${this.baseUrl}/${id}`, data);
	}

	public static async getTenantBillingDetails() {
		return await AxiosClient.get<GetBillingdetailsResponse>(`${this.baseUrl}/billing`);
	}
}

export default TenantApi;
