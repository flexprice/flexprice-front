import { useCallback, useMemo } from 'react';
import useUser from '@/hooks/useUser';
import { useRbacRoles } from '@/hooks/useRbacRoles';
import { RbacRole, SUPER_ADMIN_ROLE_ID } from '@/api/RbacApi';

export type RbacAction = 'read' | 'write';

interface CurrentUserPermissions {
	roles: string[];
	isSuperAdmin: boolean;
	can: (entity: string, action: RbacAction) => boolean;
	isLoading: boolean;
	isError: boolean;
}

/**
 * Derives "can the current session do (entity, action)?" from the roles
 * already fetched via useUser() and the role->permission map fetched via
 * useRbacRoles(). Both are server-fetched data (AGENTS.md forbids putting
 * server-fetched data in Zustand), so this stays a plain TanStack-Query-backed
 * hook rather than a store.
 *
 * can() mirrors internal/rbac/rbac.go RBACService.HasPermission: wildcard
 * entity ("*") is checked before the specific entity, each with wildcard or
 * exact action.
 */
export function useCurrentUserPermissions(): CurrentUserPermissions {
	const { user, loading: userLoading } = useUser();
	const roles = useMemo(() => user?.roles ?? [], [user?.roles]);
	const userType = (user?.type ?? 'user') as 'user' | 'service_account';

	const { data: roleDefs, isLoading: rolesLoading, isError } = useRbacRoles(userType, { enabled: !!user });

	const roleDefsById = useMemo(() => {
		const map: Record<string, RbacRole> = {};
		(roleDefs ?? []).forEach((role) => {
			map[role.id] = role;
		});
		return map;
	}, [roleDefs]);

	const can = useCallback(
		(entity: string, action: RbacAction) =>
			roles.some((roleId) => {
				const perms = roleDefsById[roleId]?.permissions;
				if (!perms) return false;
				if (perms['*']?.includes('*') || perms['*']?.includes(action)) return true;
				if (perms[entity]?.includes('*') || perms[entity]?.includes(action)) return true;
				return false;
			}),
		[roles, roleDefsById],
	);

	return {
		roles,
		isSuperAdmin: roles.includes(SUPER_ADMIN_ROLE_ID),
		can,
		isLoading: userLoading || rolesLoading,
		isError,
	};
}

export default useCurrentUserPermissions;
