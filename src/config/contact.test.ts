import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

describe('contact config', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('returns platform contact details when contact_us is enabled', async () => {
		vi.stubEnv('VITE_PLATFORM_CONFIG', '{"contact_us":true}');
		const { getContactDetails, isPlatformContactUsEnabled, isContactEnabled } = await import('./contact');

		expect(isPlatformContactUsEnabled()).toBe(true);
		expect(isContactEnabled()).toBe(true);
		expect(getContactDetails()).toEqual({
			slackUrl: '',
			email: '',
			bookCallUrl: '',
		});
	});

	it('returns Flexprice contact details by default', async () => {
		const { getContactDetails, isPlatformContactUsEnabled } = await import('./contact');

		expect(isPlatformContactUsEnabled()).toBe(false);
		expect(getContactDetails()).toEqual({
			slackUrl: 'https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ',
			email: 'support@flexprice.io',
			bookCallUrl: 'https://calendly.com/nikhil-flexprice/30min',
		});
	});
});
