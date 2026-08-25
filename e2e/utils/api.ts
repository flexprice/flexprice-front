import fs from 'node:fs';
import { APIRequestContext, request } from '@playwright/test';
import { requireApiBaseUrl, storageStatePath } from '../support/env';

/**
 * Direct backend access for arranging and cleaning up fixture data.
 *
 * A test should exercise the UI for the behaviour it is actually testing, and get
 * everything else out of the way as fast as possible. Clicking through the customer
 * drawer to set up a subscription test adds thirty seconds and a second thing that
 * can break for reasons unrelated to what is under test.
 *
 * Rule of thumb:
 *   arranging a precondition  -> API
 *   the behaviour under test  -> UI
 */

interface StoredAuth {
	token: string;
	environmentId: string;
}

/**
 * Recovers the session the auth setup already established, rather than logging in
 * again for every worker.
 *
 * Mirrors AuthService: a locally stored `token` wins wherever one exists, in any
 * environment, and a Supabase session is read from supabase-js's own persisted key
 * (`sb-<project-ref>-auth-token`) otherwise.
 */
export function readStoredAuth(): StoredAuth {
	if (!fs.existsSync(storageStatePath)) {
		throw new Error(
			`No saved session at ${storageStatePath}. API-assisted setup runs after the ` +
				`\`setup\` project, so this usually means the project dependency was bypassed.`,
		);
	}

	const state = JSON.parse(fs.readFileSync(storageStatePath, 'utf8')) as {
		origins?: { localStorage?: { name: string; value: string }[] }[];
	};

	const entries = new Map<string, string>();
	for (const origin of state.origins ?? []) {
		for (const item of origin.localStorage ?? []) entries.set(item.name, item.value);
	}

	const environmentId = entries.get('active_environment_id');
	if (!environmentId) {
		throw new Error('Saved session carries no active_environment_id; every request would 403.');
	}

	const token = readToken(entries);
	if (!token) {
		throw new Error('Saved session carries no usable access token.');
	}

	return { token, environmentId };
}

function readToken(entries: Map<string, string>): string | null {
	const stored = entries.get('token');
	if (stored) {
		try {
			const parsed = JSON.parse(stored);
			if (typeof parsed?.token === 'string' && parsed.token !== '') return parsed.token;
		} catch {
			// Fall through to the Supabase key below rather than failing outright.
		}
	}

	for (const [name, value] of entries) {
		if (!name.startsWith('sb-') || !name.endsWith('-auth-token')) continue;
		try {
			const parsed = JSON.parse(value);
			if (typeof parsed?.access_token === 'string') return parsed.access_token;
		} catch {
			continue;
		}
	}

	return null;
}

export interface CreatedCustomer {
	id: string;
	name: string;
	externalId: string;
	email?: string;
}

/**
 * Thin wrapper over the backend. Deliberately not a generated client: it covers only
 * what fixtures need to arrange and clean up, and every method fails loudly with the
 * response body so a broken precondition never reads as a UI bug.
 */
export class ApiClient {
	private constructor(private readonly context: APIRequestContext) {}

	static async create(): Promise<ApiClient> {
		const { token, environmentId } = readStoredAuth();
		// Trailing slash matters: Playwright resolves request paths with URL semantics,
		// so a leading-slash path against `https://host/v1` resolves to `https://host/…`
		// and drops the version prefix entirely. Base ends in `/`, paths are relative.
		const context = await request.newContext({
			baseURL: `${requireApiBaseUrl()}/`,
			extraHTTPHeaders: {
				Authorization: `Bearer ${token}`,
				'X-Environment-ID': environmentId,
				'Content-Type': 'application/json',
			},
		});
		return new ApiClient(context);
	}

	async dispose(): Promise<void> {
		await this.context.dispose();
	}

	async createCustomer(fields: { name: string; externalId: string; email?: string }): Promise<CreatedCustomer> {
		const response = await this.context.post('customers', {
			data: { name: fields.name, external_id: fields.externalId, email: fields.email },
		});
		const body = await this.parse(response.ok(), response.status(), await response.text(), 'create customer');
		return { id: body.id, name: fields.name, externalId: fields.externalId, email: fields.email };
	}

	/**
	 * Cleanup is best-effort on purpose. A teardown that throws turns a passing test
	 * red and buries the real result; a record that outlives its run is a nuisance,
	 * not a failure, and the `e2e-` prefix makes leftovers identifiable.
	 */
	async deleteCustomer(id: string): Promise<void> {
		await this.bestEffortDelete(`/customers/${id}`);
	}

	private async bestEffortDelete(path: string): Promise<void> {
		try {
			const response = await this.context.delete(path.replace(/^\//, ''));
			if (!response.ok() && response.status() !== 404) {
				console.warn(`Cleanup: DELETE ${path} returned ${response.status()}`);
			}
		} catch (error) {
			console.warn(`Cleanup: DELETE ${path} threw`, error);
		}
	}

	async deletePlan(id: string): Promise<void> {
		await this.bestEffortDelete(`/plans/${id}`);
	}

	async deletePlanByName(name: string): Promise<void> {
		await this.deleteFirstMatch('/plans', name, (id) => this.deletePlan(id));
	}

	/**
	 * Cleanup counterparts for entities the golden path creates through the UI.
	 *
	 * Deletion order matters and mirrors integration-testing-suite/go/steps_cleanup.go:
	 * dependants first (addon, then plan, then feature), because the backend refuses to
	 * remove an entity another one still references.
	 */
	async deleteFeature(id: string): Promise<void> {
		await this.bestEffortDelete(`/features/${id}`);
	}

	async deleteAddon(id: string): Promise<void> {
		await this.bestEffortDelete(`/addons/${id}`);
	}

	async deleteFeatureByName(name: string): Promise<void> {
		await this.deleteFirstMatch('/features', name, (id) => this.deleteFeature(id));
	}

	async deleteAddonByName(name: string): Promise<void> {
		await this.deleteFirstMatch('/addons', name, (id) => this.deleteAddon(id));
	}

	/**
	 * Resolves an entity created through the UI — which never told the test its id —
	 * by name, then deletes it.
	 */
	private async deleteFirstMatch(path: string, name: string, remove: (id: string) => Promise<void>): Promise<void> {
		try {
			const response = await this.context.get(`${path.replace(/^\//, '')}?limit=100`);
			if (!response.ok()) {
				console.warn(`Cleanup: GET ${path} returned ${response.status()}`);
				return;
			}
			const body = JSON.parse(await response.text());
			const match = (body.items ?? []).find((item: { name?: string }) => item.name === name);
			if (match?.id) await remove(match.id);
		} catch (error) {
			console.warn(`Cleanup: could not resolve "${name}" under ${path}`, error);
		}
	}

	/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
	private async parse(ok: boolean, status: number, text: string, action: string): Promise<any> {
		if (!ok) {
			throw new Error(`API ${action} failed with ${status}: ${text.slice(0, 500)}`);
		}
		try {
			return JSON.parse(text);
		} catch {
			throw new Error(`API ${action} returned a non-JSON body: ${text.slice(0, 200)}`);
		}
	}
}
