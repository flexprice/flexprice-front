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

/** Response includes a one-time password (hosted) or an invite link token (self-hosted); view once, not stored. */
export interface CreateTenantUserResponse {
	user?: User;
	password?: string;
	invite_token?: string;
	invite_expires_at?: string;
}

export type PasswordLinkPurpose = 'invite' | 'reset';

/** Response for POST /users/{id}/password-link: a one-time link for a member to set their password. */
export interface PasswordLinkResponse {
	token: string;
	purpose: PasswordLinkPurpose;
	expires_at: string;
}

/** Response for POST /auth/password/check. */
export interface PasswordLinkDetails {
	purpose: PasswordLinkPurpose;
	email: string;
}

/** Request for PUT /users/{id}/roles - change an existing user's roles. Service accounts aren't supported (fixed at creation). */
export interface UpdateUserRolesRequest {
	roles: string[];
}

export interface ActiveApiKey {
	id: string;
	key_name: string;
}

export interface ActiveEnvironmentApiKeys {
	env_name: string;
	api_keys: ActiveApiKey[];
}

/** Shape of the `details` field on the 400 returned when the target user has active API keys (see ensureNoActiveAPIKeys on the backend). */
export interface UpdateUserRolesErrorDetails {
	active_api_key_count?: number;
	active_api_keys?: Record<string, ActiveEnvironmentApiKeys>;
}
