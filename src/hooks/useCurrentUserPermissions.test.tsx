import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RbacRole } from '@/api/RbacApi';

const mockUseUser = vi.fn();
const mockUseRbacRoles = vi.fn();

vi.mock('@/hooks/useUser', () => ({
	default: (...args: unknown[]) => mockUseUser(...args),
}));

vi.mock('@/hooks/useRbacRoles', () => ({
	useRbacRoles: (...args: unknown[]) => mockUseRbacRoles(...args),
}));

// Imported after the mocks above so the module picks them up.
import { useCurrentUserPermissions } from './useCurrentUserPermissions';

const role = (id: string, permissions: Record<string, string[]>): RbacRole => ({
	id,
	name: id,
	description: '',
	permissions,
});

function setup(
	roles: string[],
	roleDefs: RbacRole[],
	overrides: { userLoading?: boolean; rolesLoading?: boolean; isError?: boolean } = {},
) {
	mockUseUser.mockReturnValue({
		user: { roles, type: 'user' },
		loading: overrides.userLoading ?? false,
	});
	mockUseRbacRoles.mockReturnValue({
		data: roleDefs,
		isLoading: overrides.rolesLoading ?? false,
		isError: overrides.isError ?? false,
	});
}

describe('useCurrentUserPermissions.can()', () => {
	beforeEach(() => {
		mockUseUser.mockReset();
		mockUseRbacRoles.mockReset();
	});

	it('*:* grants every entity and action', () => {
		setup(['a'], [role('a', { '*': ['*'] })]);
		const { result } = renderHook(() => useCurrentUserPermissions());
		expect(result.current.can('invoice', 'write')).toBe(true);
		expect(result.current.can('workflow', 'read')).toBe(true);
	});

	it('*:read grants read on any entity but not write', () => {
		setup(['a'], [role('a', { '*': ['read'] })]);
		const { result } = renderHook(() => useCurrentUserPermissions());
		expect(result.current.can('invoice', 'read')).toBe(true);
		expect(result.current.can('invoice', 'write')).toBe(false);
	});

	it('entity:* grants both read and write on that entity only', () => {
		setup(['a'], [role('a', { invoice: ['*'] })]);
		const { result } = renderHook(() => useCurrentUserPermissions());
		expect(result.current.can('invoice', 'read')).toBe(true);
		expect(result.current.can('invoice', 'write')).toBe(true);
		expect(result.current.can('plan', 'read')).toBe(false);
	});

	it('entity:read grants only read on that entity', () => {
		setup(['a'], [role('a', { invoice: ['read'] })]);
		const { result } = renderHook(() => useCurrentUserPermissions());
		expect(result.current.can('invoice', 'read')).toBe(true);
		expect(result.current.can('invoice', 'write')).toBe(false);
	});

	it('denies an unrelated entity not mentioned in the permission map', () => {
		setup(['a'], [role('a', { invoice: ['read'] })]);
		const { result } = renderHook(() => useCurrentUserPermissions());
		expect(result.current.can('plan', 'read')).toBe(false);
	});

	it('grants access if ANY held role grants it, even if another role does not', () => {
		setup(['a', 'b'], [role('a', { invoice: ['read'] }), role('b', { invoice: ['*'] })]);
		const { result } = renderHook(() => useCurrentUserPermissions());
		expect(result.current.can('invoice', 'write')).toBe(true);
	});

	it('denies everything when the user holds no roles', () => {
		setup([], []);
		const { result } = renderHook(() => useCurrentUserPermissions());
		expect(result.current.can('invoice', 'read')).toBe(false);
		expect(result.current.isSuperAdmin).toBe(false);
	});

	it('does not throw and denies access when a held role id is missing from the fetched role definitions', () => {
		setup(['ghost-role'], []);
		const { result } = renderHook(() => useCurrentUserPermissions());
		expect(() => result.current.can('invoice', 'read')).not.toThrow();
		expect(result.current.can('invoice', 'read')).toBe(false);
	});

	it('isSuperAdmin is true only when super_admin is among the held roles', () => {
		setup(['super_admin'], [role('super_admin', { '*': ['*'] })]);
		const { result } = renderHook(() => useCurrentUserPermissions());
		expect(result.current.isSuperAdmin).toBe(true);
	});

	it('reports isLoading true while the user or the role definitions are still loading', () => {
		setup(['a'], [role('a', { '*': ['read'] })], { userLoading: true });
		const { result: r1 } = renderHook(() => useCurrentUserPermissions());
		expect(r1.current.isLoading).toBe(true);

		setup(['a'], [role('a', { '*': ['read'] })], { rolesLoading: true });
		const { result: r2 } = renderHook(() => useCurrentUserPermissions());
		expect(r2.current.isLoading).toBe(true);
	});

	it('reports isLoading true when the user has loaded but the roles query has not fetched even once yet (enabled just flipped true, fetch not dispatched)', () => {
		// Reproduces a real race: TanStack Query's own isLoading (isPending && isFetching) can
		// read false for one render right as `enabled` flips from false to true — data is still
		// undefined, but the fetch hasn't been dispatched. Without this guard, can() would
		// evaluate against an empty role catalog and every permission check would report denied.
		mockUseUser.mockReturnValue({ user: { roles: ['a'], type: 'user' }, loading: false });
		mockUseRbacRoles.mockReturnValue({ data: undefined, isLoading: false, isError: false });

		const { result } = renderHook(() => useCurrentUserPermissions());
		expect(result.current.isLoading).toBe(true);
		expect(result.current.can('plan', 'write')).toBe(false);
	});

	it('surfaces isError from the roles query', () => {
		setup(['a'], [], { isError: true });
		const { result } = renderHook(() => useCurrentUserPermissions());
		expect(result.current.isError).toBe(true);
	});
});
