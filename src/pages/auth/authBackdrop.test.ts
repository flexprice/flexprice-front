import { describe, expect, it } from 'vitest';
import { AUTH_TEMPLATE } from '@/config/authTemplates';
import { config } from '@/config/config';
import { getAuthFullscreenBackdropImage } from './authBackdrop';

describe('getAuthFullscreenBackdropImage', () => {
	it('returns login background when template_2 provides loginBgImage', () => {
		const originalAuthPage = config.authPage;
		config.authPage = {
			template: AUTH_TEMPLATE.TEMPLATE_2,
			config: {
				tagline: null,
				loginBgImage: 'https://example.com/tirdad-pattern.png',
				landingLogo: null,
			},
		};

		expect(getAuthFullscreenBackdropImage()).toBe('https://example.com/tirdad-pattern.png');

		config.authPage = originalAuthPage;
	});

	it('falls back to onboarding image for default auth template', () => {
		const originalAuthPage = config.authPage;
		config.authPage = {
			template: AUTH_TEMPLATE.FLEXPRICE_DEFAULT,
		};

		expect(getAuthFullscreenBackdropImage()).toBe('/assets/onboarding.png');

		config.authPage = originalAuthPage;
	});
});
