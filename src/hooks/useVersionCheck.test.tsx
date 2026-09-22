import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { Toaster } from 'react-hot-toast';
import useVersionCheck from './useVersionCheck';

vi.mock('@/config/config', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/config/config')>();
	// The hook is prod-gated; everything else keeps the real test config.
	return { ...actual, config: { ...actual.config, app: { ...actual.config.app, isProd: true } } };
});

const Probe = () => {
	useVersionCheck(60 * 60 * 1000);
	return null;
};

describe('useVersionCheck', () => {
	beforeEach(() => {
		localStorage.clear();
		// Vite's compile-time define; not present under vitest.
		vi.stubGlobal('__APP_VERSION__', 'v-current');
		// jsdom has no matchMedia; react-hot-toast's Toaster queries prefers-reduced-motion.
		vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ versionId: 'v-next' }),
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('renders the update notice as a themed card on a transparent toast shell', async () => {
		render(
			<>
				<Toaster />
				<Probe />
			</>,
		);

		// No i18n provider in this test, so t() returns the raw key.
		const title = await screen.findByText('versionCheck.toastTitle');

		// The card must paint its own themed surface…
		const card = title.closest('.bg-surface');
		expect(card).not.toBeNull();
		expect(card).toHaveClass('border', 'border-line', 'rounded-lg');

		// …because the library's default shell is hard-coded white and ignores dark
		// mode; the shell around the card must be neutralized to transparent.
		const shell = [...document.querySelectorAll<HTMLElement>('div')].find(
			(el) => el.contains(card) && el.style.background === 'transparent',
		);
		expect(shell).toBeDefined();
	});
});
