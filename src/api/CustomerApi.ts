import { AxiosClient } from '@/core/axios/verbs';
import { ENTITY_STATUS, Pagination, Subscription } from '@/models';
import {
	ListCustomersResponse,
	CustomerResponse,
	CustomerFilter,
	GetCustomerByFiltersPayload,
	GetCustomerSubscriptionsResponse,
	GetCustomerEntitlementPayload,
	GetUsageSummaryResponse,
	GetCustomerEntitlementsResponse,
	CreateCustomerRequest,
	UpdateCustomerRequest,
	ListCreditGrantApplicationsResponse,
} from '@/types/dto';
import { DashboardSessionResponse } from '@/types/dto/Dashboard';
import { generateQueryParams } from '@/utils/common/api_helper';
import { TypedBackendFilter } from '@/types/formatters/QueryBuilder';
import { DataType, FilterOperator } from '@/types/common/QueryBuilder';

class CustomerApi {
	private static baseUrl = '/customers';

	public static async getCustomerById(id: string): Promise<CustomerResponse> {
		return await AxiosClient.get<CustomerResponse>(`${this.baseUrl}/${id}`);
	}

	public static async getCustomerByLookupKey(lookupKey: string): Promise<CustomerResponse> {
		return await AxiosClient.get<CustomerResponse>(`${this.baseUrl}/lookup/${lookupKey}`);
	}

	public static async getCustomerByExternalId(externalId: string): Promise<CustomerResponse> {
		return await AxiosClient.get<CustomerResponse>(`${this.baseUrl}/external/${externalId}`);
	}

	/**
	 * Get customers (GET /customers) with optional filter as query params.
	 * Use for list with customer_ids, external_ids, email, etc.
	 */
	public static async getCustomers(filter: CustomerFilter = {}): Promise<ListCustomersResponse> {
		const params: Record<string, string | number | undefined> = {};
		if (filter.limit != null) params.limit = filter.limit;
		if (filter.offset != null) params.offset = filter.offset;
		if (filter.expand != null) params.expand = filter.expand;
		if (filter.external_id != null) params.external_id = filter.external_id;
		if (filter.email != null) params.email = filter.email;
		if (filter.start_time != null) params.start_time = filter.start_time;
		if (filter.end_time != null) params.end_time = filter.end_time;
		if (filter.customer_ids?.length) params.customer_ids = filter.customer_ids.join(',');
		if (filter.external_ids?.length) params.external_ids = filter.external_ids.join(',');
		// parent_customer_ids removed from customer APIs (subscription hierarchy replaces customer parent linkage)
		const url = generateQueryParams(this.baseUrl, params);
		return await AxiosClient.get<ListCustomersResponse>(url);
	}

	/** @deprecated Use getCustomers for GET /customers. Kept for backward compatibility. */
	public static async getAllCustomers({ limit = 10, offset = 0 }: Pagination): Promise<ListCustomersResponse> {
		return await this.getCustomers({ limit, offset });
	}

	/**
	 * List customers by filter (POST /customers/search) with JSON body.
	 * Use for complex filter with filters/sort arrays.
	 */
	public static async getCustomersByFilters(payload: GetCustomerByFiltersPayload): Promise<ListCustomersResponse> {
		return await AxiosClient.post<ListCustomersResponse>(`${this.baseUrl}/search`, payload);
	}

	public static async deleteCustomerById(id: string): Promise<void> {
		return await AxiosClient.delete(`${this.baseUrl}/${id}`);
	}

	public static async getCustomerSubscriptions(id: string): Promise<GetCustomerSubscriptionsResponse> {
		return await AxiosClient.get(`/subscriptions?customer_id=${id}`);
	}

	public static async getCustomerSubscriptionById(id: string): Promise<Subscription> {
		return await AxiosClient.get(`/subscriptions/${id}`);
	}

	public static async createCustomer(customer: CreateCustomerRequest): Promise<CustomerResponse> {
		return await AxiosClient.post<CustomerResponse>(`${this.baseUrl}`, customer);
	}

	public static async updateCustomer(customer: UpdateCustomerRequest, id: string): Promise<CustomerResponse> {
		// '' clears billing_currency, so it must survive the empty-value sanitizer.
		return await AxiosClient.put<CustomerResponse>(`${this.baseUrl}/${id}`, customer, { allowEmptyKeys: ['billing_currency'] });
	}

	public static async getEntitlements(payload: GetCustomerEntitlementPayload): Promise<GetCustomerEntitlementsResponse> {
		return await AxiosClient.get(`${this.baseUrl}/${payload.customer_id}/entitlements`);
	}

	public static async getUsageSummary(payload: GetCustomerEntitlementPayload): Promise<GetUsageSummaryResponse> {
		return await AxiosClient.get(`${this.baseUrl}/${payload.customer_id}/usage`);
	}

	/**
	 * Get customer usage summary using query parameters
	 * GET /customers/usage?external_customer_id=xxx
	 */
	public static async getCustomerUsageSummary(queryParams: {
		external_customer_id?: string;
		customer_id?: string;
	}): Promise<GetUsageSummaryResponse> {
		const url = generateQueryParams(`${this.baseUrl}/usage`, queryParams);
		return await AxiosClient.get<GetUsageSummaryResponse>(url);
	}

	/**
	 * Get customer invoice summary
	 * GET /customers/:id/invoices/summary
	 */
	public static async getCustomerInvoiceSummary(customerId: string): Promise<any> {
		return await AxiosClient.get(`${this.baseUrl}/${customerId}/invoices/summary`);
	}

	/**
	 * Get upcoming credit grant applications for a customer
	 */
	public static async getUpcomingCreditGrantApplications(customerId: string): Promise<ListCreditGrantApplicationsResponse> {
		return await AxiosClient.get<ListCreditGrantApplicationsResponse>(`${this.baseUrl}/${customerId}/grants/upcoming`);
	}

	/**
	 * Create a dashboard session for a customer
	 * @param externalId - Customer external ID
	 * @returns Promise with dashboard session response containing URL, token, and expiration
	 */
	public static async createDashboardSession(externalId: string): Promise<DashboardSessionResponse> {
		return await AxiosClient.get<DashboardSessionResponse>(`${this.baseUrl}/portal/${externalId}`);
	}

	/**
	 * Search customers by query string (searches name and email)
	 * If query is empty, returns all customers
	 * @param query - Search query string (can be empty)
	 * @param limit - Maximum number of results (default: 20)
	 * @returns Promise with customer search results
	 */
	public static async searchCustomers(query: string, limit: number = 50): Promise<ListCustomersResponse> {
		// If query is empty, return all customers without filters
		if (!query || query.trim() === '') {
			return await this.getCustomersByFilters({
				limit,
				offset: 0,
				filters: [],
				sort: [],
				status: ENTITY_STATUS.PUBLISHED,
			});
		}

		// Create filters for name and email contains search
		const filters: TypedBackendFilter[] = [
			{
				field: 'name',
				operator: FilterOperator.CONTAINS,
				data_type: DataType.STRING,
				value: { string: query },
			},
		];

		return await this.getCustomersByFilters({
			limit,
			offset: 0,
			filters,
			sort: [],
		});
	}
}

export default CustomerApi;
