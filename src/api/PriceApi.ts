import { AxiosClient } from '@/core/axios/verbs';
import { Price } from '@/models/Price';
import { GetAllPricesResponse } from '@/types/dto';

export class PriceApi {
	private static baseUrl = '/prices';

	public static async getAllPrices() {
		return await AxiosClient.get<GetAllPricesResponse>(this.baseUrl);
	}

	public static async getPriceById(id: string) {
		return await AxiosClient.get<Price>(`${this.baseUrl}/${id}`);
	}
}
