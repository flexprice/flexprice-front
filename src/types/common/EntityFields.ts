/**
 * Centralized enum definitions for entity field keys
 * These enums provide a standardized way to reference entity fields
 * throughout the application for filtering, sorting, and other operations.
 */

/** Feature entity field keys */
export enum FeatureField {
	NAME = 'name',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
	STATUS = 'status',
	TYPE = 'type',
	LOOKUP_KEY = 'lookup_key',
	DESCRIPTION = 'description',
}

/** Customer entity field keys */
export enum CustomerField {
	NAME = 'name',
	EMAIL = 'email',
	EXTERNAL_ID = 'external_id',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
	STATUS = 'status',
}

/** Plan entity field keys */
export enum PlanField {
	NAME = 'name',
	LOOKUP_KEY = 'lookup_key',
	DESCRIPTION = 'description',
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
	STATUS = 'status',
}

/** Invoice entity field keys */
export enum InvoiceField {
	UPDATED_AT = 'updated_at',
	INVOICE_NUMBER = 'invoice_number',
	INVOICE_STATUS = 'invoice_status',
	PAYMENT_STATUS = 'payment_status',
	STATUS = 'status',
	CUSTOMER_ID = 'customer_id',
	SUBSCRIPTION_ID = 'subscription_id',
	INVOICE_TYPE = 'invoice_type',
	CURRENCY = 'currency',
	AMOUNT_DUE = 'amount_due',
	AMOUNT_PAID = 'amount_paid',
	AMOUNT_REMAINING = 'amount_remaining',
	SUBTOTAL = 'subtotal',
	ADJUSTMENT_AMOUNT = 'adjustment_amount',
	REFUNDED_AMOUNT = 'refunded_amount',
	TOTAL = 'total',
	DESCRIPTION = 'description',
	DUE_DATE = 'due_date',
	PAID_AT = 'paid_at',
	VOIDED_AT = 'voided_at',
	FINALIZED_AT = 'finalized_at',
	BILLING_PERIOD = 'billing_period',
	PERIOD_START = 'period_start',
	PERIOD_END = 'period_end',
	IDEMPOTENCY_KEY = 'idempotency_key',
}
