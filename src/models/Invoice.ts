import Customer from './Customer';
import { Subscription } from './Subscription';

export interface Invoice {
	id: string;
	customer_id: string;
	subscription_id: string;
	invoice_type: string;
	invoice_status: string;
	payment_status: string;
	billing_period: string;
	currency: string;
	invoice_pdf_url: string;
	amount_due: number;
	amount_paid: number;
	amount_remaining: string;
	invoice_number: string;
	idempotency_key: string;
	billing_sequence: number;
	description: string;
	due_date: string;
	period_start: string;
	period_end: string;
	paid_at: string;
	finalized_at: string;
	billing_reason: string;
	line_items: LineItem[];
	version: number;
	tenant_id: string;
	status: string;
	created_at: string;
	updated_at: string;
	created_by: string;
	updated_by: string;
	subscription: Subscription;
	customer?: Customer;
}

export interface LineItem {
	id: string;
	invoice_id: string;
	customer_id: string;
	subscription_id: string;
	price_id: string;
	plan_id: string;
	plan_display_name: string;
	price_type: string;
	display_name: string;
	amount: number;
	quantity: string;
	currency: string;
	period_start: string;
	period_end: string;
	metadata: Metadata;
	tenant_id: string;
	status: string;
	created_at: string;
	updated_at: string;
	created_by: string;
	updated_by: string;
}

export interface Metadata {
	description: string;
}

export enum InvoiceType {
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
