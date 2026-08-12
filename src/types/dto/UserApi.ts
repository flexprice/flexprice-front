import { User } from '@/models';

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
	name?: string;
}

/** Request for POST /users - add user to tenant. Backend returns one-time password. */
export interface CreateTenantUserRequest {
	type: 'user';
	email: string;
	/** At least one role ID must be selected in the UI; sent as-is to the backend. */
	roles: string[];
}

/** Response includes one-time password (view once, not stored). */
export interface CreateTenantUserResponse {
	user?: User;
	password: string;
}
