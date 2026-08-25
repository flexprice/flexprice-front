import { request } from '@playwright/test';
import { apiBaseUrl } from './env';

/**
 * Resolves the environment every run writes into, creating it on first use.
 *
 * E2E creates real records against a real backend. Without this they land in
 * whichever environment the account happens to open by default — usually the one
 * people are also using by hand — so a test run and someone's manual work end up
 * in the same customer list.
 *
 * Named per day (`E2e20260825`) rather than per run, deliberately: the backend has
 * POST and PUT for environments but no DELETE, so anything created here is
 * permanent. One per day is enough to keep a run's data away from real work while
 * leaving a bounded, self-describing trail; one per run would grow forever.
 */

/** `E2e` + YYYYMMDD in UTC, so parallel CI shards on either side of midnight agree. */
export function e2eEnvironmentName(now = new Date()): string {
	const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
	return process.env.E2E_ENVIRONMENT_NAME ?? `E2e${stamp}`;
}

export interface ResolvedEnvironment {
	id: string;
	name: string;
	created: boolean;
}

/**
 * Finds today's E2E environment or creates it, returning its id.
 *
 * Uses the bearer token directly rather than the saved storage state: this runs
 * during setup, before any state exists, and `/environments` is one of the two
 * paths the backend serves without an X-Environment-ID header.
 */
export async function ensureE2eEnvironment(token: string): Promise<ResolvedEnvironment> {
	if (!apiBaseUrl) {
		throw new Error('ensureE2eEnvironment requires E2E_API_URL.');
	}

	const name = e2eEnvironmentName();
	const context = await request.newContext({
		baseURL: `${apiBaseUrl}/`,
		extraHTTPHeaders: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
	});

	try {
		const listed = await context.get('environments');
		if (!listed.ok()) {
			throw new Error(`GET /environments failed with ${listed.status()}: ${(await listed.text()).slice(0, 300)}`);
		}

		const existing = (JSON.parse(await listed.text()).environments ?? []).find((env: { id?: string; name?: string }) => env.name === name);
		if (existing?.id) {
			return { id: existing.id, name, created: false };
		}

		// `development` rather than `production`: some behaviour is gated on the
		// environment type, and a suite that writes test data should never present
		// itself as production.
		const created = await context.post('environments', { data: { name, type: 'development' } });
		if (!created.ok()) {
			throw new Error(
				`Could not create the E2E environment "${name}" (${created.status()}): ${(await created.text()).slice(0, 300)}\n` +
					`The test account needs environment:write permission.`,
			);
		}

		const body = JSON.parse(await created.text());
		if (!body?.id) throw new Error(`Create environment returned no id: ${JSON.stringify(body).slice(0, 200)}`);
		return { id: body.id, name, created: true };
	} finally {
		await context.dispose();
	}
}
