import { Page, expect } from '@playwright/test';
import { apiBaseUrl, TestUser } from './env';
import { ensureE2eEnvironment } from './environment';

/**
 * Reads the session token the way AuthService does, from inside the page.
 *
 * A locally stored `token` wins wherever one exists; otherwise supabase-js's own
 * persisted session (`sb-<project-ref>-auth-token`) carries the access token.
 */
async function readAccessToken(page: Page): Promise<string | null> {
	return page.evaluate(() => {
		const stored = localStorage.getItem('token');
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				if (typeof parsed?.token === 'string' && parsed.token !== '') return parsed.token;
			} catch {
				/* fall through to the Supabase key */
			}
		}
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key?.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
			try {
				const parsed = JSON.parse(localStorage.getItem(key) ?? '');
				if (typeof parsed?.access_token === 'string') return parsed.access_token;
			} catch {
				continue;
			}
		}
		return null;
	});
}

/**
 * Signs in through the real login form, pins the run to an isolated environment,
 * and saves the resulting browser state.
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

	await pinToE2eEnvironment(page);

	await page.context().storageState({ path: statePath });
}

/**
 * Redirects the whole run into the suite's own environment.
 *
 * Both halves of the run read this one localStorage key: the app sends it as
 * X-Environment-ID on every request, and the fixture client recovers it from the
 * saved state. Setting it here is what keeps UI-created and API-created records in
 * the same place — and out of whichever environment the account opens by default.
 *
 * Skipped when E2E_API_URL is unset. Read-only suites (smoke, run against a
 * deployment) need no isolation and are not worth failing over a missing variable.
 */
async function pinToE2eEnvironment(page: Page): Promise<void> {
	if (!apiBaseUrl) {
		console.warn('E2E_API_URL is not set — running in the account default environment, not an isolated one.');
		return;
	}

	const token = await readAccessToken(page);
	if (!token) throw new Error('Signed in but found no access token to call the environments API with.');

	const environment = await ensureE2eEnvironment(token);
	console.log(`E2E environment: ${environment.name} (${environment.id})${environment.created ? ' — created' : ''}`);

	// Retried, because useEnvironment resets the key to the first environment in its
	// list whenever the stored id is not in it. On the first run of a day the app has
	// already fetched that list before this environment existed, so the first attempt
	// is overwritten; the reload refetches, and the next attempt sticks.
	const attempts = 3;
	for (let attempt = 1; attempt <= attempts; attempt++) {
		await page.evaluate((id) => localStorage.setItem('active_environment_id', id), environment.id);

		// A full navigation rather than reload(): it starts the query cache clean, so
		// the environments list is refetched instead of restored.
		await page.goto('/home');

		const settled = await page
			.waitForFunction((id) => localStorage.getItem('active_environment_id') === id, environment.id, { timeout: 10_000 })
			.then(() => true)
			.catch(() => false);

		if (settled) {
			// Held for a moment: the reset happens in an effect after the list resolves,
			// so a value that is correct immediately can still be replaced a tick later.
			await page.waitForTimeout(1_500);
			const stillOurs = await page.evaluate((id) => localStorage.getItem('active_environment_id') === id, environment.id);
			if (stillOurs) return;
		}

		if (attempt === attempts) {
			const actual = await page.evaluate(() => localStorage.getItem('active_environment_id'));
			throw new Error(
				`Could not pin the run to ${environment.name} (${environment.id}); the app keeps selecting ${actual}.\n` +
					`useEnvironment resets the key when the id is missing from its environments list — check that the ` +
					`account can see the environment, and that the list is not truncated by its 50-item page size.`,
			);
		}
	}
}
