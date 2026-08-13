import { describe, it, expect } from 'vitest';
import { canEditRoles, type SettingsMember } from './memberUtils';

function member(overrides: Partial<SettingsMember> = {}): SettingsMember {
	return {
		id: 'user_target',
		email: 'target@example.com',
		type: 'user',
		roles: ['writer'],
		tenant: {} as SettingsMember['tenant'],
		...overrides,
	};
}

describe('canEditRoles', () => {
	it('is false when the caller is not a super_admin', () => {
		expect(canEditRoles(member(), 'user_caller', false)).toBe(false);
	});

	it('is false when the row belongs to the caller themself', () => {
		expect(canEditRoles(member({ id: 'user_caller' }), 'user_caller', true)).toBe(false);
	});

	it('is true for a super_admin editing a different member', () => {
		expect(canEditRoles(member(), 'user_caller', true)).toBe(true);
	});
});
