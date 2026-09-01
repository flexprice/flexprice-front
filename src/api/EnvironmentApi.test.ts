import { describe, it, expect, beforeEach, vi } from 'vitest';

const ACTIVE_ENVIRONMENT_ID_KEY = 'active_environment_id';

// The readiness promise is cached at module scope (by design — see EnvironmentApi.ts), so
// each test re-imports the module fresh to avoid one test's resolved state leaking into the next.
async function freshEnvironmentApi() {
	vi.resetModules();
	const mod = await import('./EnvironmentApi');
	return mod.default;
}

describe('EnvironmentApi.waitForActiveEnvironment', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('resolves immediately (via the stored-ID path, not the timeout) when an active environment ID is already stored', async () => {
		localStorage.setItem(ACTIVE_ENVIRONMENT_ID_KEY, 'env_123');
		const EnvironmentApi = await freshEnvironmentApi();

		vi.useFakeTimers();
		let resolved = false;
		EnvironmentApi.waitForActiveEnvironment(50).then(() => {
			resolved = true;
		});

		// Flush microtasks only — fake timers freeze real time, so the 50ms setTimeout
		// fallback cannot have fired here. Resolving anyway proves it went through the
		// synchronous stored-ID path (Promise.resolve()), not the timeout race.
		await Promise.resolve();
		await Promise.resolve();
		expect(resolved).toBe(true);

		vi.useRealTimers();
	}, 15000);

	it('resolves once setActiveEnvironmentId is called after the wait started', async () => {
		const EnvironmentApi = await freshEnvironmentApi();
		const wait = EnvironmentApi.waitForActiveEnvironment(5000);
		let resolved = false;
		wait.then(() => {
			resolved = true;
		});

		await new Promise((r) => setTimeout(r, 10));
		expect(resolved).toBe(false);

		EnvironmentApi.setActiveEnvironmentId('env_456');
		await wait;
		expect(resolved).toBe(true);
	}, 15000);

	it('falls back to the timeout so a tenant with no environments never hangs indefinitely', async () => {
		const EnvironmentApi = await freshEnvironmentApi();
		vi.useFakeTimers();
		const wait = EnvironmentApi.waitForActiveEnvironment(1000);
		let resolved = false;
		wait.then(() => {
			resolved = true;
		});

		await vi.advanceTimersByTimeAsync(999);
		expect(resolved).toBe(false);

		await vi.advanceTimersByTimeAsync(1);
		expect(resolved).toBe(true);
		vi.useRealTimers();
	}, 15000);
});
