import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

const STORAGE_KEY = 'flexprice_theme';
const persisted = (theme: unknown) => JSON.stringify({ state: { theme }, version: 0 });

beforeEach(() => {
	vi.resetModules();
	localStorage.clear();
	document.documentElement.classList.remove('dark');
});

async function importStore() {
	return import('./useThemeStore');
}

describe('useThemeStore', () => {
	it('defaults to light', async () => {
		const { useThemeStore } = await importStore();
		expect(useThemeStore.getState().theme).toBe('light');
	});

	it('setTheme applies the .dark class on <html>', async () => {
		const { useThemeStore } = await importStore();

		act(() => useThemeStore.getState().setTheme('dark'));
		expect(useThemeStore.getState().theme).toBe('dark');
		expect(document.documentElement.classList.contains('dark')).toBe(true);

		act(() => useThemeStore.getState().setTheme('light'));
		expect(document.documentElement.classList.contains('dark')).toBe(false);
	});

	it('toggleTheme flips between light and dark', async () => {
		const { useThemeStore } = await importStore();

		act(() => useThemeStore.getState().toggleTheme());
		expect(useThemeStore.getState().theme).toBe('dark');

		act(() => useThemeStore.getState().toggleTheme());
		expect(useThemeStore.getState().theme).toBe('light');
		expect(document.documentElement.classList.contains('dark')).toBe(false);
	});

	it('persists the choice to localStorage', async () => {
		const { useThemeStore } = await importStore();
		act(() => useThemeStore.getState().setTheme('dark'));

		expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).state.theme).toBe('dark');
	});

	it('rehydrates a persisted dark theme onto <html>', async () => {
		localStorage.setItem(STORAGE_KEY, persisted('dark'));

		const { useThemeStore } = await importStore();
		expect(useThemeStore.getState().theme).toBe('dark');
		expect(document.documentElement.classList.contains('dark')).toBe(true);
	});

	describe('public tenant-facing routes', () => {
		const setPath = (pathname: string) => {
			Object.defineProperty(window, 'location', { value: { ...window.location, pathname }, writable: true });
		};

		afterEach(() => setPath('/'));

		it.each(['/customer-portal', '/customer-portal/invoices', '/checkout', '/checkout/x'])(
			'never applies .dark on %s, even with dark persisted',
			async (path) => {
				setPath(path);
				localStorage.setItem(STORAGE_KEY, persisted('dark'));

				const { initTheme, useThemeStore } = await importStore();
				initTheme();
				expect(document.documentElement.classList.contains('dark')).toBe(false);

				// Toggling from the portal must not paint it dark either.
				act(() => useThemeStore.getState().setTheme('dark'));
				expect(document.documentElement.classList.contains('dark')).toBe(false);
				// …but the preference itself is still recorded for the app.
				expect(useThemeStore.getState().theme).toBe('dark');
			},
		);

		it('still applies .dark on app routes', async () => {
			setPath('/home');
			localStorage.setItem(STORAGE_KEY, persisted('dark'));

			const { initTheme } = await importStore();
			initTheme();

			expect(document.documentElement.classList.contains('dark')).toBe(true);
		});

		it('does not treat a lookalike path as public', async () => {
			setPath('/checkout-settings');
			localStorage.setItem(STORAGE_KEY, persisted('dark'));

			const { initTheme } = await importStore();
			initTheme();

			expect(document.documentElement.classList.contains('dark')).toBe(true);
		});
	});

	describe('initTheme', () => {
		it('applies dark before React mounts when dark is persisted', async () => {
			localStorage.setItem(STORAGE_KEY, persisted('dark'));

			const { initTheme } = await importStore();
			document.documentElement.classList.remove('dark');
			initTheme();

			expect(document.documentElement.classList.contains('dark')).toBe(true);
		});

		// The rollout guarantee: nobody lands in dark mode without opting in, whatever is in storage.
		it.each([
			['nothing persisted', null],
			['unparseable JSON', '{not json'],
			['unknown theme value', persisted('midnight')],
			['null theme', persisted(null)],
			['wrong shape', JSON.stringify({ theme: 'dark' })],
		])('falls back to light on %s', async (_label, raw) => {
			if (raw !== null) localStorage.setItem(STORAGE_KEY, raw);
			document.documentElement.classList.add('dark');

			const { initTheme } = await importStore();
			initTheme();

			expect(document.documentElement.classList.contains('dark')).toBe(false);
		});
	});
});
