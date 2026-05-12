import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('config', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.unstubAllEnvs();
	});

	describe('app.env — fallback chain', () => {
		it('uses VITE_APP_ENV when set', async () => {
			vi.stubEnv('VITE_APP_ENV', 'production');
			const { config } = await import('./index');
			expect(config.app.env).toBe('production');
		});

		it('normalizes legacy "prod" value to production', async () => {
			vi.stubEnv('VITE_APP_ENVIRONMENT', 'prod');
			const { config } = await import('./index');
			expect(config.app.env).toBe('production');
		});

		it('normalizes legacy "dev" value to development', async () => {
			vi.stubEnv('VITE_APP_ENVIRONMENT', 'dev');
			const { config } = await import('./index');
			expect(config.app.env).toBe('development');
		});

		it('falls back to VITE_ENVIRONMENT when VITE_APP_ENV not set', async () => {
			vi.stubEnv('VITE_ENVIRONMENT', 'self-hosted');
			const { config } = await import('./index');
			expect(config.app.env).toBe('self-hosted');
		});

		it('defaults to local when no var set', async () => {
			const { config } = await import('./index');
			expect(config.app.env).toBe('local');
		});

		it('prefers VITE_APP_ENVIRONMENT over VITE_ENVIRONMENT when both set', async () => {
			vi.stubEnv('VITE_APP_ENVIRONMENT', 'prod');
			vi.stubEnv('VITE_ENVIRONMENT', 'development');
			const { config } = await import('./index');
			expect(config.app.env).toBe('production'); // prod normalized to production, not development
		});
	});

	describe('app.isProd', () => {
		it('returns true when env is production', async () => {
			vi.stubEnv('VITE_APP_ENV', 'production');
			const { config } = await import('./index');
			expect(config.app.isProd).toBe(true);
		});

		it('returns false when env is not production', async () => {
			vi.stubEnv('VITE_APP_ENV', 'development');
			const { config } = await import('./index');
			expect(config.app.isProd).toBe(false);
		});
	});

	describe('auth.enabled fallback', () => {
		it('reads VITE_AUTH_ENABLED', async () => {
			vi.stubEnv('VITE_AUTH_ENABLED', 'true');
			const { config } = await import('./index');
			expect(config.auth.enabled).toBe(true);
		});

		it('falls back to VITE_SUPABASE_ENABLED', async () => {
			vi.stubEnv('VITE_SUPABASE_ENABLED', 'true');
			const { config } = await import('./index');
			expect(config.auth.enabled).toBe(true);
		});

		it('defaults to false', async () => {
			const { config } = await import('./index');
			expect(config.auth.enabled).toBe(false);
		});
	});

	describe('auth.provider', () => {
		it('defaults to supabase', async () => {
			const { config } = await import('./index');
			expect(config.auth.provider).toBe('supabase');
		});

		it('reads VITE_AUTH_PROVIDER', async () => {
			vi.stubEnv('VITE_AUTH_PROVIDER', 'flexprice');
			const { config } = await import('./index');
			expect(config.auth.provider).toBe('flexprice');
		});
	});

	describe('sentry.dsn fallback', () => {
		it('prefers VITE_SENTRY_DSN over legacy var', async () => {
			vi.stubEnv('VITE_SENTRY_DSN', 'new-dsn');
			vi.stubEnv('VITE_APP_PUBLIC_SENTRY_DSN', 'old-dsn');
			const { config } = await import('./index');
			expect(config.sentry.dsn).toBe('new-dsn');
		});

		it('falls back to VITE_APP_PUBLIC_SENTRY_DSN', async () => {
			vi.stubEnv('VITE_APP_PUBLIC_SENTRY_DSN', 'old-dsn');
			const { config } = await import('./index');
			expect(config.sentry.dsn).toBe('old-dsn');
		});
	});

	describe('posthog fallbacks', () => {
		it('prefers VITE_POSTHOG_KEY over legacy var', async () => {
			vi.stubEnv('VITE_POSTHOG_KEY', 'new-key');
			vi.stubEnv('VITE_APP_PUBLIC_POSTHOG_KEY', 'old-key');
			const { config } = await import('./index');
			expect(config.posthog.key).toBe('new-key');
		});

		it('falls back to VITE_APP_PUBLIC_POSTHOG_KEY', async () => {
			vi.stubEnv('VITE_APP_PUBLIC_POSTHOG_KEY', 'old-key');
			const { config } = await import('./index');
			expect(config.posthog.key).toBe('old-key');
		});
	});

	describe('intercom.appId fallback', () => {
		it('falls back to VITE_APP_INTERCOM_APP_ID', async () => {
			vi.stubEnv('VITE_APP_INTERCOM_APP_ID', 'old-id');
			const { config } = await import('./index');
			expect(config.intercom.appId).toBe('old-id');
		});
	});
});
