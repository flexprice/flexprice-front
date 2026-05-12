import { describe, it, expect, afterEach, vi } from 'vitest';

// Each test resets modules so config.ts re-evaluates import.meta.env fresh
async function importParsers() {
	vi.resetModules();
	return import('./config');
}

describe('parseBrandConfig', () => {
	afterEach(() => vi.unstubAllEnvs());

	it('returns Flexprice defaults when env var is absent', async () => {
		const { parseBrandConfig } = await importParsers();
		const result = parseBrandConfig();
		expect(result.name).toBe('Flexprice');
		expect(result.logo).toBe('/comicon.png');
		expect(result.primaryColor).toBe('#7C3AED');
		expect(result.favicon).toBe('/favicon.ico');
	});

	it('applies overrides from valid JSON', async () => {
		vi.stubEnv('VITE_BRAND_CONFIG', JSON.stringify({ name: 'Tirdad', primaryColor: '#0d1b2a' }));
		const { parseBrandConfig } = await importParsers();
		const result = parseBrandConfig();
		expect(result.name).toBe('Tirdad');
		expect(result.primaryColor).toBe('#0d1b2a');
		expect(result.logo).toBe('/comicon.png');
	});

	it('silently falls back to defaults on malformed JSON', async () => {
		vi.stubEnv('VITE_BRAND_CONFIG', '{bad json}');
		const { parseBrandConfig } = await importParsers();
		const result = parseBrandConfig();
		expect(result.name).toBe('Flexprice');
	});
});

describe('parseAuthPageConfig', () => {
	afterEach(() => vi.unstubAllEnvs());

	it('returns defaults when env var is absent', async () => {
		const { parseAuthPageConfig } = await importParsers();
		const result = parseAuthPageConfig();
		expect(result.supportEmail).toBe('support@flexprice.io');
		expect(result.tagline).toBeNull();
		expect(result.loginBgImage).toBeNull();
		expect(result.slackCommunityUrl).toBe('https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ');
	});

	it('sets slackCommunityUrl to null when explicitly nulled', async () => {
		vi.stubEnv('VITE_AUTH_CONFIG', JSON.stringify({ slackCommunityUrl: null }));
		const { parseAuthPageConfig } = await importParsers();
		const result = parseAuthPageConfig();
		expect(result.slackCommunityUrl).toBeNull();
	});

	it('applies partial overrides while keeping other defaults', async () => {
		vi.stubEnv('VITE_AUTH_CONFIG', JSON.stringify({ supportEmail: 'support@tirdad.com', tagline: 'Custom tagline' }));
		const { parseAuthPageConfig } = await importParsers();
		const result = parseAuthPageConfig();
		expect(result.supportEmail).toBe('support@tirdad.com');
		expect(result.tagline).toBe('Custom tagline');
		expect(result.loginBgImage).toBeNull(); // absent key → null
		expect(result.slackCommunityUrl).toBe('https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ'); // absent key → default URL
	});

	it('silently falls back to defaults on malformed JSON', async () => {
		vi.stubEnv('VITE_AUTH_CONFIG', '{bad json}');
		const { parseAuthPageConfig } = await importParsers();
		const result = parseAuthPageConfig();
		expect(result.supportEmail).toBe('support@flexprice.io');
		expect(result.slackCommunityUrl).toBe('https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ');
	});
});

describe('parseI18nConfig', () => {
	afterEach(() => vi.unstubAllEnvs());

	it('defaults to en ltr', async () => {
		const { parseI18nConfig } = await importParsers();
		const result = parseI18nConfig();
		expect(result.locale).toBe('en');
		expect(result.direction).toBe('ltr');
	});

	it('derives rtl from Arabic locale', async () => {
		vi.stubEnv('VITE_DEFAULT_LOCALE', 'ar');
		const { parseI18nConfig } = await importParsers();
		const result = parseI18nConfig();
		expect(result.locale).toBe('ar');
		expect(result.direction).toBe('rtl');
	});

	it('derives rtl for all RTL locales', async () => {
		for (const locale of ['ar', 'he', 'fa', 'ur']) {
			vi.stubEnv('VITE_DEFAULT_LOCALE', locale);
			const { parseI18nConfig } = await importParsers();
			const result = parseI18nConfig();
			expect(result.direction).toBe('rtl');
			vi.unstubAllEnvs();
		}
	});
});

describe('config object', () => {
	it('includes brand, authPage, and i18n keys', async () => {
		const { config } = await importParsers();
		expect(config.brand).toBeDefined();
		expect(config.authPage).toBeDefined();
		expect(config.i18n).toBeDefined();
	});
});
