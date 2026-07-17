/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_DEPLOYMENT_REGION?: string;
	readonly VITE_FONT_CONFIG?: string;
	readonly VITE_FONT_PRIMARY?: string;
	readonly VITE_FONT_FALLBACK?: string;
	readonly VITE_PLATFORM_CONFIG?: string;
}

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
	readonly VITE_PADDLE_CLIENT_TOKEN: string;
	/** Flexprice's AWS account ID used in the AWS Marketplace trust-policy template. */
	readonly VITE_FLEXPRICE_AWS_ACCOUNT_ID?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

interface ReoIdentity {
	username: string;
	type: 'email' | 'github' | 'linkedin' | 'gmail' | 'userID';
	firstname?: string;
	lastname?: string;
	company?: string;
	other_identities?: Array<{ username: string; type: string }>;
}

interface ReoInstance {
	init: (options: { clientID: string }) => void;
	identify: (identity: ReoIdentity) => void;
}

interface Window {
	Reo?: ReoInstance;
}
