import { config } from '@/config/config';
import { AxiosClient } from '@/core/axios/verbs';
import { Invoice } from '@/models';
import { generateQueryParams } from '@/utils/common/api_helper';
import AuthService from '@/core/auth/AuthService';
import EnvironmentApi from '@/api/EnvironmentApi';
import { SortDirection } from '@/types/common/QueryBuilder';
import { INVOICE_STATUS } from '@/models/Invoice';
import {
	GetInvoicesResponse,
	GetInvoicesListResponse,
	InvoiceFilter,
	UpdateInvoicePayload,
	ExecuteInvoiceModifyPayload,
	InvoiceModifyResponse,
	UpdatePaymentStatusPayload,
	UpdateInvoiceStatusPayload,
	GetInvoicePreviewPayload,
	CreateInvoicePayload,
	VoidInvoicePayload,
	RecalculateInvoiceResponse,
} from '@/types/dto';
import { downloadInvoiceLineItemsCsv } from '@/utils/invoices/downloadInvoiceLineItemsCsv';

class InvoiceApi {
	private static baseurl = '/invoices';

	/**
	 * List/search invoices by filter. Always POSTs to /invoices/search with filter as JSON body.
	 * Note: passing `skip_line_items: true` makes the backend omit `line_items` on each returned
	 * invoice even though this method's return type doesn't reflect that — prefer
	 * `getCustomerInvoices` (typed via `GetInvoicesListResponse`) for that case, or treat
	 * `items[].line_items` as possibly absent when calling this directly with that flag.
	 */
	public static async listInvoices(filter: InvoiceFilter = {}): Promise<GetInvoicesResponse> {
		return await AxiosClient.post<GetInvoicesResponse>(`${this.baseurl}/search`, filter);
	}

	/** List invoices for a single customer. Uses listInvoices with customer_id filter and skip_line_items — line_items is omitted on each returned invoice. */
	public static async getCustomerInvoices(
		customerId: string,
		pagination?: { limit: number; offset: number },
	): Promise<GetInvoicesListResponse> {
		return await AxiosClient.post<GetInvoicesListResponse>(`${this.baseurl}/search`, {
			customer_id: customerId,
			// Explicitly include all known invoice statuses; backend defaults may exclude some (e.g. SKIPPED).
			invoice_status: Object.values(INVOICE_STATUS),
			skip_line_items: true,
			sort: [
				{
					field: 'period_start',
					direction: SortDirection.DESC,
				},
			],
			...pagination,
		});
	}

	public static async getInvoiceById(invoiceId: string): Promise<Invoice> {
		return await AxiosClient.get<Invoice>(`${this.baseurl}/${invoiceId}`);
	}

	public static async updateInvoicePaymentStatus(invoiceId: string, payload: UpdatePaymentStatusPayload): Promise<Invoice> {
		return await AxiosClient.put<Invoice>(`${this.baseurl}/${invoiceId}/payment`, payload);
	}

	public static async updateInvoiceStatus(payload: UpdateInvoiceStatusPayload): Promise<Invoice> {
		return await AxiosClient.put<Invoice>(`${this.baseurl}/${payload.invoiceId}/status`, payload);
	}

	public static async voidInvoice(invoiceId: string, payload?: VoidInvoicePayload) {
		return await AxiosClient.post(`${this.baseurl}/${invoiceId}/void`, payload);
	}

	public static async finalizeInvoice(invoiceId: string) {
		return await AxiosClient.post(`${this.baseurl}/${invoiceId}/finalize`);
	}

	public static async attemptPayment(invoiceId: string) {
		return await AxiosClient.post(`${this.baseurl}/${invoiceId}/payment/attempt`);
	}

	public static async getInvoicePreview(payload: GetInvoicePreviewPayload) {
		return await AxiosClient.post<Invoice>(`${this.baseurl}/preview`, payload);
	}

	public static async createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
		return await AxiosClient.post<Invoice>(`${this.baseurl}`, payload);
	}

	/** Update an existing invoice (due date, PDF URL, metadata, apply_discount). DRAFT and FINALIZED only. */
	public static async updateInvoice(invoiceId: string, payload: UpdateInvoicePayload): Promise<Invoice> {
		return await AxiosClient.put<Invoice>(`${this.baseurl}/${invoiceId}`, payload);
	}

	/**
	 * Modify a DRAFT invoice's line items (add/update/remove) via the modification
	 * envelope. Mirrors the subscription modification API. Manual edits mark the
	 * invoice as manually edited, which disables compute for it afterwards.
	 */
	public static async modifyInvoice(invoiceId: string, payload: ExecuteInvoiceModifyPayload): Promise<InvoiceModifyResponse> {
		return await AxiosClient.post<InvoiceModifyResponse>(`${this.baseurl}/${invoiceId}/modify/execute`, payload);
	}

	public static async recalculateInvoice(invoiceId: string): Promise<RecalculateInvoiceResponse> {
		return await AxiosClient.post<RecalculateInvoiceResponse>(`${this.baseurl}/${invoiceId}/recalculate`);
	}

	public static async getInvoicePdf(invoiceId: string, invoiceNo?: string) {
		const downloadFileName = invoiceNo ? `invoice-${invoiceNo}.pdf` : `invoice-${invoiceId}.pdf`;

		const response = await fetch(`${config.api.baseUrl}${this.baseurl}/${invoiceId}/pdf`, {
			headers: {
				Authorization: `Bearer ${await AuthService.getAcessToken()}`,
				'X-Environment-ID': EnvironmentApi.getActiveEnvironmentId() || '',
				Accept: 'application/pdf',
			},
		});

		if (!response.ok) {
			throw new Error('Failed to fetch PDF');
		}

		const arrayBuffer = await response.arrayBuffer();
		const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
		const url = window.URL.createObjectURL(blob);

		// Create a temporary link element
		const link = document.createElement('a');
		link.href = url;
		link.download = downloadFileName;

		// Append to body, click and remove
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Clean up the URL object
		window.URL.revokeObjectURL(url);
	}

	public static async downloadInvoicePdf(invoiceId: string) {
		const params = { url: true };
		const url = generateQueryParams(`${this.baseurl}/${invoiceId}/pdf`, params);
		const response = await AxiosClient.get<{ presigned_url: string }>(url);
		const presignedUrl = response.presigned_url;

		window.open(presignedUrl, '_blank');
	}

	/** Client-side CSV of line items with amount > 0; triggers download. @returns row count, or 0 if nothing to export */
	public static downloadInvoiceCsv(invoice: Invoice): number {
		return downloadInvoiceLineItemsCsv(invoice);
	}

	public static async triggerCommunication(invoiceId: string) {
		return await AxiosClient.post(`${this.baseurl}/${invoiceId}/comms/trigger`);
	}
}

export default InvoiceApi;
