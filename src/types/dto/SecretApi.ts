import { Pagination, SecretKey } from '@/models';

export interface GetAllSecretKeysResponse {
	items: SecretKey[];
	pagination: Pagination;
}

export interface CreateSecretKeyPayload {
	name: string;
	expires_at?: string;
	type: string;
	user_id?: string; // Optional: for service account API keys
}

export interface CreateSecretKeyResponse {
	api_key: string;
	secret: SecretKey;
}
