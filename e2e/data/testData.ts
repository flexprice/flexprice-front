/**
 * Test data lives here rather than inline in specs so a rename or a new required
 * field is a one-line change instead of a sweep across every suite.
 *
 * Every generated identifier is unique per run. E2E runs against a shared tenant
 * repeatedly; fixed names collide with leftovers from previous runs and produce
 * failures that look like application bugs.
 */

const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Marks a record as suite-generated so leftovers are identifiable and safe to purge. */
export const E2E_PREFIX = 'e2e';

export function uniqueName(entity: string): string {
	return `${E2E_PREFIX}-${entity}-${RUN_ID}`;
}

export function uniqueExternalId(entity: string): string {
	return `${E2E_PREFIX}_${entity}_${RUN_ID}`;
}

export function newCustomer(overrides: Partial<{ name: string; externalId: string; email: string }> = {}) {
	const name = overrides.name ?? uniqueName('customer');
	return {
		name,
		externalId: overrides.externalId ?? uniqueExternalId('customer'),
		email: overrides.email ?? `${name}@e2e.flexprice.invalid`,
	};
}

export function newPlan(overrides: Partial<{ name: string; lookupKey: string; description: string }> = {}) {
	const name = overrides.name ?? uniqueName('plan');
	return {
		name,
		lookupKey: overrides.lookupKey ?? uniqueExternalId('plan'),
		description: overrides.description ?? 'Created by the E2E suite.',
	};
}

export function newFeature(overrides: Partial<{ name: string }> = {}) {
	return { name: overrides.name ?? uniqueName('feature') };
}

export function newAddon(overrides: Partial<{ name: string; lookupKey: string }> = {}) {
	const name = overrides.name ?? uniqueName('addon');
	return { name, lookupKey: overrides.lookupKey ?? uniqueExternalId('addon') };
}
