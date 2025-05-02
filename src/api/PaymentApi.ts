import { AxiosClient } from '@/core/axios/verbs';
import { Payment } from '@/models/Payment';
import { generateQueryParams } from '@/utils/common/api_helper';
import { GetAllPaymentsPayload, GetAllPaymentsResponse } from '@/types/dto';

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
