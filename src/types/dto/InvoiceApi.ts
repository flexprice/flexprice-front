import { Invoice } from '@/models/Invoice';
import { PaginationType } from '@/models/Pagination';

export interface GetInvoicesResponse {
	items: Invoice[];
	pagination: PaginationType;
}

export interface GetAllInvoicesPayload {
	customer_id?: string;
	end_time?: string;
	invoice_status?: string;
	invoice_type?: string;
	limit?: number;
	offset?: number;
	order?: string;
	payment_status?: string;
	start_time?: string;
	sort?: string;
	status?: string;
	subscription_id?: string;
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
}

export interface CreateOneOffInvoicePayload {
	customer_id: string;
	invoice_type: 'ONE_OFF';
	currency: string;
	amount_due: string;
	period_start: string;
	line_items: Array<{
		display_name: string;
		quantity: string;
		amount: number;
	}>;
}

export interface GetInvoicePdfPayload {
	invoice_id: string;
	invoice_no?: string;
}
