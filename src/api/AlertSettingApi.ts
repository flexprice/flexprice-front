import { AxiosClient } from '@/core/axios/verbs';
import {
	CreateAlertSettingsRequest,
	UpdateAlertSettingsRequest,
	AlertSettingResponse,
	SearchAlertSettingsRequest,
	SearchAlertSettingsResponse,
} from '@/types/dto';

class AlertSettingApi {
	private static baseUrl = '/alerts/setting';

	/**
	 * Create a new alert setting (subscription, subscription line item, or group scope)
	 * @param data - Alert setting configuration
	 * @returns Promise<AlertSettingResponse>
	 */
	public static async create(data: CreateAlertSettingsRequest) {
		return AxiosClient.post<AlertSettingResponse, CreateAlertSettingsRequest>(this.baseUrl, data);
	}

	/**
	 * Get an alert setting by ID
	 * @param id - Alert setting ID
	 * @returns Promise<AlertSettingResponse>
	 */
	public static async get(id: string) {
		return await AxiosClient.get<AlertSettingResponse>(`${this.baseUrl}/${id}`);
	}

	/**
	 * Search alert settings with filters (POST /alerts/setting/search)
	 * @param payload - Filters (entity_type, entity_id, parent_entity_id, enabled, etc.)
	 * @returns Promise<SearchAlertSettingsResponse>
	 */
	public static async search(payload: SearchAlertSettingsRequest) {
		return await AxiosClient.post<SearchAlertSettingsResponse, SearchAlertSettingsRequest>(`${this.baseUrl}/search`, payload);
	}

	/**
	 * Update an alert setting's config
	 * @param id - Alert setting ID
	 * @param data - Updated config
	 * @returns Promise<AlertSettingResponse>
	 */
	public static async update(id: string, data: UpdateAlertSettingsRequest) {
		return await AxiosClient.put<AlertSettingResponse, UpdateAlertSettingsRequest>(`${this.baseUrl}/${id}`, data);
	}

	/**
	 * Delete (soft-delete) an alert setting
	 * @param id - Alert setting ID
	 * @returns Promise<void>
	 */
	public static async delete(id: string) {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}
}

export default AlertSettingApi;
