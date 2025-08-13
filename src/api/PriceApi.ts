import { AxiosClient } from '@/core/axios/verbs';
import { Price } from '@/models/Price';
import { GetAllPricesResponse, CreatePriceRequest, UpdatePriceRequest, PriceFilter, CreateBulkPriceRequest } from '@/types/dto/Price';
import { generateQueryParams } from '@/utils/common/api_helper';

export class PriceApi {
	private static baseUrl = '/prices';

	public static async ListPrices(filters?: PriceFilter) {
		const url = filters ? generateQueryParams(this.baseUrl, filters) : this.baseUrl;
		return await AxiosClient.get<GetAllPricesResponse>(url);
	}

	public static async GetPriceById(id: string) {
		return await AxiosClient.get<Price>(`${this.baseUrl}/${id}`);
	}

	public static async CreatePrice(data: CreatePriceRequest) {
		return await AxiosClient.post<Price>(this.baseUrl, data);
	}

	public static async CreateBulkPrice(data: CreateBulkPriceRequest) {
		return await AxiosClient.post<Price[]>(`${this.baseUrl}/bulk`, data);
	}

	public static async UpdatePrice(id: string, data: UpdatePriceRequest) {
		return await AxiosClient.put<Price>(`${this.baseUrl}/${id}`, data);
	}

	public static async DeletePrice(id: string) {
		return await AxiosClient.delete(`${this.baseUrl}/${id}`);
	}
}
