import { describe, expect, it } from 'vitest';
import { canRemoveMember, getRemoveMemberDisabledReason, type SettingsMember } from './memberUtils';

const member = (id: string): SettingsMember =>
	({
		id,
		email: `${id}@example.com`,
		type: 'user',
		tenant: {
			id: 'tenant_1',
			name: 'Acme',
			billing_details: {
				address: {
					address_line1: '',
					address_line2: '',
					address_city: '',
					address_state: '',
					address_postal_code: '',
					address_country: '',
				},
			},
			status: 'published',
			created_at: '',
			updated_at: '',
		},
	}) as SettingsMember;

describe('canRemoveMember', () => {
	it('disables remove when the org has only one user', () => {
		expect(canRemoveMember(member('user_1'), 1, 'user_2')).toBe(false);
	});

	it('disables remove for the current user', () => {
		expect(canRemoveMember(member('user_1'), 3, 'user_1')).toBe(false);
	});

	it('allows remove for another user when multiple members exist', () => {
		expect(canRemoveMember(member('user_2'), 3, 'user_1')).toBe(true);
	});
});

describe('getRemoveMemberDisabledReason', () => {
	const labels = { lastUser: 'last', self: 'self' };

	it('prefers last-user reason over self', () => {
		expect(getRemoveMemberDisabledReason(member('user_1'), 1, 'user_1', labels)).toBe('last');
	});

	it('returns self reason when applicable', () => {
		expect(getRemoveMemberDisabledReason(member('user_1'), 2, 'user_1', labels)).toBe('self');
	});

	it('returns null when remove is allowed', () => {
		expect(getRemoveMemberDisabledReason(member('user_2'), 2, 'user_1', labels)).toBeNull();
	});
});
