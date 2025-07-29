import { TypedBackendFilter, TypedBackendSort } from '@/types/formatters/QueryBuilder';

/**
 * Field mapper utility
 * Maps frontend field keys to backend field keys for API requests
 */

/**
 * Interface for entity query options with field mapping capability
 */
export interface EntityQueryOptions {
	getFieldName(field: string): string;
}

/**
 * Base class for entity query options that provides field mapping capability
 */
export class BaseQueryOptions implements EntityQueryOptions {
	private fieldMap: Record<string, string>;

	constructor(fieldMap: Record<string, string> = {}) {
		this.fieldMap = fieldMap;
	}

	/**
	 * Maps a frontend field key to a backend field key
	 * @param field The frontend field key to map
	 * @returns The mapped backend field key or the original field if no mapping exists
	 */
	getFieldName(field: string): string {
		return this.fieldMap[field] || field;
	}
}

/**
 * Create query options with field mappings for an entity
 * @param fieldMap Record mapping frontend field keys to backend field keys
 * @returns EntityQueryOptions instance with field mapping capability
 */
export function createQueryOptions(fieldMap: Record<string, string> = {}): EntityQueryOptions {
	return new BaseQueryOptions(fieldMap);
}

/**
 * Transforms filters using the field mapping provided in query options
 * @param filters Array of typed backend filters
 * @param queryOptions Entity query options with field mapping
 * @returns Transformed filters with mapped field names
 */
export function transformFilters(filters: TypedBackendFilter[], queryOptions: EntityQueryOptions): TypedBackendFilter[] {
	return filters.map((filter) => ({
		...filter,
		field: queryOptions.getFieldName(filter.field),
	}));
}

/**
 * Transforms sort options using the field mapping provided in query options
 * @param sorts Array of typed backend sort options
 * @param queryOptions Entity query options with field mapping
 * @returns Transformed sort options with mapped field names
 */
export function transformSorts(sorts: TypedBackendSort[], queryOptions: EntityQueryOptions): TypedBackendSort[] {
	return sorts.map((sort) => ({
		...sort,
		field: queryOptions.getFieldName(sort.field),
	}));
}

/**
 * Feature entity field mappings
 * Maps frontend field keys to backend field keys for Feature entity
 */
export const featureFieldMap: Record<string, string> = {
	// Add any field mappings if frontend field names differ from backend
	// For example: 'displayName': 'name'
};

/**
 * Customer entity field mappings
 * Maps frontend field keys to backend field keys for Customer entity
 */
export const customerFieldMap: Record<string, string> = {
	// Add any field mappings if frontend field names differ from backend
	// For example: 'externalId': 'external_id'
};

/**
 * Plan entity field mappings
 * Maps frontend field keys to backend field keys for Plan entity
 */
export const planFieldMap: Record<string, string> = {
	// Map fields based on your Go example
	updated_at: 'updated_at',
	lookup_key: 'lookup_key',
	name: 'name',
	description: 'description',
	status: 'status',
};

/**
 * Invoice entity field mappings
 * Maps frontend field keys to backend field keys for Invoice entity
 */
export const invoiceFieldMap: Record<string, string> = {
	// Map fields based on your Go example
	updated_at: 'updated_at',
	invoice_number: 'invoice_number',
	invoice_status: 'invoice_status',
	payment_status: 'payment_status',
	status: 'status',
	customer_id: 'customer_id',
	subscription_id: 'subscription_id',
	invoice_type: 'invoice_type',
	currency: 'currency',
	amount_due: 'amount_due',
	amount_paid: 'amount_paid',
	amount_remaining: 'amount_remaining',
	subtotal: 'subtotal',
	adjustment_amount: 'adjustment_amount',
	refunded_amount: 'refunded_amount',
	total: 'total',
	description: 'description',
	due_date: 'due_date',
	paid_at: 'paid_at',
	voided_at: 'voided_at',
	finalized_at: 'finalized_at',
	billing_period: 'billing_period',
	period_start: 'period_start',
	period_end: 'period_end',
	idempotency_key: 'idempotency_key',
};

// Create pre-configured query options instances for each entity
export const featureQueryOptions = createQueryOptions(featureFieldMap);
export const customerQueryOptions = createQueryOptions(customerFieldMap);
export const planQueryOptions = createQueryOptions(planFieldMap);
export const invoiceQueryOptions = createQueryOptions(invoiceFieldMap);
