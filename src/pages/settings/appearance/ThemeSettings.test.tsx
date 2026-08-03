import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

// Each test re-imports the component so the Zustand store starts clean, but the very first import
// has to transform the whole `@/components/atoms` barrel. Pay that cost here, in a hook with a
// longer budget, instead of inside the first test's 5s timeout.
//
// The explicit 30s is load-dependent, not machine-dependent: this file passes alone in ~6s but
// overruns the default 10s hook budget when the other 49 test files are competing for the same
// cores. Without it the whole suite fails intermittently — and it sits in the pre-commit hook.
beforeAll(async () => {
	await import('./ThemeSettings');
}, 30_000);

beforeEach(() => {
	vi.resetModules();
	localStorage.clear();
	document.documentElement.classList.remove('dark');
});

async function renderTab() {
	const { default: ThemeSettings } = await import('./ThemeSettings');
	render(<ThemeSettings />);
	return screen.getByRole('switch');
}

describe('ThemeSettings', () => {
	it('renders unchecked when the theme is light', async () => {
		const toggle = await renderTab();
		expect(toggle).not.toBeChecked();
		expect(document.documentElement.classList.contains('dark')).toBe(false);
	});

	it('turns dark mode on and puts .dark on <html>', async () => {
		const toggle = await renderTab();

		await userEvent.click(toggle);

		expect(toggle).toBeChecked();
		expect(document.documentElement.classList.contains('dark')).toBe(true);
	});

	it('turns dark mode back off', async () => {
		const toggle = await renderTab();

		await userEvent.click(toggle);
		await userEvent.click(toggle);

		expect(toggle).not.toBeChecked();
		expect(document.documentElement.classList.contains('dark')).toBe(false);
	});

	it('persists the choice so it survives a reload', async () => {
		const toggle = await renderTab();

		await userEvent.click(toggle);

		expect(JSON.parse(localStorage.getItem('flexprice_theme')!).state.theme).toBe('dark');
	});

	it('reflects a theme already persisted as dark', async () => {
		localStorage.setItem('flexprice_theme', JSON.stringify({ state: { theme: 'dark' }, version: 0 }));

		const toggle = await renderTab();

		expect(toggle).toBeChecked();
	});
});
