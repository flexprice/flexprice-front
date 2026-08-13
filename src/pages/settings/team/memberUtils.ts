import { User } from '@/models';
import { ENTITY_STATUS } from '@/models/base';

export type SettingsMember = User & {
	created_at?: string;
	status?: string;
};

export type MemberRoleFilter = 'all' | 'admin' | 'member';
export type MemberStatusFilter = 'all' | 'joined' | 'pending';

export function membersHaveStatus(members: SettingsMember[]): boolean {
	return members.some((member) => member.status != null && member.status.trim() !== '');
}

export function isAdminMember(user: SettingsMember): boolean {
	const role = user.roles?.[0]?.toLowerCase() ?? 'member';
	return role.includes('admin');
}

export function isPendingMember(user: SettingsMember): boolean {
	const status = user.status?.toLowerCase();
	if (!status) return false;
	return status !== ENTITY_STATUS.PUBLISHED;
}

export function filterMembers(members: SettingsMember[], roleFilter: MemberRoleFilter, statusFilter: MemberStatusFilter): SettingsMember[] {
	return members.filter((member) => {
		const matchesRole =
			roleFilter === 'all' || (roleFilter === 'admin' && isAdminMember(member)) || (roleFilter === 'member' && !isAdminMember(member));

		const matchesStatus =
			statusFilter === 'all' ||
			(statusFilter === 'pending' && isPendingMember(member)) ||
			(statusFilter === 'joined' && !isPendingMember(member));

		return matchesRole && matchesStatus;
	});
}

export function getMemberJoinedDate(user: SettingsMember): string | null {
	return user.created_at ?? user.tenant?.created_at ?? null;
}

/** DELETE /users/{id} is only supported for service accounts, not human team users. */
export function canDeleteUser(user: SettingsMember): boolean {
	return user.type === 'service_account';
}

/** PUT /users/{id}/roles is super_admin-only and rejects editing your own roles. */
export function canEditRoles(user: SettingsMember, currentUserId: string, isSuperAdmin: boolean): boolean {
	return isSuperAdmin && user.id !== currentUserId;
}
