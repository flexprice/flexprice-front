import { defineConfig, devices } from '@playwright/test';
import {
	baseURL,
	hasViewerUser,
	isCI,
	startsOwnServer,
	storageStatePath,
	viewerStorageStatePath,
	webServerCommand,
} from './e2e/support/env';

/**
 * Loads .env.e2e when present so a local run needs no exported shell variables.
 * CI passes real secrets through the environment instead, and never ships this file.
 *
 * process.loadEnvFile is built into Node 22 (this repo's engine floor), which keeps
 * the suite free of a dotenv dependency.
 */
try {
	process.loadEnvFile('.env.e2e');
} catch {
	// Absent or unreadable — the environment is expected to already carry the values.
}

/**
 * Layout:
 *   e2e/public/**      routes reachable signed out — no credentials required
 *   e2e/journeys/**    business workflows: create a customer, edit a subscription
 *   e2e/regression/**  one focused test per historical bug — the permanent net
 *   e2e/smoke/**       the few flows that prove a deployment is usable at all
 *
 * Tags select across those folders. Every spec carries at least one:
 *   @smoke       deployment health — fast, read-only
 *   @critical    must not break; what a pull request is gated on
 *   @regression  a bug that shipped once and must not return
 *
 * The `setup` project logs in once through the real UI and writes a storage state
 * every other project reuses. Doing it through the UI rather than by minting a token
 * keeps the suite honest about the login path and works unchanged whether the target
 * authenticates through Supabase or the self-hosted provider.
 */
export default defineConfig({
	testDir: './e2e',
	// Journey specs create and mutate tenant data; running one file's customer
	// creation against another's list assertions is the classic source of E2E flake.
	fullyParallel: false,
	forbidOnly: isCI,
	retries: isCI ? 1 : 0,
	// Playwright recommends a single worker in CI for reproducibility. Raise this
	// via sharding (see e2e-pr.yml) rather than by adding workers on one machine.
	workers: isCI ? 1 : undefined,
	timeout: 60_000,
	expect: {
		// The dashboard fans out to several API calls per screen; the framework default
		// of 5s produces failures that are really just a slow staging backend.
		timeout: 15_000,
	},

	reporter: [
		['list'],
		['html', { outputFolder: 'playwright-report', open: 'never' }],
		// Machine-readable run summary — the Slack notifier reads this file.
		['json', { outputFile: 'playwright-report/results.json' }],
		// Annotates the failing line directly in the GitHub Actions diff view.
		...(isCI ? [['github'] as const] : []),
	],

	use: {
		baseURL,
		// Everything needed to diagnose a behavioural failure without reproducing it
		// by hand. Traces carry actions, DOM snapshots and network activity.
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		actionTimeout: 15_000,
		navigationTimeout: 30_000,
	},

	projects: [
		// Public routes need no account, so this project carries no dependency on
		// `setup`. It stays runnable — and keeps guarding the login page — on a
		// checkout that has no test credentials at all.
		{
			name: 'public',
			testDir: './e2e/public',
			use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } },
		},
		{
			// Opt-in: never part of a pull-request or deploy run. Snapshot baselines are
			// platform-specific, so this only produces meaningful results where the
			// baselines were generated — see e2e/README.md before enabling it in CI.
			name: 'visual',
			testDir: './e2e/visual',
			use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } },
		},
		{
			name: 'setup',
			testMatch: /support\/auth\.setup\.ts/,
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'smoke',
			testDir: './e2e/smoke',
			dependencies: ['setup'],
			use: { ...devices['Desktop Chrome'], storageState: storageStatePath },
		},
		{
			// Journeys and regressions share auth and configuration; the folder split
			// is organisational (business workflows vs. one test per historical bug),
			// so they run as one project and are selected apart by tag when needed.
			name: 'e2e',
			testDir: './e2e',
			testMatch: ['**/journeys/**/*.spec.ts', '**/regression/**/*.spec.ts'],
			// `public` first: if the login page itself is broken, every authenticated
			// result below is noise. Playwright skips dependents when a dependency
			// fails, so this gates the expensive suites inside one run and one report
			// rather than needing two CI invocations to sequence it.
			dependencies: ['public', 'setup'],
			use: { ...devices['Desktop Chrome'], storageState: storageStatePath },
		},
		// Permission gating needs a second, less-privileged account. The project is
		// omitted entirely when that account is not configured, rather than declared
		// and failing — an RBAC suite nobody has provisioned should be absent, not red.
		...(hasViewerUser()
			? [
					{
						name: 'setup-viewer',
						testMatch: /support\/viewer\.setup\.ts/,
						use: { ...devices['Desktop Chrome'] },
					},
					{
						name: 'rbac',
						testDir: './e2e/rbac',
						dependencies: ['setup-viewer'],
						use: { ...devices['Desktop Chrome'], storageState: viewerStorageStatePath },
					},
				]
			: []),
	],

	// Skipped entirely when a target URL was named and E2E_START_SERVER did not
	// override that. reuseExistingServer keeps a dev server already running on the
	// port from being killed and restarted on every local run.
	webServer: startsOwnServer
		? {
				command: webServerCommand,
				url: baseURL,
				reuseExistingServer: !isCI,
				timeout: 120_000,
				stdout: 'pipe',
				stderr: 'pipe',
			}
		: undefined,
});
