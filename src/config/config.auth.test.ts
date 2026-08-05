import { describe, expect, it } from 'vitest';
import { APP_ENV, AUTH_PROVIDER, usesBackendAuth } from './config';

describe('usesBackendAuth', () => {
	it('uses backend auth for local and self-hosted regardless of provider', () => {
		expect(usesBackendAuth(APP_ENV.Local, AUTH_PROVIDER.Supabase)).toBe(true);
		expect(usesBackendAuth(APP_ENV.SelfHosted, AUTH_PROVIDER.Supabase)).toBe(true);
		expect(usesBackendAuth(APP_ENV.Local, AUTH_PROVIDER.Flexprice)).toBe(true);
	});

	it('uses backend auth on cloud only when provider is flexprice', () => {
		expect(usesBackendAuth(APP_ENV.Development, AUTH_PROVIDER.Supabase)).toBe(false);
		expect(usesBackendAuth(APP_ENV.Production, AUTH_PROVIDER.Supabase)).toBe(false);
		expect(usesBackendAuth(APP_ENV.Development, AUTH_PROVIDER.Flexprice)).toBe(true);
		expect(usesBackendAuth(APP_ENV.Production, AUTH_PROVIDER.Flexprice)).toBe(true);
	});
});
