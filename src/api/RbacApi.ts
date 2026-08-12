import { AxiosClient } from '@/core/axios/verbs';
import { generateQueryParams } from '@/utils/common/api_helper';

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

// The only role ID given special handling in UI (exclusive selection, full-access semantics).
// All other role IDs are treated as opaque, server-driven data.
export const SUPER_ADMIN_ROLE_ID = 'super_admin';

class RbacApi {
	private static baseUrl = '/rbac';

	// Fetch all available roles, optionally filtered to those assignable to a given user type
	public static async getAllRoles(userType?: 'user' | 'service_account'): Promise<RbacRole[]> {
		const url = generateQueryParams(`${this.baseUrl}/roles`, { user_type: userType });
		const response = await AxiosClient.get<GetRolesResponse>(url);
		return response.roles;
	}

	// Fetch a role by ID
	public static async getRoleById(id: string): Promise<RbacRole> {
		return await AxiosClient.get<RbacRole>(`${this.baseUrl}/roles/${id}`);
	}
}

export default RbacApi;
