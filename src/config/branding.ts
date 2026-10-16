// src/config/branding.ts
import {
	AUTH_TEMPLATE,
	AuthPageConfig,
	LandingContentAlign,
	LandingTheme,
	RegionOption,
	RegionsConfig,
	Template2Config,
} from './authTemplates';
import brandPack from '@brand/brand';
import type { BrandLinks } from '@/brand/types';

// Re-export for backward compat
export { AUTH_TEMPLATE, LandingTheme, LandingContentAlign };
export type { AuthPageConfig, Template2Config, RegionOption, RegionsConfig };

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
	id: string;
	name: string;
	logo: string;
	logoDark: string;
	primaryColor: string;
	favicon: string;
	supportEmail: string;
	title: string;
	links: BrandLinks;
}

export interface I18nConfig {
	locale: Locale;
	direction: Direction;
}

export const SUPPORTED_LOCALES: Locale[] = [Locale.En, Locale.Ar];

export const RTL_LOCALES = new Set<Locale>([Locale.Ar, Locale.He, Locale.Fa, Locale.Ur]);

export function deriveDirection(locale: Locale): Direction {
	return RTL_LOCALES.has(locale) ? Direction.RTL : Direction.LTR;
}

// ─── Pure parser functions (no import.meta.env inside) ───────────────────────

/** Env (`VITE_BRAND_CONFIG`) fields win over the build's brand pack, which wins over nothing. */
export function parseBrandConfig(raw: Record<string, unknown>): BrandConfig {
	const str = (key: string, fallback: string) => (typeof raw[key] === 'string' ? (raw[key] as string) : fallback);
	const name = str('name', brandPack.name);
	const logo = str('logo', brandPack.logo);
	return {
		id: brandPack.id,
		name,
		logo,
		logoDark: str('logoDark', brandPack.logoDark ?? logo),
		primaryColor: str('primaryColor', brandPack.primaryColor),
		favicon: str('favicon', brandPack.favicon),
		supportEmail: str('supportEmail', brandPack.supportEmail),
		title: str('title', brandPack.title ?? name),
		links: brandPack.links,
	};
}

export function parseAuthPageConfig(raw: Record<string, unknown>): AuthPageConfig {
	// Accept 'template_1' as a backward-compat alias for 'flexprice_default'
	const templateRaw = raw.template;
	if (templateRaw === AUTH_TEMPLATE.TEMPLATE_2) {
		return {
			template: AUTH_TEMPLATE.TEMPLATE_2,
			config: {
				tagline: 'tagline' in raw ? (raw.tagline as string | null) : null,
				loginBgImage: 'loginBgImage' in raw ? (raw.loginBgImage as string | null) : null,
				landingLogo: typeof raw.landingLogo === 'string' ? raw.landingLogo : null,
			},
		};
	}
	return { template: AUTH_TEMPLATE.FLEXPRICE_DEFAULT };
}

export function parseRegionsConfig(
	authRaw: Record<string, unknown>,
	legacyEnvs: { indiaUrl?: string; usUrl?: string; selectionEnabled: boolean },
): RegionsConfig {
	const regionsBlock = authRaw.regions as Record<string, unknown> | undefined;
	if (Array.isArray(regionsBlock?.regions) && (regionsBlock?.regions as unknown[]).length > 0) {
		const validRegions: RegionOption[] = (regionsBlock?.regions as unknown[]).filter(
			(r): r is RegionOption =>
				typeof r === 'object' &&
				r !== null &&
				typeof (r as RegionOption).key === 'string' &&
				typeof (r as RegionOption).label === 'string' &&
				typeof (r as RegionOption).url === 'string' &&
				typeof (r as RegionOption).countryCode === 'string',
		);
		if (validRegions.length > 0) {
			return { enabled: regionsBlock?.enabled !== false, regions: validRegions };
		}
	}

	// Backward-compat: legacy env vars
	if (!legacyEnvs.selectionEnabled) return { enabled: false, regions: [] };
	const regions: RegionOption[] = [];
	if (legacyEnvs.indiaUrl) regions.push({ key: 'india', label: 'India', url: legacyEnvs.indiaUrl, countryCode: 'IN' });
	if (legacyEnvs.usUrl) regions.push({ key: 'us', label: 'United States', url: legacyEnvs.usUrl, countryCode: 'US' });
	return { enabled: regions.length > 0, regions };
}

export function parseAllowedLocales(raw: Record<string, unknown>): Locale[] {
	if (Array.isArray(raw.allowedLocales) && raw.allowedLocales.length > 0) {
		const filtered = (raw.allowedLocales as unknown[]).filter((l): l is Locale =>
			(Object.values(Locale) as string[]).includes(l as string),
		);
		if (filtered.length > 0) return filtered;
	}
	return SUPPORTED_LOCALES;
}

export function parseI18nConfig(defaultLocale?: string): I18nConfig {
	const locale = defaultLocale && (Object.values(Locale) as string[]).includes(defaultLocale) ? (defaultLocale as Locale) : Locale.En;
	return { locale, direction: deriveDirection(locale) };
}

// ─── Module-level initialization (only place import.meta.env is read) ─────────

function _safeJsonParse(raw: string | undefined): Record<string, unknown> {
	try {
		return JSON.parse(raw ?? '{}');
	} catch {
		return {};
	}
}

const _brandRaw = _safeJsonParse(import.meta.env.VITE_BRAND_CONFIG);
const _authRaw = _safeJsonParse(import.meta.env.VITE_AUTH_CONFIG);

export const brandConfig: BrandConfig = parseBrandConfig(_brandRaw);
export const authPageConfig: AuthPageConfig = parseAuthPageConfig(_authRaw);
export const regionsConfig: RegionsConfig = parseRegionsConfig(_authRaw, {
	indiaUrl: import.meta.env.VITE_DASHBOARD_URL_INDIA,
	usUrl: import.meta.env.VITE_DASHBOARD_URL_US,
	selectionEnabled: import.meta.env.VITE_DATA_REGION_SELECTION_ENABLED === 'true',
});
export const allowedLocalesConfig: Locale[] = parseAllowedLocales(_authRaw);
export const i18nConfig: I18nConfig = parseI18nConfig(import.meta.env.VITE_DEFAULT_LOCALE || brandPack.defaultLocale);

/** Returns the app's active brand config. Not a React hook — safe to call anywhere. */
export function useBrand(): BrandConfig {
	return brandConfig;
}

/** Injects --brand-primary, tags <html data-brand>, sets the title and favicon. Call once before first render. */
export function initBranding(): void {
	document.documentElement.style.setProperty('--brand-primary', brandConfig.primaryColor);
	document.documentElement.dataset.brand = brandConfig.id;
	document.title = brandConfig.title;
	const faviconEl = document.getElementById('app-favicon') as HTMLLinkElement | null;
	if (faviconEl) {
		faviconEl.href = brandConfig.favicon;
	}
}
