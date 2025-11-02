import { AxiosClient } from '@/core/axios/verbs';
import { User } from '@/models';
import { CreateUserRequest, UpdateTenantPayload } from '@/types/dto';
import { GetServiceAccountsResponse } from '@/types/dto/UserApi';

export class UserApi {
	private static baseUrl = '/users';

	// Fetch all users
	public static async getAllUsers(): Promise<User[]> {
		return await AxiosClient.get<User[]>(this.baseUrl);
	}

	// Fetch user by ID
	public static async getUserById(userId: string): Promise<User> {
		return await AxiosClient.get<User>(`${this.baseUrl}/${userId}`);
	}

	// Fetch service accounts only
	public static async getServiceAccounts(): Promise<User[]> {
		const response = await AxiosClient.get<GetServiceAccountsResponse>(`${this.baseUrl}/service-accounts`);
		return response.service_accounts;
	}

	// Create a new user
	public static async createUser(data: CreateUserRequest): Promise<User> {
		return await AxiosClient.post<User, CreateUserRequest>(this.baseUrl, data);
	}

	// Update an existing user
	public static async updateUser(data: UpdateTenantPayload): Promise<User> {
		return await AxiosClient.put<User, UpdateTenantPayload>(`tenants/update`, data);
	}

	// Delete a user
	public static async deleteUser(userId: string): Promise<void> {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${userId}`);
	}

	public static async me(): Promise<User> {
		return await AxiosClient.get<User>(`${this.baseUrl}/me`);
	}
}
