import { AxiosClient } from '@/core/axios/verbs';
import { Invoice } from '@/models/Invoice';
import { generateQueryParams } from '@/utils/common/api_helper';
import { PaginationType } from '@/models/Pagination';
import AuthService from '@/core/auth/AuthService';
import EnvironmentApi from '@/api/EnvironmentApi';

interface GetInvoicesResponse {
	items: Invoice[];
	pagination: PaginationType;
}

interface GetAllInvoicesPayload {
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

interface UpdateInvoiceStatusPayload {
	invoiceId: string;
	payment_status?: string;
	amount?: number;
}

interface GetInvoicePreviewPayload {
	period_end: string;
	period_start: string;
	subscription_id: string;
}

interface CreateOneOffInvoicePayload {
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

class InvoiceApi {
	private static baseurl = '/invoices';

	public static async getCustomerInvoices(customerId: string): Promise<GetInvoicesResponse> {
		return await AxiosClient.get<GetInvoicesResponse>(`/invoices?customer_id=${customerId}`);
	}

	public static async getInvoiceById(invoiceId: string): Promise<Invoice> {
		return await AxiosClient.get<Invoice>(`${this.baseurl}/${invoiceId}`);
	}

	public static async updateInvoicePaymentStatus(invoiceId: string, status: string): Promise<Invoice> {
		return await AxiosClient.put<Invoice>(`${this.baseurl}/${invoiceId}/payment`, {
			payment_status: status,
		});
	}

	public static async getAllInvoices(query: GetAllInvoicesPayload = {}): Promise<GetInvoicesResponse> {
		const url = generateQueryParams(this.baseurl, query);
		return await AxiosClient.get<GetInvoicesResponse>(url);
	}

	public static async updateInvoiceStatus(payload: UpdateInvoiceStatusPayload): Promise<Invoice> {
		return await AxiosClient.put<Invoice>(`${this.baseurl}/${payload.invoiceId}/status`, payload);
	}

	public static async voidInvoice(invoiceId: string) {
		return await AxiosClient.post(`${this.baseurl}/${invoiceId}/void`);
	}

	public static async finalizeInvoice(invoiceId: string) {
		return await AxiosClient.post(`${this.baseurl}/${invoiceId}/finalize`);
	}

	public static async attemptPayment(invoiceId: string) {
		return await AxiosClient.post(`${this.baseurl}/${invoiceId}/payment/attempt`);
	}

	public static async getInvoicePreview(payload: GetInvoicePreviewPayload) {
		const url = generateQueryParams(`${this.baseurl}/preview`, payload);
		return await AxiosClient.get(url);
	}

	public static async createOneOffInvoice(payload: CreateOneOffInvoicePayload): Promise<Invoice> {
		return await AxiosClient.post<Invoice>(`${this.baseurl}`, payload);
	}

	public static async getInvoicePdf(invoiceId: string, invoiceNo?: string) {
		const downloadFileName = invoiceNo ? `invoice-${invoiceNo}.pdf` : `invoice-${invoiceId}.pdf`;

		const response = await fetch(`${import.meta.env.VITE_API_URL}${this.baseurl}/${invoiceId}/pdf`, {
			headers: {
				Authorization: `Bearer ${await AuthService.getAcessToken()}`,
				'X-Environment-ID': EnvironmentApi.getActiveEnvironment()?.id || '',
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
}

export default InvoiceApi;
