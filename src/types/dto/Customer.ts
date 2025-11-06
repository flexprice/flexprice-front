import { Customer, CustomerEntitlement, CustomerUsage, Pagination, Metadata } from '@/models';
import { TypedBackendFilter, TypedBackendSort } from '../formatters/QueryBuilder';
import { SubscriptionResponse } from './Subscription';
export interface GetCustomerResponse {
	items: Customer[];
	pagination: Pagination;
}

export interface GetCustomerSubscriptionsResponse {
	items: SubscriptionResponse[];
	pagination: Pagination;
}

export interface GetCustomerEntitlementsResponse {
	customer_id: string;
	features: CustomerEntitlement[];
}

export interface GetCustomerEntitlementPayload {
	customer_id: string;
	feature_id?: string;
}

export interface GetUsageSummaryResponse {
	customer_id: string;
	features: CustomerUsage[];
	pagination: Pagination;
	period: {
		end_time: string;
		period: string;
		start_time: string;
	};
}

// Subscription
export interface GetCustomerByFiltersPayload extends Pagination {
	filters: TypedBackendFilter[];
	sort: TypedBackendSort[];
}

// Tax Rate Override interface (if needed for create request)
export interface TaxRateOverride {
	id?: string;
	tax_rate_id: string;
	description?: string;
}

// Create Customer Request DTO
export interface CreateCustomerRequest {
	external_id: string;
	name: string;
	email: string;
	address_line1?: string;
	address_line2?: string;
	address_city?: string;
	address_state?: string;
	address_postal_code?: string;
	address_country?: string;
	metadata?: Metadata;
	tax_rate_overrides?: TaxRateOverride[];
}

// Update Customer Request DTO
export interface UpdateCustomerRequest {
	external_id?: string;
	name?: string;
	email?: string;
	address_line1?: string;
	address_line2?: string;
	address_city?: string;
	address_state?: string;
	address_postal_code?: string;
	address_country?: string;
	metadata?: Metadata;
}
