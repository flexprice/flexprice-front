import { AxiosClient } from '@/core/axios/verbs';
import { Addon } from '@/models';
import { generateQueryParams } from '@/utils/common/api_helper';
import {
	CreateAddonRequest,
	UpdateAddonRequest,
	GetAddonsPayload,
	GetAddonsResponse,
	GetAddonByFilterPayload,
	AddonResponse,
	SynchronizeAddonPricesWithSubscriptionResponse,
} from '@/types/dto';
import { ListEntitlementsResponse } from '@/types/dto/Entitlement';

class AddonApi {
	private static baseUrl = '/addons';

	public static async List(payload: GetAddonsPayload = {}): Promise<GetAddonsResponse> {
		const url = generateQueryParams(this.baseUrl, {
			...payload,
			expand: 'prices,meters,entitlements',
		});
		return await AxiosClient.get<GetAddonsResponse>(url);
	}

	public static async Get(id: string) {
		return await AxiosClient.get<AddonResponse>(`${this.baseUrl}/${id}`);
	}

	public static async GetByLookupKey(lookupKey: string) {
		return await AxiosClient.get<AddonResponse>(`${this.baseUrl}/lookup/${lookupKey}`);
	}

	public static async Create(data: CreateAddonRequest) {
		return await AxiosClient.post<Addon, CreateAddonRequest>(this.baseUrl, data);
	}

	public static async Update(id: string, data: UpdateAddonRequest) {
		return await AxiosClient.put<Addon, UpdateAddonRequest>(`${this.baseUrl}/${id}`, data);
	}

	public static async Delete(id: string) {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}

	public static async ListByFilter(payload: GetAddonByFilterPayload) {
		return await AxiosClient.post<GetAddonsResponse, GetAddonByFilterPayload>(`${this.baseUrl}/search`, payload);
	}

	public static async GetEntitlements(addonId: string) {
		return await AxiosClient.get<ListEntitlementsResponse>(`${this.baseUrl}/${addonId}/entitlements`);
	}

	public static async synchronizeAddonPricesWithSubscription(id: string) {
		return await AxiosClient.post<SynchronizeAddonPricesWithSubscriptionResponse>(`${this.baseUrl}/${id}/sync/subscriptions`);
	}
}

export default AddonApi;
