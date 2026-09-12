import { Customer, CustomerEntitlement, CustomerUsage, Pagination, Metadata, ENTITY_STATUS, TAX_TREATMENT } from '@/models';
import { TypedBackendFilter, TypedBackendSort } from '../formatters/QueryBuilder';
import { SubscriptionResponse } from './Subscription';

/** Backend integration entity type (CreateEntityIntegrationMappingRequest.entity_type) */
export type IntegrationEntityType =
	| 'customer'
	| 'plan'
	| 'invoice'
	| 'subscription'
	| 'payment'
	| 'credit_note'
	| 'addon'
	| 'item'
	| 'item_price'
	| 'price';

/** Matches backend CreateEntityIntegrationMappingRequest */
export interface CreateEntityIntegrationMappingRequest {
	entity_id: string;
	entity_type: IntegrationEntityType;
	provider_type: string;
	provider_entity_id: string;
	metadata?: Record<string, unknown>;
}

/** Matches backend EntityIntegrationMappingResponse */
export interface EntityIntegrationMappingResponse {
	id: string;
	entity_id: string;
	entity_type: IntegrationEntityType;
	provider_type: string;
	provider_entity_id: string;
	environment_id: string;
	tenant_id: string;
	status: string;
	created_at: string;
	updated_at: string;
	created_by: string;
	updated_by: string;
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

export interface BillingPeriodInfo {
	start_time: string;
	end_time: string;
	period: string;
}

export interface GetUsageSummaryResponse {
	customer_id: string;
	features: CustomerUsage[];
	pagination?: Pagination;
	period?: BillingPeriodInfo;
}

/**
 * Customer filter for list/search queries (matches backend CustomerFilter).
 * Supports filters, sort, pagination, and direct ID/email filters.
 */
export interface CustomerFilter extends Pagination {
	filters?: TypedBackendFilter[];
	sort?: TypedBackendSort[];
	expand?: string;
	/** Filter by customer IDs */
	customer_ids?: string[];
	/** Filter by external IDs */
	external_ids?: string[];
	/** Filter by single external ID */
	external_id?: string;
	/** Filter by email */
	email?: string;
	/** Time range (if supported by backend) */
	start_time?: string;
	end_time?: string;
}

/** Payload for POST /customers/search (extends CustomerFilter with required filters/sort for backward compatibility) */
export interface GetCustomerByFiltersPayload extends CustomerFilter {
	filters?: TypedBackendFilter[];
	sort?: TypedBackendSort[];
	status?: ENTITY_STATUS;
	/** Key-value metadata filters; only customers whose metadata contains all specified pairs are returned. */
	metadata?: Record<string, string>;
}

export interface TaxRateOverride {
	id?: string;
	tax_rate_id: string;
	description?: string;
}

export interface CreateCustomerRequest {
	external_id: string;
	name?: string;
	email?: string;
	address_line1?: string;
	address_line2?: string;
	address_city?: string;
	address_state?: string;
	address_postal_code?: string;
	address_country?: string;
	metadata?: Metadata;
	/** Exempt customers are never charged tax. Defaults to taxable. */
	tax_treatment?: TAX_TREATMENT;
	tax_rate_overrides?: TaxRateOverride[];
	/** When true, prevents the customer onboarding workflow from being triggered (internal use) */
	skip_onboarding_workflow?: boolean;
	/** Provider integration mappings for this customer */
	integration_entity_mapping?: CreateEntityIntegrationMappingRequest[];
}

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
	/** Exempt customers are never charged tax. */
	tax_treatment?: TAX_TREATMENT;
	/** Provider integration mappings for this customer */
	integration_entity_mapping?: CreateEntityIntegrationMappingRequest[];
}

/** Customer response (matches backend CustomerResponse) */
export interface CustomerResponse extends Customer {
	integrations?: EntityIntegrationMappingResponse[];
}

/** List response for customers (matches backend ListCustomersResponse) */
export interface ListCustomersResponse {
	items: CustomerResponse[];
	pagination: Pagination;
}

/** Portal session response containing URL, token, and expiration */
export interface PortalSessionResponse {
	url: string;
	token: string;
	expires_at: string;
}
