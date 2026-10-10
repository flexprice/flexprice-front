import { describe, it, expect } from 'vitest';
import { AuthTab, RESET_PASSWORD_PATH } from './authTabs';
import { resolveAuthTab } from './resolveAuthTab';

const base = {
	pathname: '/auth',
	search: '',
	isRecoveryLanding: false,
	signupEnabled: true,
};

describe('resolveAuthTab', () => {
	it('defaults to login', () => {
		expect(resolveAuthTab(base)).toBe(AuthTab.LOGIN);
	});

	it('shows the reset form on the dedicated path', () => {
		expect(resolveAuthTab({ ...base, pathname: RESET_PASSWORD_PATH })).toBe(AuthTab.RESET_PASSWORD);
	});

	// The regression this whole change exists for: GoTrue fell back to the Site URL,
	// so the path and the ?tab= marker were both lost and only the fragment was left.
	// Resolving that to LOGIN is what silently signed the user in instead of asking
	// for a new password.
	it('shows the reset form for a recovery landing even at the site root with no params', () => {
		expect(resolveAuthTab({ ...base, pathname: '/', search: '', isRecoveryLanding: true })).toBe(AuthTab.RESET_PASSWORD);
	});

	it('still honours ?tab=reset-password, for links already sent', () => {
		expect(resolveAuthTab({ ...base, search: '?tab=reset-password' })).toBe(AuthTab.RESET_PASSWORD);
	});

	it('honours ?tab=forgot-password', () => {
		expect(resolveAuthTab({ ...base, search: '?tab=forgot-password' })).toBe(AuthTab.FORGOT_PASSWORD);
	});

	it('honours ?tab=signup when signup is enabled', () => {
		expect(resolveAuthTab({ ...base, search: '?tab=signup' })).toBe(AuthTab.SIGNUP);
	});

	it('falls back to login when signup is disabled', () => {
		expect(resolveAuthTab({ ...base, search: '?tab=signup', signupEnabled: false })).toBe(AuthTab.LOGIN);
	});

	it('ignores an unrecognised tab', () => {
		expect(resolveAuthTab({ ...base, search: '?tab=nonsense' })).toBe(AuthTab.LOGIN);
	});

	it('lets a recovery landing outrank a signup tab', () => {
		expect(resolveAuthTab({ ...base, search: '?tab=signup', isRecoveryLanding: true })).toBe(AuthTab.RESET_PASSWORD);
	});
});
