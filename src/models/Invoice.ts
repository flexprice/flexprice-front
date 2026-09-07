import { BaseModel, Metadata } from './base';
import Customer from './Customer';
import { Subscription } from './Subscription';
import { PAYMENT_STATUS } from '@/constants/payment';
import { TaxApplied } from './Tax';
import { PRICE_TYPE } from './Price';

export interface Invoice extends BaseModel {
	readonly customer_id: string;
	readonly subscription_id: string;
	// subscription_customer_id is the subscription owner's customer ID when it differs from customer_id (invoicing customer)
	readonly subscription_customer_id?: string;
	readonly invoice_type: INVOICE_TYPE;
	readonly invoice_status: INVOICE_STATUS;
	readonly payment_status: PAYMENT_STATUS;
	readonly billing_period: BILLING_CADENCE;
	readonly currency: string;
	readonly invoice_pdf_url: string;
	readonly amount_due: number;
	readonly subtotal: number;
	readonly total: number;
	readonly amount_paid: number;
	readonly amount_remaining: number;
	readonly invoice_number: string;
	readonly idempotency_key: string;
	readonly billing_sequence: number;
	readonly description: string;
	readonly due_date: string;
	readonly period_start: string;
	readonly period_end: string;
	readonly paid_at: string;
	readonly voided_at?: string;
	readonly finalized_at: string;
	readonly issue_date?: string;
	readonly billing_reason: INVOICE_BILLING_REASON;
	readonly line_items: LineItem[];
	readonly total_tax: number;
	readonly version: number;
	readonly tenant_id: string;
	readonly subscription: Subscription;
	readonly customer?: Customer;
	readonly total_discount?: number;
	readonly taxes?: TaxApplied[];
	// adjustment_amount is the total sum of credit notes of type "adjustment".
	// These are non-cash reductions applied to the invoice (e.g. goodwill credit, billing correction).
	readonly adjustment_amount: number;
	// refunded_amount is the total sum of credit notes of type "refund".
	// These are actual refunds issued to the customer.
	readonly refunded_amount: number;
	// total_prepaid_credits_applied is the total amount of prepaid credits applied to this invoice.
	// This represents the sum of all prepaid applications (from credit grants, credit notes, etc.) that reduce the invoice amount.
	readonly total_prepaid_credits_applied: number;
	// overpaid_amount is the excess amount paid beyond net payable (amount_paid - amount_due when positive).
	readonly overpaid_amount?: number;
	// recalculated_invoice_id is the ID of the replacement invoice created when this invoice was voided and recalculated.
	// When set, it forms a parent→child link from this (voided) invoice to the new replacement invoice.
	readonly recalculated_invoice_id?: string;
	readonly metadata?: Metadata;
}

/** Entity type of an invoice line item (plan, addon, or subscription) */
export enum INVOICE_LINE_ITEM_ENTITY_TYPE {
	PLAN = 'plan',
	ADDON = 'addon',
	SUBSCRIPTION = 'subscription',
}

export interface LineItem extends BaseModel {
	readonly id: string;
	readonly invoice_id: string;
	readonly customer_id: string;
	readonly subscription_id?: string;
	readonly entity_id?: string;
	readonly entity_type?: INVOICE_LINE_ITEM_ENTITY_TYPE;
	readonly plan_display_name?: string;
	readonly price_id?: string;
	readonly price_type?: PRICE_TYPE;
	readonly meter_id?: string;
	readonly meter_display_name?: string;
	readonly price_unit_id?: string;
	readonly price_unit?: string;
	readonly price_unit_amount?: number;
	readonly display_name?: string;
	readonly amount: number;
	readonly quantity: string;
	readonly currency: string;
	readonly period_start?: string;
	readonly period_end?: string;
	readonly metadata: Metadata;
	readonly environment_id: string;
	readonly commitment_info?: {
		commitment_amount?: number;
		commitment_quantity?: number;
		commitment_type?: string;
		overage_factor?: number;
		enable_true_up?: boolean;
		is_window_commitment?: boolean;
	};
	// prepaid_credits_applied is the amount in invoice currency reduced from this line item due to prepaid credits application.
	// This represents prepaid credits (from credit grants, credit notes, etc.) that are specifically applied to reduce this line item's amount.
	readonly prepaid_credits_applied: number;
	// line_item_discount is the discount amount in invoice currency applied directly to this line item.
	// This represents discounts that are applied specifically to this line item (e.g., via line-item level coupons or discounts).
	readonly line_item_discount: number;
}

export enum INVOICE_TYPE {
	SUBSCRIPTION = 'SUBSCRIPTION',
	ONE_OFF = 'ONE_OFF',
	CREDIT = 'CREDIT',
}

export enum INVOICE_CADENCE {
	ARREAR = 'ARREAR',
	ADVANCE = 'ADVANCE',
}

export enum BILLING_CADENCE {
	RECURRING = 'RECURRING',
	ONETIME = 'ONETIME',
}

export enum INVOICE_STATUS {
	DRAFT = 'DRAFT',
	FINALIZED = 'FINALIZED',
	VOIDED = 'VOIDED',
	SKIPPED = 'SKIPPED',
}

export enum INVOICE_BILLING_REASON {
	SUBSCRIPTION_CREATE = 'SUBSCRIPTION_CREATE',
	SUBSCRIPTION_CYCLE = 'SUBSCRIPTION_CYCLE',
	SUBSCRIPTION_UPDATE = 'SUBSCRIPTION_UPDATE',
	PRORATION = 'PRORATION',
	MANUAL = 'MANUAL',
}
