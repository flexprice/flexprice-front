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
}
interface IntegrationsConfig {
	googleSheetsWebAppUrl: string;
}
interface RestrictionsConfig {
	rawEnvs: string;
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
}

export interface I18nConfig {
	locale: string;
	direction: 'ltr' | 'rtl';
}

const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'] as const;

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
		};
	} catch {
		return {
			tagline: null,
			supportEmail: 'support@flexprice.io',
			loginBgImage: null,
			slackCommunityUrl: 'https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ',
		};
	}
}

export function parseI18nConfig(): I18nConfig {
	const locale = import.meta.env.VITE_DEFAULT_LOCALE ?? 'en';
	return { locale, direction: (RTL_LOCALES as readonly string[]).includes(locale) ? 'rtl' : 'ltr' };
}

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
}

function parseAppEnv(): APP_ENV {
	const raw = import.meta.env.VITE_APP_ENV ?? import.meta.env.VITE_APP_ENVIRONMENT ?? import.meta.env.VITE_ENVIRONMENT;

	if (!raw) return APP_ENV.Local;
	if (raw === 'prod') return APP_ENV.Production;
	if (raw === 'dev') return APP_ENV.Development;
	return raw as APP_ENV;
}

const appEnv = parseAppEnv();

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
	},
	integrations: {
		googleSheetsWebAppUrl: import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL ?? '',
	},
	restrictions: {
		rawEnvs: import.meta.env.VITE_RESTRICTED_ENVS ?? '',
	},
	brand: parseBrandConfig(),
	authPage: parseAuthPageConfig(),
	i18n: parseI18nConfig(),
};
