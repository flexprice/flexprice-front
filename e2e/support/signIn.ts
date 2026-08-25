import { Page, expect } from '@playwright/test';
import { TestUser } from './env';

/**
 * Signs in through the real login form and saves the resulting browser state.
 *
 * Shared by every setup project so the admin and the read-only RBAC account follow
 * exactly the same path — a divergence there would make a permissions comparison
 * meaningless.
 */
export async function signInAndSaveState(page: Page, user: TestUser, statePath: string): Promise<void> {
	await page.goto('/login');

	await page.getByLabel('Email', { exact: true }).fill(user.email);
	await page.getByLabel('Password', { exact: true }).fill(user.password);
	await page.getByRole('button', { name: 'Login', exact: true }).click();

	// Landing anywhere off /login is the signal that authentication succeeded; the
	// destination itself varies (a tenant that has not finished onboarding is sent
	// to /onboarding rather than /home).
	await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 45_000 });

	// The active environment is written to localStorage only after the environments
	// request resolves, and every subsequent API call needs it as X-Environment-ID.
	// Saving state before it lands would hand each test a session that 403s until it
	// re-fetched, so wait for it here where the cost is paid once.
	await expect
		.poll(() => page.evaluate(() => localStorage.getItem('active_environment_id')), {
			message: 'active environment was never selected after login',
			timeout: 30_000,
		})
		.toBeTruthy();

	await page.context().storageState({ path: statePath });
}
