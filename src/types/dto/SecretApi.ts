import { PaginationType } from '@/models/Pagination';
import { SecretKey } from '@/models/SecretKey';

export interface GetAllSecretKeysResponse {
	items: SecretKey[];
	pagination: PaginationType;
}

export interface CreateSecretKeyPayload {
	name: string;
	permissions: string[];
	expires_at?: string;
	type: string;
}

export interface CreateSecretKeyResponse {
	api_key: string;
	secret: SecretKey;
}
