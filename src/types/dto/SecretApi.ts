import { Pagination, SecretKey } from '@/models';

export interface GetAllSecretKeysResponse {
	items: SecretKey[];
	pagination: Pagination;
}

export interface CreateSecretKeyPayload {
	name: string;
	expires_at?: string;
	type: string;
	service_account_id?: string; // For service account API keys
	roles?: string[]; // Optional: for user account API keys with specific roles
}

export interface CreateSecretKeyResponse {
	api_key: string;
	secret: SecretKey;
}
