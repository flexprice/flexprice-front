import { test as base } from '@playwright/test';
import { ApiClient } from '../utils/api';

/**
 * Backend access for the already-authenticated session.
 *
 * Worker-scoped: one API context is created per worker rather than per test, because
 * building it re-reads and re-parses the saved storage state, and nothing about it
 * varies between tests in the same worker.
 */
export interface AuthFixtures {
	api: ApiClient;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const authFixtures = base.extend<{}, AuthFixtures>({
	api: [
		async ({}, use) => {
			const client = await ApiClient.create();
			await use(client);
			await client.dispose();
		},
		{ scope: 'worker' },
	],
});
