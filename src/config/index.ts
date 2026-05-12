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
};
