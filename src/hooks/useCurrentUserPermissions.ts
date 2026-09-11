import { useCallback, useMemo } from 'react';
import useUser from '@/hooks/useUser';
import { useRbacRoles } from '@/hooks/useRbacRoles';
import { RbacRole, SUPER_ADMIN_ROLE_ID } from '@/api/RbacApi';

export type RbacAction = 'read' | 'write';

// Mirrors internal/types/rbac.go's Entity constants exactly — keep in sync with the backend.
export type RbacEntity =
	| 'user'
	| 'environment'
	| 'event'
	| 'meter'
	| 'price'
	| 'customer'
	| 'plan'
	| 'addon'
	| 'group'
	| 'alert_settings'
	| 'subscription'
	| 'wallet'
	| 'tenant'
	| 'invoice'
	| 'feature'
	| 'entitlement'
	| 'creditgrant'
	| 'payment'
	| 'integration'
	| 'task'
	| 'tax'
	| 'secret'
	| 'connection'
	| 'costsheet'
	| 'creditnote'
	| 'coupon'
	| 'ai'
	| 'portal'
	| 'webhook'
	| 'cron'
	| 'setting'
	| 'oauth'
	| 'checkoutsession'
	| 'workflow'
	// ponytail: no backend RBAC entry for this yet — add to internal/types/rbac.go's Entity
	// constants when the backend gate exists; UI-level gate for now.
	| 'license';

interface CurrentUserPermissions {
	roles: string[];
	isSuperAdmin: boolean;
	can: (entity: RbacEntity, action: RbacAction) => boolean;
	isLoading: boolean;
	isError: boolean;
}

/**
 * Derives "can the current session do (entity, action)?" from the roles
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
		(entity: RbacEntity, action: RbacAction) =>
			roles.some((roleId) => {
				const perms = roleDefsById[roleId]?.permissions;
				if (!perms) return false;
				if (perms['*']?.includes('*') || perms['*']?.includes(action)) return true;
				if (perms[entity]?.includes('*') || perms[entity]?.includes(action)) return true;
				return false;
			}),
		[roles, roleDefsById],
	);

	// TanStack Query's own `isLoading` (isPending && isFetching) can be false for one
	// render right as `enabled` flips from false to true — the query has no data yet,
	// but the fetch hasn't been dispatched. During that render, `userLoading` has
	// already gone false too, so relying on the two `isLoading` flags alone lets
	// can() briefly evaluate against an empty role catalog and report every
	// permission as denied (RouteGuard flashes "Access denied" before the real
	// roles arrive). Treat "logged in but roles not fetched even once yet" as
	// loading regardless of what the query's own flag says.
	const rolesNotYetFetched = !!user && roleDefs === undefined && !isError;

	return {
		roles,
		isSuperAdmin: roles.includes(SUPER_ADMIN_ROLE_ID),
		can,
		isLoading: userLoading || rolesLoading || rolesNotYetFetched,
		isError,
	};
}

export default useCurrentUserPermissions;
