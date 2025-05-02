import { AxiosClient } from '@/core/axios/verbs';
import { PaginationType } from '@/models/Pagination';
import { SecretKey } from '@/models/SecretKey';
import { generateQueryParams } from '@/utils/common/api_helper';
import { GetAllSecretKeysResponse, CreateSecretKeyPayload, CreateSecretKeyResponse } from '@/types/dto';
// Utility function to format permissions for display
export const formatPermissionDisplay = (permissions: string[]): string => {
	const hasRead = permissions.includes('read');
	const hasWrite = permissions.includes('write');

	if (hasRead && hasWrite) {
		return 'full access';
	} else if (hasRead) {
		return 'read';
	} else if (hasWrite) {
		return 'write';
	} else {
		return 'none';
	}
};

class SecretKeysApi {
	private static baseUrl = '/secrets/api/keys';

	public static async getAllSecretKeys(pagination: PaginationType) {
		const url = generateQueryParams(this.baseUrl, pagination);
		return await AxiosClient.get<GetAllSecretKeysResponse>(url);
	}

	public static async getSecretKeyById(id: string) {
		return await AxiosClient.get<SecretKey>(`${this.baseUrl}/${id}`);
	}

	public static async createSecretKey(data: CreateSecretKeyPayload) {
		return await AxiosClient.post<CreateSecretKeyResponse>(this.baseUrl, data);
	}

	public static async deleteSecretKey(id: string) {
		return await AxiosClient.delete(`${this.baseUrl}/${id}`);
	}
}

export default SecretKeysApi;
