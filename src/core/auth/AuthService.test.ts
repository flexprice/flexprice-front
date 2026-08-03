import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/config/config', () => ({
	config: { app: { env: 'self-hosted' } },
	APP_ENV: { SelfHosted: 'self-hosted' },
}));

vi.mock('../services/supbase/config', () => ({ default: { auth: { signOut: vi.fn() } } }));

vi.mock('../routes/Routes', () => ({ RouteNames: { login: '/login' } }));

beforeEach(() => {
	vi.resetModules();
	localStorage.clear();
	// jsdom forbids assigning window.location.href outright; make it writable for the redirect.
	Object.defineProperty(window, 'location', { value: { href: '' }, writable: true });
});

async function importService() {
	const mod = await import('./AuthService');
	return mod.default;
}

describe('AuthService.logout', () => {
	it('clears session and user data', async () => {
		localStorage.setItem('token', 'secret-token');
		localStorage.setItem('user', JSON.stringify({ email: 'a@b.c' }));
		localStorage.setItem('sb-auth-auth-token', 'supabase-session');

		const AuthService = await importService();
		await AuthService.logout();

		expect(localStorage.getItem('token')).toBeNull();
		expect(localStorage.getItem('user')).toBeNull();
		expect(localStorage.getItem('sb-auth-auth-token')).toBeNull();
	});

	// A device display preference is not user data; wiping it makes the setting look broken.
	it('preserves the theme preference across logout', async () => {
		const theme = JSON.stringify({ state: { theme: 'dark' }, version: 0 });
		localStorage.setItem('flexprice_theme', theme);
		localStorage.setItem('token', 'secret-token');

		const AuthService = await importService();
		await AuthService.logout();

		expect(localStorage.getItem('flexprice_theme')).toBe(theme);
		expect(localStorage.getItem('token')).toBeNull();
	});

	it('does not invent a theme entry when none was set', async () => {
		const AuthService = await importService();
		await AuthService.logout();

		expect(localStorage.getItem('flexprice_theme')).toBeNull();
	});

	it('redirects to login', async () => {
		const AuthService = await importService();
		await AuthService.logout();

		expect(window.location.href).toBe('/login');
	});
});
