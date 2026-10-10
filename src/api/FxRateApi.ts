import { AxiosClient } from '@/core/axios/verbs';
import type { FxRate } from '@/models/FxRate';
import { DataType, FilterOperator } from '@/types/common/QueryBuilder';
import type { CreateFxRateRequest, FxRateFilter, ListFxRatesResponse, UpdateFxRateRequest } from '@/types/dto/FxRate';

/** Market rates are stored but cannot be resolved yet, so every list shows fixed rates only. */
const FIXED_RATES_ONLY = { field: 'source', operator: FilterOperator.EQUAL, data_type: DataType.STRING, value: { string: 'fixed' } };

class FxRateApi {
	private static baseUrl = '/forex';

	public static async createFxRate(data: CreateFxRateRequest) {
		return AxiosClient.post<FxRate, CreateFxRateRequest>(this.baseUrl, data);
	}

	public static async queryFxRates(filter: FxRateFilter) {
		return AxiosClient.post<ListFxRatesResponse, FxRateFilter>(`${this.baseUrl}/query`, {
			...filter,
			filters: [...(filter.filters ?? []), FIXED_RATES_ONLY],
		});
	}

	public static async getFxRate(id: string) {
		return AxiosClient.get<FxRate>(`${this.baseUrl}/${id}`);
	}

	public static async updateFxRate(id: string, data: UpdateFxRateRequest) {
		return AxiosClient.put<FxRate, UpdateFxRateRequest>(`${this.baseUrl}/${id}`, data);
	}

	/** Customer and subscription overrides only; the backend archives the row. */
	public static async deleteFxRate(id: string): Promise<void> {
		await AxiosClient.delete(`${this.baseUrl}/${id}`);
	}
}

export default FxRateApi;
