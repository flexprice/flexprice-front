import { AxiosClient } from '@/core/axios/verbs';
import { LineItem as InvoiceLineItem } from '@/models/Invoice';
import { Subscription, SubscriptionUsage } from '@/models/Subscription';

interface GetSubscriptionDetailsPayload {
	subscription_id: string;
	period_end?: string;
	period_start?: string;
}

interface GetSubscriptionPreviewResponse {
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

interface PauseSubscriptionPayload {
	dry_run?: boolean;
	metadata?: Record<string, any>;
	pause_days?: number;
	pause_end?: string;
	pause_mode?: 'immediate';
	pause_start?: string;
	reason?: string;
}

interface ResumeSubscriptionPayload {
	dry_run?: boolean;
	metadata?: Record<string, any>;
	resume_mode?: 'immediate';
}

interface SubscriptionPauseResponse {
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
type SubscriptionResumeResponse = SubscriptionPauseResponse;

class SubscriptionApi {
	private static baseUrl = '/subscriptions';

	public static async getSubscriptionUsage(id: string): Promise<SubscriptionUsage> {
		return await AxiosClient.post(`${this.baseUrl}/usage`, { subscription_id: id });
	}

	public static async getSubscriptionInvoicesPreview({
		subscription_id,
		period_end,
		period_start,
	}: GetSubscriptionDetailsPayload): Promise<GetSubscriptionPreviewResponse> {
		return await AxiosClient.post<GetSubscriptionPreviewResponse>('/invoices/preview', {
			subscription_id: subscription_id,
			period_end: period_end,
			period_start: period_start,
		});
	}

	static async getSubscriptionById(id: string): Promise<Subscription> {
		return await AxiosClient.get(`${this.baseUrl}/${id}`);
	}

	static async pauseSubscription(id: string, payload: PauseSubscriptionPayload): Promise<SubscriptionPauseResponse> {
		return await AxiosClient.post(`${this.baseUrl}/${id}/pause`, payload);
	}

	static async resumeSubscription(id: string, payload: ResumeSubscriptionPayload): Promise<SubscriptionResumeResponse> {
		return await AxiosClient.post(`${this.baseUrl}/${id}/resume`, payload);
	}

	static async cancelSubscription(id: string): Promise<void> {
		return await AxiosClient.post(`${this.baseUrl}/${id}/cancel`);
	}
}

export default SubscriptionApi;
