// src/config/config.ts
import {
	BrandConfig,
	AuthPageConfig,
	I18nConfig,
	brandConfig,
	authPageConfig,
	i18nConfig,
	regionsConfig,
	allowedLocalesConfig,
	Locale,
} from './branding';
import { RegionsConfig } from './authTemplates';
import { ENVIRONMENT_TYPE } from '@/models/Environment';

export type { BrandConfig, AuthPageConfig, I18nConfig };

export enum APP_ENV {
	Local = 'local',
	Development = 'development',
	Production = 'production',
	SelfHosted = 'self-hosted',
}

export enum AUTH_PROVIDER {
	Flexprice = 'flexprice',
	Supabase = 'supabase',
}

interface AppConfig {
	env: APP_ENV;
	isProd: boolean;
}
interface ApiConfig {
	baseUrl: string;
}
interface AuthConfig {
	enabled: boolean;
	provider: AUTH_PROVIDER;
	url: string;
	anonKey: string;
}
interface SentryConfig {
	enabled: boolean;
	dsn: string;
}
interface PosthogConfig {
	enabled: boolean;
	key: string;
	host: string;
}
interface PaddleConfig {
	enabled: boolean;
	clientToken: string;
}
interface IntercomConfig {
	enabled: boolean;
	appId: string;
}
interface RegionConfig {
	indiaUrl: string;
	usUrl: string;
	dataRegionSelectionEnabled: boolean;
}
interface IntegrationsConfig {
	googleSheetsWebAppUrl: string;
}
interface RestrictionsConfig {
	rawEnvs: string;
	allowedEnvTypes: ENVIRONMENT_TYPE[]; // [] means "show all"
}

/** Primary defaults to **Geist** (Google Fonts in `src/index.css`). Override via `VITE_FONT_CONFIG`. */
export interface TypographyConfig {
	primaryFont: string;
	fallbackFont: string;
	/** Full CSS `font-family` value (primary first, then fallback). */
	fontFamily: string;
}

const DEFAULT_FONT_PRIMARY = 'Geist';
const DEFAULT_FONT_FALLBACK = 'sans-serif';

/** Wrap family name in quotes when needed for valid CSS `font-family`. */
function cssFontFamilyToken(name: string): string {
	const t = name.trim();
	if (!t) return '';
	if (/^["'].*["']$/.test(t)) return t;
	if (/[^a-zA-Z0-9-]/.test(t)) return `'${t.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
	return t;
}

interface FontConfigJson {
	primary?: string;
	fallback?: string;
}

function parseTypographyConfig(): TypographyConfig {
	const raw = import.meta.env.VITE_FONT_CONFIG?.trim();
	let primary = DEFAULT_FONT_PRIMARY;
	let fallback = DEFAULT_FONT_FALLBACK;
	if (raw) {
		try {
			const parsed = JSON.parse(raw) as FontConfigJson;
			if (typeof parsed.primary === 'string' && parsed.primary.trim()) primary = parsed.primary.trim();
			if (typeof parsed.fallback === 'string' && parsed.fallback.trim()) fallback = parsed.fallback.trim();
		} catch {
			// invalid JSON — keep defaults
		}
	}
	const fontFamily = [cssFontFamilyToken(primary), fallback].join(', ');
	return { primaryFont: primary, fallbackFont: fallback, fontFamily };
}

const typographyConfig = parseTypographyConfig();

export interface Config {
	app: AppConfig;
	api: ApiConfig;
	auth: AuthConfig;
	sentry: SentryConfig;
	posthog: PosthogConfig;
	paddle: PaddleConfig;
	intercom: IntercomConfig;
	region: RegionConfig;
	integrations: IntegrationsConfig;
	restrictions: RestrictionsConfig;
	brand: BrandConfig;
	authPage: AuthPageConfig;
	i18n: I18nConfig;
	regions: RegionsConfig;
	allowedLocales: Locale[];
	typography: TypographyConfig;
}

function parseAppEnv(): APP_ENV {
	const raw = import.meta.env.VITE_APP_ENV ?? import.meta.env.VITE_APP_ENVIRONMENT ?? import.meta.env.VITE_ENVIRONMENT;
	if (!raw) return APP_ENV.Local;
	if (raw === 'prod') return APP_ENV.Production;
	if (raw === 'dev') return APP_ENV.Development;
	return raw as APP_ENV;
}

const appEnv = parseAppEnv();

export function parseAllowedEnvTypes(raw?: string): ENVIRONMENT_TYPE[] {
	if (!raw?.trim()) return [];
	const valid = new Set(Object.values(ENVIRONMENT_TYPE));
	return raw
		.split(',')
		.map((s) => s.trim())
		.filter((s): s is ENVIRONMENT_TYPE => valid.has(s as ENVIRONMENT_TYPE));
}

export const config: Config = {
	app: {
		env: appEnv,
		isProd: appEnv === APP_ENV.Production,
	},
	api: {
		baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/v1',
	},
	auth: {
		enabled: import.meta.env.VITE_AUTH_ENABLED === 'true' || import.meta.env.VITE_SUPABASE_ENABLED === 'true',
		provider: (import.meta.env.VITE_AUTH_PROVIDER ?? AUTH_PROVIDER.Supabase) as AUTH_PROVIDER,
		url: import.meta.env.VITE_SUPABASE_URL ?? '',
		anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
	},
	sentry: {
		enabled: import.meta.env.VITE_SENTRY_ENABLED === 'true',
		dsn: import.meta.env.VITE_SENTRY_DSN ?? import.meta.env.VITE_APP_PUBLIC_SENTRY_DSN ?? '',
	},
	posthog: {
		enabled: import.meta.env.VITE_POSTHOG_ENABLED === 'true',
		key: import.meta.env.VITE_POSTHOG_KEY ?? import.meta.env.VITE_APP_PUBLIC_POSTHOG_KEY ?? '',
		host: import.meta.env.VITE_POSTHOG_HOST ?? import.meta.env.VITE_APP_PUBLIC_POSTHOG_HOST ?? '',
	},
	paddle: {
		enabled: import.meta.env.VITE_PADDLE_ENABLED === 'true',
		clientToken: import.meta.env.VITE_PADDLE_CLIENT_TOKEN ?? '',
	},
	intercom: {
		enabled: import.meta.env.VITE_INTERCOM_ENABLED === 'true',
		appId: import.meta.env.VITE_INTERCOM_APP_ID ?? import.meta.env.VITE_APP_INTERCOM_APP_ID ?? '',
	},
	region: {
		indiaUrl: import.meta.env.VITE_DASHBOARD_URL_INDIA ?? '',
		usUrl: import.meta.env.VITE_DASHBOARD_URL_US ?? '',
		dataRegionSelectionEnabled: import.meta.env.VITE_DATA_REGION_SELECTION_ENABLED === 'true',
	},
	integrations: {
		googleSheetsWebAppUrl: import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL ?? '',
	},
	restrictions: {
		rawEnvs: import.meta.env.VITE_RESTRICTED_ENVS ?? '',
		allowedEnvTypes: parseAllowedEnvTypes(import.meta.env.VITE_ALLOWED_ENV_TYPES),
	},
	brand: brandConfig,
	authPage: authPageConfig,
	i18n: i18nConfig,
	regions: regionsConfig,
	allowedLocales: allowedLocalesConfig,
	typography: typographyConfig,
};

/** Sets `--font-sans` from `config.typography.fontFamily` (see `src/index.css`). Call once at startup. */
export function initTypography(): void {
	if (typeof document === 'undefined') return;
	document.documentElement.style.setProperty('--font-sans', config.typography.fontFamily);
}
