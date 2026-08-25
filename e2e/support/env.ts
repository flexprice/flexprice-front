/**
 * Single source of truth for everything the E2E suite reads from the environment.
 *
 * Two run modes, chosen by whether E2E_BASE_URL is set:
 *
 *   unset  — local development. Playwright boots `npm run dev` on port 3000 and
 *            tests it. Whatever ./.env points VITE_API_URL at is the backend.
 *   set    — a already-running target (a Vercel preview, staging, production).
 *            No server is started; Playwright drives the URL as given.
 *
 * Credentials are never defaulted. A missing one fails the auth setup with a
 * message naming the variable, which is far easier to act on than a login page
 * that silently times out.
 */

const DEFAULT_LOCAL_URL = 'http://localhost:3000';

/**
 * True when we are responsible for starting the server.
 *
 * Naming a target normally means one is already running, but E2E_START_SERVER=1
 * forces the server up anyway — which is how a local run can serve the production
 * build on a spare port without colliding with a dev server already on 3000.
 */
export const startsOwnServer = process.env.E2E_START_SERVER === '1' || !process.env.E2E_BASE_URL;

/**
 * How the local server is started when we own it.
 *
 * Local runs want the dev server for fast feedback. CI overrides this to serve the
 * production build instead, so a pull request is judged on the bundle that would
 * actually ship rather than on dev-only module behaviour.
 */
export const webServerCommand = process.env.E2E_WEB_SERVER_COMMAND ?? 'npm run dev';

export const baseURL = (process.env.E2E_BASE_URL ?? DEFAULT_LOCAL_URL).replace(/\/+$/, '');

export const isCI = !!process.env.CI;

/**
 * Backend the target app talks to, including the `/v1` suffix — the same value the
 * build was given as VITE_API_URL.
 *
 * Used only by API-assisted setup (e2e/utils/api.ts), which creates and tears down
 * fixture data directly instead of clicking through the UI to arrange a precondition.
 */
export const apiBaseUrl = process.env.E2E_API_URL?.replace(/\/+$/, '');

export function requireApiBaseUrl(): string {
	if (!apiBaseUrl) {
		throw new Error(
			'E2E_API_URL is not set, so API-assisted setup cannot run.\n' +
				'Set it to the backend the target app uses, including /v1 ' +
				'(e.g. https://api-staging.flexprice.io/v1). See e2e/README.md.',
		);
	}
	return apiBaseUrl;
}

/** Where the authenticated browser state produced by auth.setup.ts is cached. */
export const storageStatePath = 'e2e/.auth/user.json';

/**
 * A second, deliberately less-privileged account.
 *
 * Permission gating can only be tested by comparing two roles looking at the same
 * screen — asserting a button is enabled for an admin proves nothing about whether
 * it is correctly hidden from anyone else. Entirely optional: the RBAC project is
 * omitted from the config when these are unset, rather than failing.
 */
export const viewerStorageStatePath = 'e2e/.auth/viewer.json';

export interface TestUser {
	email: string;
	password: string;
}

/**
 * Reads the test account, failing loudly rather than attempting a login with
 * `undefined` — an empty submit produces a validation toast, not an auth error,
 * which reads as a broken login page instead of a missing secret.
 */
export function requireTestUser(): TestUser {
	const email = process.env.E2E_USER_EMAIL;
	const password = process.env.E2E_USER_PASSWORD;

	const missing = [
		['E2E_USER_EMAIL', email],
		['E2E_USER_PASSWORD', password],
	]
		.filter(([, value]) => !value)
		.map(([name]) => name);

	if (missing.length > 0) {
		throw new Error(
			`Missing E2E credentials: ${missing.join(', ')}.\n` +
				`Set them in .env.e2e for local runs, or as repository secrets for CI.\n` +
				`See e2e/README.md for how to provision a dedicated test tenant.`,
		);
	}

	return { email: email!, password: password! };
}

export function hasViewerUser(): boolean {
	return !!(process.env.E2E_VIEWER_EMAIL && process.env.E2E_VIEWER_PASSWORD);
}

export function requireViewerUser(): TestUser {
	if (!hasViewerUser()) {
		throw new Error('Missing E2E_VIEWER_EMAIL / E2E_VIEWER_PASSWORD for the read-only RBAC account.');
	}
	return { email: process.env.E2E_VIEWER_EMAIL!, password: process.env.E2E_VIEWER_PASSWORD! };
}
