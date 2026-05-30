import { Metadata } from '@/models/base';
import { User } from '@/models';

export interface UpdateUserRequest {
	metadata: Metadata;
}

export interface GetServiceAccountsResponse {
	items: User[];
	pagination?: {
		total: number;
		limit: number;
		offset: number;
	};
}

export interface CreateServiceAccountPayload {
	type: 'service_account';
	roles: string[];
}

/** Request for POST /users - add user to tenant. Backend returns one-time password. */
export interface CreateTenantUserRequest {
	type: 'user';
	email: string;
}

/** Response includes one-time password (view once, not stored). */
export interface CreateTenantUserResponse {
	user?: User;
	password: string;
}
