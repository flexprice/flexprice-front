import { Invoice, LineItem, Pagination, Metadata } from '@/models';
import { TaxRateOverride } from './tax';
import { TypedBackendFilter, TypedBackendSort } from '@/types/formatters/QueryBuilder';

export interface GetInvoicesResponse {
	items: Invoice[];
	pagination: Pagination;
}

/** Invoice shape returned by list/search calls made with `skip_line_items: true` — line_items is omitted by the backend, so it's optional here unlike on `Invoice`. */
export type InvoiceListItem = Omit<Invoice, 'line_items'> & { line_items?: LineItem[] };

export interface GetInvoicesListResponse {
	items: InvoiceListItem[];
	pagination: Pagination;
}

/**
 * Filter for listing/searching invoices. Matches backend InvoiceFilter.
 * Used for both GET /invoices (query params) and POST /invoices/search (body).
 */
export interface InvoiceFilter {
	// Query/pagination (GET uses sort_field + order; POST uses sort array)
	limit?: number;
	offset?: number;
	sort_field?: string;
	order?: string;
	status?: string;
	expand?: string;
	// Time range
	start_time?: string;
	end_time?: string;
	// Generic filters (POST search uses arrays)
	filters?: TypedBackendFilter[];
	sort?: TypedBackendSort[];
	// Dedicated filter fields
	invoice_ids?: string[];
	customer_id?: string;
	external_customer_id?: string;
	subscription_id?: string;
	subscription_customer_id?: string;
	invoice_type?: string;
	invoice_status?: string[];
	payment_status?: string[];
	amount_due_gt?: number;
	amount_remaining_gt?: number;
	period_start_gte?: string;
	period_start_lte?: string;
	period_end_gte?: string;
	period_end_lte?: string;
	skip_line_items?: boolean;
}

/**
 * Request body for PUT /invoices/:id (update invoice). Matches backend UpdateInvoiceRequest.
 * All fields optional — send only what changed. Allowed for DRAFT and FINALIZED invoices.
 */
export interface UpdateInvoicePayload {
	// Backend rejects a due_date in the past, so omit it unless the user changed it.
	due_date?: string;
	invoice_pdf_url?: string;
	// Full replace of the invoice's metadata, not a merge.
	metadata?: Metadata;
	// Recalculates discount from existing coupon associations. Accepted for DRAFT
	// invoices, and for FINALIZED invoices under the void-and-recreate flow (the
	// backend applies it to the new draft copy).
	apply_discount?: boolean;
}

export enum INVOICE_MODIFY_LINE_ITEM_ACTION {
	ADD = 'add',
	UPDATE = 'update',
	REMOVE = 'remove',
}

/** A line item to add via the modify endpoint. Amount is the line total, not a unit price. */
export interface InvoiceModifyAddLineItem {
	display_name: string;
	amount: string;
	quantity: string;
	description?: string;
	period_start?: string;
	period_end?: string;
}

type RequireAtLeastOne<T> = { [K in keyof T]-?: Required<Pick<T, K>> & Partial<Omit<T, K>> }[keyof T];

/** Sparse update for one line item via the modify endpoint; at least one field required. */
export type InvoiceModifyUpdateLineItem = RequireAtLeastOne<{
	display_name: string;
	amount: string;
	quantity: string;
	description: string;
	period_start: string;
	period_end: string;
}>;

/** Per-action params for the modify endpoint; each action carries only its own required fields. */
export type InvoiceModifyLineItemParams =
	| { action: INVOICE_MODIFY_LINE_ITEM_ACTION.ADD; items: InvoiceModifyAddLineItem[] }
	| { action: INVOICE_MODIFY_LINE_ITEM_ACTION.REMOVE; line_item_ids: string[] }
	// One line item per call: the backend versions each edit individually.
	| { action: INVOICE_MODIFY_LINE_ITEM_ACTION.UPDATE; line_item_id: string; update: InvoiceModifyUpdateLineItem };

/**
 * Request body for POST /invoices/:id/modify/execute. Matches backend
 * ExecuteInvoiceModifyRequest. DRAFT invoices only; an edit marks the invoice
 * as manually edited (compute is disabled afterwards), and updates are
 * versioned so line item ids change after each edit.
 */
export interface ExecuteInvoiceModifyPayload {
	type: 'line_item';
	line_item_params: InvoiceModifyLineItemParams;
}

export interface InvoiceModifyResponse {
	invoice: Invoice;
}

/** One editable line-item row on the invoice edit page. Rows without an id are new (to be added on save). */
export interface LineItemRow {
	id?: string;
	display_name: string;
	quantity: string;
	amount: string;
	description: string;
	/** ISO strings; empty when unset. */
	period_start: string;
	period_end: string;
}

/** Request body for PUT /invoices/:id/payment (update payment status). */
export interface UpdatePaymentStatusPayload {
	payment_status: string;
	amount?: number;
}

export interface UpdateInvoiceStatusPayload {
	invoiceId: string;
	payment_status?: string;
	amount?: number;
}

export interface GetInvoicePreviewPayload {
	period_end: string;
	period_start: string;
	subscription_id: string;
	hide_zero_charges_line_items?: boolean;
}

// InvoiceCoupon represents a coupon to be applied at the invoice level
export interface InvoiceCoupon {
	coupon_id: string;
	coupon_association_id?: string;
}

// InvoiceLineItemCoupon represents a coupon applied to a specific invoice line item
export interface InvoiceLineItemCoupon {
	line_item_id: string; // price_id used to match the line item
	coupon_id: string;
	coupon_association_id?: string;
}

export interface CreateInvoiceLineItemRequest {
	entity_id?: string;
	entity_type?: string;
	price_id?: string;
	plan_display_name?: string;
	price_type?: string;
	meter_id?: string;
	meter_display_name?: string;
	price_unit?: string;
	price_unit_amount?: number;
	display_name?: string;
	amount: number;
	quantity: string;
	period_start?: string;
	period_end?: string;
	metadata?: Metadata;
	plan_id?: string; // TODO: !REMOVE after migration
	commitment_info?: {
		commitment_amount?: number;
		commitment_quantity?: number;
		commitment_type?: string;
		overage_factor?: number;
		enable_true_up?: boolean;
		is_window_commitment?: boolean;
	};
	prepaid_credits_applied?: number; // prepaid credits applied to this line item
	line_item_discount?: number; // discount applied directly to this line item
}

export interface CreateInvoicePayload {
	// Optional human-readable identifier for the invoice
	invoice_number?: string;

	// Required: unique identifier of the customer this invoice belongs to
	customer_id: string;

	// Optional: unique identifier of the subscription associated with this invoice
	subscription_id?: string;

	// Optional: key used to prevent duplicate invoice creation
	idempotency_key?: string;

	// Required: type of invoice (subscription, one_time, etc.)
	invoice_type: string;

	// Required: three-letter ISO currency code (e.g., USD, EUR)
	currency: string;

	// Required: total amount that needs to be paid for this invoice
	amount_due: number;

	// Required: total amount of the invoice including taxes and discounts
	total: number;

	// Required: amount before taxes and discounts are applied
	subtotal: number;

	// Optional: text description of the invoice
	description?: string;

	// Optional: date by which payment is expected (ISO string)
	due_date?: string;

	// Optional: period this invoice covers (e.g., "monthly", "yearly")
	billing_period?: string;

	// Optional: start date of the billing period (ISO string)
	period_start?: string;

	// Optional: end date of the billing period (ISO string)
	period_end?: string;

	// Required: why this invoice was created (subscription_cycle, manual, etc.)
	billing_reason: string;

	// Optional: current status of the invoice (draft, finalized, etc.)
	invoice_status?: string;

	// Optional: payment status of the invoice (unpaid, paid, etc.)
	payment_status?: string;

	// Optional: amount that has been paid towards this invoice
	amount_paid?: number;

	// Optional: individual items that make up this invoice
	line_items?: CreateInvoiceLineItemRequest[];

	// Optional: additional custom key-value pairs for storing extra information
	metadata?: Metadata;

	// Optional: unique identifier of the environment this invoice belongs to
	environment_id?: string;

	// Optional: unique identifier of the coupons applied to this invoice (legacy)
	coupons?: string[];

	// Optional: invoice-level coupons
	invoice_coupons?: InvoiceCoupon[];

	// Optional: line-item-level coupons
	line_item_coupons?: InvoiceLineItemCoupon[];

	// Optional: total prepaid credits applied to this invoice
	total_prepaid_applied?: number;

	// Optional: tax rate overrides to apply on this invoice
	tax_rate_overrides?: TaxRateOverride[];

	// Optional: override the finalized_at timestamp (ISO string). When provided, the
	// invoice is stamped with this date instead of the wall-clock time at finalization.
	// Use to back-date manual invoices (e.g. creating a previous-month invoice today).
	issue_date?: string;
}

export interface GetInvoicePdfPayload {
	invoice_id: string;
	invoice_no?: string;
}

export interface VoidInvoicePayload {
	metadata?: Metadata;
}

/** Response for POST /invoices/:id/recalculate (202 Accepted) — async workflow started */
export interface RecalculateInvoiceResponse {
	message: string;
	workflow_id: string;
	run_id: string;
}
