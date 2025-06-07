import { LineItem as InvoiceLineItem } from '@/models/Invoice';
import { BILLING_CYCLE } from '@/models/Subscription';
import { CreditGrant } from '@/models/CreditGrant';

export interface GetSubscriptionDetailsPayload {
	subscription_id: string;
	period_end?: string;
	period_start?: string;
}

export interface GetSubscriptionPreviewResponse {
	amount_due: number;
	amount_paid: number;
	amount_remaining: number;
	billing_reason: string;
	billing_sequence: number;
	created_at: string;
	created_by: string;
	currency: string;
	customer_id: string;
	description: string;
	due_date: string;
	finalized_at: string;
	id: string;
	idempotency_key: string;
	invoice_number: string;
	invoice_pdf_url: string;
	invoice_status: string;
	invoice_type: string;
	line_items: InvoiceLineItem[];
	metadata: Record<string, any>;
	paid_at: string;
	payment_status: string;
	period_end: string;
	period_start: string;
	status: string;
	subscription_id: string;
	tenant_id: string;
	updated_at: string;
	updated_by: string;
	version: number;
	voided_at: string;
}

export interface PauseSubscriptionPayload {
	dry_run?: boolean;
	metadata?: Record<string, any>;
	pause_days?: number;
	pause_end?: string;
	pause_mode?: 'immediate';
	pause_start?: string;
	reason?: string;
}

export interface ResumeSubscriptionPayload {
	dry_run?: boolean;
	metadata?: Record<string, any>;
	resume_mode?: 'immediate';
}

export interface SubscriptionPauseResponse {
	created_at: string;
	created_by: string;
	environment_id: string;
	id: string;
	metadata: Record<string, any>;
	original_period_end: string;
	original_period_start: string;
	pause_end: string;
	pause_mode: any;
	pause_start: string;
	pause_status: any;
	reason: string;
	resume_mode: any;
	resumed_at: string;
	status: 'published';
	subscription_id: string;
	tenant_id: string;
	updated_at: string;
	updated_by: string;
}

// Since both responses have the same structure, we can reuse the interface
export type SubscriptionResumeResponse = SubscriptionPauseResponse;

export interface AddSubscriptionPhasePayload {
	billing_cycle: BILLING_CYCLE;
	start_date: string | Date;
	end_date?: string | Date;
	credit_grants?: CreditGrant[];
	commitment_amount?: number;
	overage_factor?: number;
}
