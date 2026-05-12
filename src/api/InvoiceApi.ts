import { AxiosClient } from '@/core/axios/verbs';
import { Invoice } from '@/models';
import { generateQueryParams } from '@/utils/common/api_helper';
import AuthService from '@/core/auth/AuthService';
import EnvironmentApi from '@/api/EnvironmentApi';
import { SortDirection } from '@/types/common/QueryBuilder';
import { INVOICE_STATUS } from '@/models/Invoice';
import {
	GetInvoicesResponse,
	InvoiceFilter,
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

	/** List/search invoices by filter. Always POSTs to /invoices/search with filter as JSON body. */
	public static async listInvoices(filter: InvoiceFilter = {}): Promise<GetInvoicesResponse> {
		return await AxiosClient.post<GetInvoicesResponse>(`${this.baseurl}/search`, filter);
	}

	/** List invoices for a single customer. Uses listInvoices with customer_id filter. */
	public static async getCustomerInvoices(
		customerId: string,
		pagination?: { limit: number; offset: number },
	): Promise<GetInvoicesResponse> {
		return await this.listInvoices({
			customer_id: customerId,
			// Explicitly include all known invoice statuses; backend defaults may exclude some (e.g. SKIPPED).
			invoice_status: Object.values(INVOICE_STATUS),
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

	public static async updateInvoice(invoiceId: string, payload: Partial<Invoice>): Promise<Invoice> {
		return await AxiosClient.put<Invoice>(`${this.baseurl}/${invoiceId}`, payload);
	}

	public static async recalculateInvoice(invoiceId: string): Promise<RecalculateInvoiceResponse> {
		return await AxiosClient.post<RecalculateInvoiceResponse>(`${this.baseurl}/${invoiceId}/recalculate`);
	}

	public static async getInvoicePdf(invoiceId: string, invoiceNo?: string) {
		const downloadFileName = invoiceNo ? `invoice-${invoiceNo}.pdf` : `invoice-${invoiceId}.pdf`;

		const response = await fetch(`${import.meta.env.VITE_API_URL}${this.baseurl}/${invoiceId}/pdf`, {
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
