import { AxiosClient } from '@/core/axios/verbs';

export interface RbacRole {
	id: string;
	name: string;
	description: string;
	permissions: {
		[entity: string]: string[];
	};
}

export interface GetRolesResponse {
	roles: RbacRole[];
}

class RbacApi {
	private static baseUrl = '/rbac';

	// Fetch all available roles
	public static async getAllRoles(): Promise<RbacRole[]> {
		const response = await AxiosClient.get<GetRolesResponse>(`${this.baseUrl}/roles`);
		return response.roles;
	}
}

export default RbacApi;
