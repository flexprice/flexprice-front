import {
	CreditGrant,
	Pagination,
	CREDIT_GRANT_CADENCE,
	CREDIT_GRANT_PERIOD,
	CREDIT_GRANT_EXPIRATION_TYPE,
	CREDIT_GRANT_PERIOD_UNIT,
	CREDIT_GRANT_SCOPE,
	Metadata,
} from '@/models';
import { QueryFilter, TimeRangeFilter } from './base';
import { TypedBackendFilter, TypedBackendSort } from '@/types/formatters/QueryBuilder';

// ============================================
// Credit Grant Request Types
// ============================================

export interface CreateCreditGrantRequest {
	name: string;
	scope: CREDIT_GRANT_SCOPE;
	plan_id?: string;
	addon_id?: string;
	subscription_id?: string;
	credits: number;
	cadence: CREDIT_GRANT_CADENCE;
	period?: CREDIT_GRANT_PERIOD;
	period_count?: number;
	expiration_type?: CREDIT_GRANT_EXPIRATION_TYPE;
	expiration_duration?: number;
	expiration_duration_unit?: CREDIT_GRANT_PERIOD_UNIT;
	priority?: number;
	metadata?: Metadata;
	conversion_rate?: number;
	topup_conversion_rate?: number;
	/** ISO date string. Required for SUBSCRIPTION-scoped grants. */
	start_date?: string;
	/** ISO date string. Optional; must be >= start_date when provided. */
	end_date?: string;
}

export interface UpdateCreditGrantRequest {
	name?: string;
	metadata?: Metadata;
}

// ============================================
// Internal Credit Grant Request Types
// ============================================

/**
 * InternalCreditGrantRequest extends CreateCreditGrantRequest with an id field
 * This makes it easier to handle edit and delete operations in the UI
 */
export interface InternalCreditGrantRequest extends CreateCreditGrantRequest {
	id: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Converts a CreditGrant (from API response) to InternalCreditGrantRequest
 */
export const creditGrantToInternal = (grant: CreditGrant): InternalCreditGrantRequest => {
	return {
		id: grant.id,
		name: grant.name,
		scope: grant.scope,
		plan_id: grant.plan_id,
		addon_id: grant.addon_id,
		subscription_id: grant.subscription_id,
		credits: grant.credits,
		cadence: grant.cadence,
		period: grant.period,
		period_count: grant.period_count,
		expiration_type: grant.expiration_type,
		expiration_duration: grant.expiration_duration,
		expiration_duration_unit: grant.expiration_duration_unit,
		priority: grant.priority,
		metadata: grant.metadata,
		conversion_rate: grant.conversion_rate,
		topup_conversion_rate: grant.topup_conversion_rate,
		start_date: grant.start_date,
		end_date: grant.end_date,
	};
};

/**
 * Converts an InternalCreditGrantRequest to CreateCreditGrantRequest (removes id)
 */
export const internalToCreateRequest = (internal: InternalCreditGrantRequest): CreateCreditGrantRequest => {
	const { id: _id, ...createRequest } = internal;
	return createRequest;
};

// ============================================
// Credit Grant Response Types
// ============================================

export type CreditGrantResponse = CreditGrant;

export interface ListCreditGrantsResponse extends Pagination {
	items: CreditGrantResponse[];
}

export interface GetCreditGrantsResponse extends Pagination {
	items: CreditGrant[];
}

// ============================================
// Credit Grant Filter Types (matches backend structure)
// ============================================

export interface CreditGrantFilter extends Omit<QueryFilter, 'sort'>, TimeRangeFilter {
	// Complex filtering support (matches backend Filters field)
	filters?: TypedBackendFilter[];
	sort?: TypedBackendSort[];

	// Entity-specific filters (matches backend)
	plan_ids?: string[];
	addon_ids?: string[];
	subscription_ids?: string[];
	scope?: CREDIT_GRANT_SCOPE;
	credit_grant_ids?: string[];
}

/** GET request filter for credit grants */
export type GetCreditGrantsRequest = CreditGrantFilter;

/** Request body for POST /search */
export type SearchCreditGrantsRequest = CreditGrantFilter;

export interface SearchCreditGrantsResponse {
	items: CreditGrantResponse[];
	pagination?: { total?: number; limit?: number; offset?: number };
}

export interface ProcessScheduledCreditGrantApplicationsResponse {
	success_applications_count: number;
	failed_applications_count: number;
	total_applications_count: number;
}

export interface CancelFutureCreditGrantRequest {
	subscription_id: string;
	effective_date?: string;
}

/**
 * Optional request body for DELETE /creditgrants/:id.
 * CreditGrantID is set by the backend from the path param; only effective_date is sent in the body.
 */
export interface DeleteCreditGrantRequest {
	/** ISO date string. Optional; when set (subscription scope) the grant end date is set to this time. Omit for immediate delete. */
	effective_date?: string;
}
