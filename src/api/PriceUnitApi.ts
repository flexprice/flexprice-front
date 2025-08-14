import { AxiosClient } from '@/core/axios/verbs';
import { generateQueryParams } from '@/utils/common/api_helper';
import { Pagination } from '@/models/Pagination';
import { TypedBackendSort, TypedBackendFilter } from '@/types/formatters/QueryBuilder';
import { CreatePriceUnitRequest, UpdatePriceUnitRequest, PriceUnitResponse } from '@/types/dto/PriceUnit';
import { QueryFilter, TimeRangeFilter } from '@/types/dto/base';

interface GetPriceUnitsPayload extends QueryFilter, TimeRangeFilter {
	filters?: TypedBackendFilter[];
	sort?: TypedBackendSort[];
	environment_id?: string;
}

interface GetPriceUnitsResponse {
	items: PriceUnitResponse[];
	pagination: Pagination;
}

class PriceUnitApi {
	private static baseUrl = '/prices/units';

	public static async create(data: CreatePriceUnitRequest): Promise<PriceUnitResponse> {
		return await AxiosClient.post<PriceUnitResponse, CreatePriceUnitRequest>(this.baseUrl, data);
	}

	public static async update(id: string, data: UpdatePriceUnitRequest): Promise<PriceUnitResponse> {
		return await AxiosClient.put<PriceUnitResponse, UpdatePriceUnitRequest>(`${this.baseUrl}/${id}`, data);
	}

	public static async delete(id: string): Promise<void> {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}

	public static async getById(id: string): Promise<PriceUnitResponse> {
		return await AxiosClient.get<PriceUnitResponse>(`${this.baseUrl}/${id}`);
	}

	public static async getByCode(code: string): Promise<PriceUnitResponse> {
		return await AxiosClient.get<PriceUnitResponse>(`${this.baseUrl}/code/${code}`);
	}

	public static async list(payload: GetPriceUnitsPayload = {}): Promise<GetPriceUnitsResponse> {
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get<GetPriceUnitsResponse>(url);
	}

	public static async search(payload: GetPriceUnitsPayload): Promise<GetPriceUnitsResponse> {
		return await AxiosClient.post<GetPriceUnitsResponse, GetPriceUnitsPayload>(`${this.baseUrl}/search`, payload);
	}
}

export default PriceUnitApi;
