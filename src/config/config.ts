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
import { EnvFlag } from '@/types/enums/env';

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

export enum WEBHOOK_PROVIDER {
	Svix = 'svix',
	Custom = 'custom',
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
interface PylonConfig {
	enabled: boolean;
	appId: string;
	/** When true, fetch HMAC email hash from the backend and pass it as Pylon `email_hash`. */
	identityVerificationEnabled: boolean;
}
interface ReoConfig {
	enabled: boolean;
	clientId: string;
}
interface RegionConfig {
	indiaUrl: string;
	usUrl: string;
	dataRegionSelectionEnabled: boolean;
}
interface IntegrationsConfig {
	googleSheetsWebAppUrl: string;
	/** Flexprice's AWS account ID, injected into the AWS Marketplace trust-policy template, and into
	 * the GCP Marketplace WIF setup script. */
	flexpriceAwsAccountId: string;
	/** Flexprice's AWS IAM role name, injected into the GCP Marketplace WIF setup script. */
	flexpriceAwsRoleName: string;
}
interface RestrictionsConfig {
	rawEnvs: string;
}

export interface PlatformConfig {
	api_reference: {
		enabled: boolean;
	};
	sidebar_documentation: {
		enabled: boolean;
	};
	guides: {
		enabled: boolean;
	};
	onboarding: {
		enabled: boolean;
	};
	contact_us: {
		enabled: boolean;
	};
	production: {
		enabled: boolean;
	};
	signup: {
		enabled: boolean;
	};
	revenue: {
		enabled: boolean;
	};
}

const PLATFORM_FEATURE_DEFAULTS = {
	api_reference: true,
	sidebar_documentation: true,
	guides: true,
	onboarding: true,
	production: false,
	signup: true,
	revenue: true,
} as const;

type PlatformFeatureKey = keyof typeof PLATFORM_FEATURE_DEFAULTS;

interface PlatformConfigJson {
	api_reference?: { enabled?: boolean };
	sidebar_documentation?: { enabled?: boolean };
	guides?: { enabled?: boolean };
	onboarding?: { enabled?: boolean };
	contact_us?: boolean | { enabled?: boolean };
	production?: { enabled?: boolean };
	signup?: { enabled?: boolean };
	revenue?: { enabled?: boolean };
}

function parsePlatformFeatureEnabled(parsed: PlatformConfigJson | undefined, key: PlatformFeatureKey): boolean {
	const fromEnv = parsed?.[key]?.enabled;
	if (typeof fromEnv === 'boolean') return fromEnv;
	return PLATFORM_FEATURE_DEFAULTS[key];
}

function parseContactUsEnabled(parsed: PlatformConfigJson | undefined): boolean {
	const raw = parsed?.contact_us;
	if (raw === true) return true;
	if (typeof raw === 'object' && raw !== null && raw.enabled === true) return true;
	return false;
}

/** Parse `VITE_PLATFORM_CONFIG` JSON. Keys: api_reference, sidebar_documentation, guides, onboarding, contact_us, production, signup, revenue. Omitted keys default to `enabled: true` (contact_us and production default to false). */
export function parsePlatformConfig(rawPlatformConfig?: string): PlatformConfig {
	let parsed: PlatformConfigJson | undefined;
	const raw = rawPlatformConfig?.trim();

	if (raw) {
		try {
			parsed = JSON.parse(raw) as PlatformConfigJson;
		} catch {
			// invalid JSON — use defaults for all features
		}
	}

	return {
		api_reference: { enabled: parsePlatformFeatureEnabled(parsed, 'api_reference') },
		sidebar_documentation: { enabled: parsePlatformFeatureEnabled(parsed, 'sidebar_documentation') },
		guides: { enabled: parsePlatformFeatureEnabled(parsed, 'guides') },
		onboarding: { enabled: parsePlatformFeatureEnabled(parsed, 'onboarding') },
		contact_us: { enabled: parseContactUsEnabled(parsed) },
		production: { enabled: parsePlatformFeatureEnabled(parsed, 'production') },
		signup: { enabled: parsePlatformFeatureEnabled(parsed, 'signup') },
		revenue: { enabled: parsePlatformFeatureEnabled(parsed, 'revenue') },
	};
}

const platformConfig = parsePlatformConfig(import.meta.env.VITE_PLATFORM_CONFIG);

export interface WebhooksConfig {
	provider: WEBHOOK_PROVIDER;
	/** Public origin of a self-hosted Svix API (browser-reachable). Empty when using hosted Svix. */
	svixUrl: string;
}

interface FeaturesConfig {
	/** Tenant IDs allowed to use gated UI features (e.g. customer org_type metadata filter). */
	tenantFeatureAllowlist: string[];
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

function parseTenantFeatureAllowlist(): string[] {
	const raw = import.meta.env.VITE_TENANT_FEATURE_ALLOWLIST?.trim();
	if (!raw) return [];

	try {
		const parsed = JSON.parse(raw) as unknown;
		if (Array.isArray(parsed)) {
			return parsed
				.filter((entry): entry is string => typeof entry === 'string')
				.map((entry) => entry.trim())
				.filter(Boolean);
		}
	} catch {
		// fall through to comma-separated parsing
	}

	return raw
		.split(',')
		.map((entry: string) => entry.trim())
		.filter(Boolean);
}

const tenantFeatureAllowlist = parseTenantFeatureAllowlist();

export interface Config {
	app: AppConfig;
	api: ApiConfig;
	auth: AuthConfig;
	posthog: PosthogConfig;
	paddle: PaddleConfig;
	intercom: IntercomConfig;
	pylon: PylonConfig;
	reo: ReoConfig;
	region: RegionConfig;
	integrations: IntegrationsConfig;
	restrictions: RestrictionsConfig;
	brand: BrandConfig;
	authPage: AuthPageConfig;
	i18n: I18nConfig;
	regions: RegionsConfig;
	allowedLocales: Locale[];
	typography: TypographyConfig;
	platform: PlatformConfig;
	features: FeaturesConfig;
	webhooks: WebhooksConfig;
}

/**
 * Resolves the active webhook portal provider from env.
 * - `flexprice` → custom (Flexprice portal).
 * - `svix` → hosted Svix (explicit default).
 * - unset/empty → hosted Svix, unless VITE_SVIX_URL is set (then custom).
 */
export function resolveWebhookProvider(providerRaw?: string, svixUrl?: string): WEBHOOK_PROVIDER {
	const provider = providerRaw?.trim().toLowerCase();
	if (provider === 'flexprice') return WEBHOOK_PROVIDER.Custom;
	if (provider === 'svix') return WEBHOOK_PROVIDER.Svix;
	if (!provider && svixUrl?.trim()) return WEBHOOK_PROVIDER.Custom;
	return WEBHOOK_PROVIDER.Svix;
}

function parseAppEnv(): APP_ENV {
	const raw = import.meta.env.VITE_APP_ENV ?? import.meta.env.VITE_APP_ENVIRONMENT ?? import.meta.env.VITE_ENVIRONMENT;
	if (!raw) return APP_ENV.Local;
	if (raw === 'prod') return APP_ENV.Production;
	if (raw === 'dev') return APP_ENV.Development;
	return raw as APP_ENV;
}

const appEnv = parseAppEnv();

const svixUrl = import.meta.env.VITE_SVIX_URL ?? '';

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
	pylon: {
		enabled: import.meta.env.VITE_PYLON_ENABLED === EnvFlag.True,
		appId: import.meta.env.VITE_PYLON_APP_ID ?? '',
		identityVerificationEnabled: import.meta.env.VITE_PYLON_IDENTITY_VERIFICATION_ENABLED === EnvFlag.True,
	},
	reo: {
		enabled: import.meta.env.VITE_REO_ENABLED === 'true',
		clientId: import.meta.env.VITE_REO_CLIENT_ID ?? '',
	},
	region: {
		indiaUrl: import.meta.env.VITE_DASHBOARD_URL_INDIA ?? '',
		usUrl: import.meta.env.VITE_DASHBOARD_URL_US ?? '',
		dataRegionSelectionEnabled: import.meta.env.VITE_DATA_REGION_SELECTION_ENABLED === 'true',
	},
	integrations: {
		googleSheetsWebAppUrl: import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL ?? '',
		flexpriceAwsAccountId: import.meta.env.VITE_FLEXPRICE_AWS_ACCOUNT_ID ?? '',
		flexpriceAwsRoleName: import.meta.env.VITE_FLEXPRICE_AWS_ROLE_NAME ?? '',
	},
	restrictions: {
		rawEnvs: import.meta.env.VITE_RESTRICTED_ENVS ?? '',
	},
	brand: brandConfig,
	authPage: authPageConfig,
	i18n: i18nConfig,
	regions: regionsConfig,
	allowedLocales: allowedLocalesConfig,
	typography: typographyConfig,
	platform: platformConfig,
	features: {
		tenantFeatureAllowlist,
	},
	webhooks: {
		provider: resolveWebhookProvider(import.meta.env.VITE_WEBHOOK_PROVIDER, svixUrl),
		svixUrl,
	},
};

/** Sets `--font-sans` from `config.typography.fontFamily` (see `src/index.css`). Call once at startup. */
export function initTypography(): void {
	if (typeof document === 'undefined') return;
	document.documentElement.style.setProperty('--font-sans', config.typography.fontFamily);
}
