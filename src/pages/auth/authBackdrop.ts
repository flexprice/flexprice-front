import { AUTH_TEMPLATE } from '@/config/authTemplates';
import { config } from '@/config/config';

const DEFAULT_AUTH_FULLSCREEN_BACKDROP = '/assets/onboarding.png';

export function getAuthFullscreenBackdropImage(): string {
	const { authPage } = config;
	if (authPage.template === AUTH_TEMPLATE.TEMPLATE_2 && authPage.config.loginBgImage) {
		return authPage.config.loginBgImage;
	}
	return DEFAULT_AUTH_FULLSCREEN_BACKDROP;
}
