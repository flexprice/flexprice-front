import { AxiosClient } from '@/core/axios/verbs';
import { PaginationType } from '@/models/Pagination';
import { Payment } from '@/models/Payment';
import { generateQueryParams } from '@/utils/common/api_helper';

export interface GetAllPaymentsPayload {
	currency?: string;
	destination_id?: string;
	destination_type?: string;
	end_time?: string;
	expand?: string;
	limit: number;
	offset: number;
	order?: 'asc' | 'desc';
	payment_gateway?: string;
	payment_ids?: string[];
	payment_method_type?: string;
	payment_status?: string;
	sort?: string;
	start_time?: string;
	status?: 'published' | 'deleted' | 'archived' | string;
}

interface GetAllPaymentsResponse {
	items: Payment[];
	pagination: PaginationType;
}

class PaymentApi {
	private static baseUrl = '/payments';

	public static async createPayment(data: Partial<Payment>) {
		return await AxiosClient.post<Payment>(this.baseUrl, data);
	}

	public static async getPaymentById(id: string) {
		return await AxiosClient.get<Payment>(`${this.baseUrl}/${id}`);
	}

	public static async updatePayment(id: string, data: Partial<Payment>) {
		return await AxiosClient.put<Payment>(`${this.baseUrl}/${id}`, data);
	}

	public static async deletePayment(id: string) {
		return await AxiosClient.delete(`${this.baseUrl}/${id}`);
	}

	public static async getAllPayments(payload: GetAllPaymentsPayload) {
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get<GetAllPaymentsResponse>(url);
	}
}

export default PaymentApi;
