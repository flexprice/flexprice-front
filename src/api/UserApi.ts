import { AxiosClient } from '@/core/axios/verbs';
import { User } from '@/models';
import { CreateUserRequest, UpdateTenantPayload } from '@/types/dto';
import {
	CreateServiceAccountPayload,
	CreateTenantUserRequest,
	CreateTenantUserResponse,
	GetServiceAccountsResponse,
} from '@/types/dto/UserApi';
import { DataType } from '@/types/common/QueryBuilder';
import { FilterOperator } from '@/types/common/QueryBuilder';
import type { TypedBackendFilter } from '@/types/formatters/QueryBuilder';

export interface GetTenantMembersParams {
	limit: number;
	offset: number;
}

export class UserApi {
	private static baseUrl = '/users';
	private static v1UsersUrl = '/users';

	/** Tenant members: type=user, status=published, with pagination */
	public static async getTenantMembers(params: GetTenantMembersParams): Promise<GetServiceAccountsResponse> {
		const filters: TypedBackendFilter[] = [
			{
				field: 'status',
				operator: FilterOperator.EQUAL,
				data_type: DataType.STRING,
				value: { string: 'published' },
			},
		];
		return await AxiosClient.post<GetServiceAccountsResponse>(`${this.baseUrl}/search`, {
			limit: params.limit,
			offset: params.offset,
			type: 'user',
			filters,
			sort: [
				{
					field: 'created_at',
					direction: 'desc',
				},
			],
		});
	}

	// Fetch all users (type: 'user' only, not service accounts) – legacy, prefer getTenantMembers for settings
	public static async getAllUsers(): Promise<GetServiceAccountsResponse> {
		const response = await AxiosClient.post<GetServiceAccountsResponse>(`${this.baseUrl}/search`, {
			limit: 1000,
			offset: 0,
			type: 'user',
			filters: [],
			sort: [
				{
					field: 'created_at',
					direction: 'desc',
				},
			],
		});
		return response;
	}

	// Fetch user by ID
	public static async getUserById(userId: string): Promise<User> {
		return await AxiosClient.get<User>(`${this.baseUrl}/${userId}`);
	}

	// Fetch service accounts only
	public static async getServiceAccounts(
		params: { limit: number; offset: number } = { limit: 10, offset: 0 },
	): Promise<GetServiceAccountsResponse> {
		const response = await AxiosClient.post<GetServiceAccountsResponse>(`${this.baseUrl}/search`, {
			limit: params.limit,
			offset: params.offset,
			type: 'service_account',
			sort: [
				{
					field: 'created_at',
					direction: 'desc',
				},
			],
		});
		return response;
	}

	// Create a new user
	public static async createUser(data: CreateUserRequest): Promise<User> {
		return await AxiosClient.post<User, CreateUserRequest>(this.baseUrl, data);
	}

	/**
	 * Add a user to the tenant. Body: { type: 'user', email }.
	 * Returns one-time password (view once only, not stored).
	 */
	public static async addUserToTenant(data: CreateTenantUserRequest): Promise<CreateTenantUserResponse> {
		return await AxiosClient.post<CreateTenantUserResponse, CreateTenantUserRequest>(this.v1UsersUrl, data);
	}

	// Create a new service account
	public static async createServiceAccount(data: CreateServiceAccountPayload): Promise<User> {
		return await AxiosClient.post<User>(this.baseUrl, data);
	}

	// Update an existing user
	public static async updateUser(data: UpdateTenantPayload): Promise<User> {
		return await AxiosClient.put<User, UpdateTenantPayload>(`tenants/update`, data);
	}

	// Update a service account (name, metadata)
	public static async updateServiceAccount(id: string, data: { name?: string; metadata?: Record<string, string> }): Promise<User> {
		return await AxiosClient.put<User, typeof data>(`${this.baseUrl}/${id}`, data);
	}

	// Delete a user (service accounts only — human users use removeUserFromTenant)
	public static async deleteUser(userId: string): Promise<void> {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${userId}`);
	}

	/** Remove a human user from the current tenant. POST /users/{id}/remove → 204. */
	public static async removeUserFromTenant(userId: string): Promise<void> {
		await AxiosClient.post<void>(`${this.baseUrl}/${userId}/remove`);
	}

	public static async me(): Promise<User> {
		return await AxiosClient.get<User>(`${this.baseUrl}/me`);
	}
}
