import { AxiosClient } from '@/core/axios/verbs';
import { isHttpNotFoundError } from '@/core/axios/types';

export interface Setting {
	key: string;
	value: any;
	created_at?: string;
	updated_at?: string;
}

export interface UpdateSettingRequest {
	value: any;
}

class SettingsApi {
	private static baseUrl = '/settings';

	/**
	 * Get a setting by key
	 * GET /settings/:key
	 */
	public static async getSettingByKey(key: string): Promise<Setting> {
		return await AxiosClient.get<Setting>(`${this.baseUrl}/${key}`);
	}

	/**
	 * Update a setting by key
	 * PUT /settings/:key
	 */
	public static async updateSettingByKey(key: string, data: UpdateSettingRequest): Promise<Setting> {
		return await AxiosClient.put<Setting>(`${this.baseUrl}/${key}`, data);
	}

	/**
	 * Delete a setting by key
	 * DELETE /settings/:key
	 */
	public static async deleteSettingByKey(key: string): Promise<void> {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${key}`);
	}

	/**
	 * Reset a setting to server defaults. DELETE removes a saved override; 404 means
	 * nothing was saved (already on defaults). Returns the effective config from GET.
	 */
	public static async resetSettingToDefaults(key: string): Promise<Setting> {
		try {
			await this.deleteSettingByKey(key);
		} catch (error) {
			if (!isHttpNotFoundError(error)) throw error;
		}

		return this.getSettingByKey(key);
	}
}

export default SettingsApi;
