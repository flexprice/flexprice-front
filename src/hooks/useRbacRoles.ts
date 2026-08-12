import { useQuery } from '@tanstack/react-query';
import RbacApi, { RbacRole } from '@/api/RbacApi';

export function useRbacRoles(userType: 'user' | 'service_account', options?: { enabled?: boolean }) {
	return useQuery<RbacRole[]>({
		queryKey: ['rbac-roles', userType],
		queryFn: () => RbacApi.getAllRoles(userType),
		enabled: options?.enabled ?? true,
		staleTime: 5 * 60 * 1000,
		retry: false,
	});
}
