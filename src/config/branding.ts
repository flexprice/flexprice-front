export enum Locale {
	En = 'en',
	Ar = 'ar',
	He = 'he',
	Fa = 'fa',
	Ur = 'ur',
}

export enum Direction {
	LTR = 'ltr',
	RTL = 'rtl',
}

export interface BrandConfig {
	name: string;
	logo: string;
	primaryColor: string;
	favicon: string;
}

export interface AuthPageConfig {
	tagline: string | null;
	supportEmail: string;
	loginBgImage: string | null;
	slackCommunityUrl: string | null;
	showTestimonials: boolean;
}

export interface I18nConfig {
	locale: Locale;
	direction: Direction;
}

const RTL_LOCALES = new Set<Locale>([Locale.Ar, Locale.He, Locale.Fa, Locale.Ur]);

export function parseBrandConfig(): BrandConfig {
	try {
		const raw = JSON.parse(import.meta.env.VITE_BRAND_CONFIG ?? '{}');
		return {
			name: raw.name ?? 'Flexprice',
			logo: raw.logo ?? '/comicon.png',
			primaryColor: raw.primaryColor ?? '#7C3AED',
			favicon: raw.favicon ?? '/favicon.ico',
		};
	} catch {
		return { name: 'Flexprice', logo: '/comicon.png', primaryColor: '#7C3AED', favicon: '/favicon.ico' };
	}
}

export function parseAuthPageConfig(): AuthPageConfig {
	try {
		const raw = JSON.parse(import.meta.env.VITE_AUTH_CONFIG ?? '{}');
		return {
			tagline: 'tagline' in raw ? raw.tagline : null,
			supportEmail: raw.supportEmail ?? 'support@flexprice.io',
			loginBgImage: 'loginBgImage' in raw ? raw.loginBgImage : null,
			slackCommunityUrl:
				'slackCommunityUrl' in raw
					? raw.slackCommunityUrl
					: 'https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ',
			showTestimonials: raw.showTestimonials ?? true,
		};
	} catch {
		return {
			tagline: null,
			supportEmail: 'support@flexprice.io',
			loginBgImage: null,
			slackCommunityUrl: 'https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ',
			showTestimonials: true,
		};
	}
}

export function parseI18nConfig(): I18nConfig {
	const rawLocale = import.meta.env.VITE_DEFAULT_LOCALE ?? Locale.En;
	const locale = (Object.values(Locale) as string[]).includes(rawLocale) ? (rawLocale as Locale) : Locale.En;
	return { locale, direction: RTL_LOCALES.has(locale) ? Direction.RTL : Direction.LTR };
}

export const brandConfig: BrandConfig = parseBrandConfig();
export const authPageConfig: AuthPageConfig = parseAuthPageConfig();
export const i18nConfig: I18nConfig = parseI18nConfig();

/** Returns the app's active brand config. Not a React hook — safe to call anywhere. */
export function useBrand(): BrandConfig {
	return brandConfig;
}

/** Injects --brand-primary CSS var and swaps the favicon. Call once before first render. */
export function initBranding(): void {
	document.documentElement.style.setProperty('--brand-primary', brandConfig.primaryColor);
	const faviconEl = document.getElementById('app-favicon') as HTMLLinkElement | null;
	if (faviconEl) {
		faviconEl.href = brandConfig.favicon;
	}
}
