/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_DEPLOYMENT_REGION?: string;
	readonly VITE_PLATFORM_CONFIG?: string;
}

declare const __APP_VERSION__: string;
/** True only when built by Vercel's own build pipeline (see vite.config.ts) — see @vercel/speed-insights gating in main.tsx. */
declare const __IS_VERCEL__: boolean;

interface ImportMetaEnv {
	readonly VITE_PADDLE_CLIENT_TOKEN: string;
	/** Flexprice's AWS account ID used in the AWS Marketplace trust-policy template, and in the GCP
	 * Marketplace Workload Identity Federation setup script's --account-id. */
	readonly VITE_FLEXPRICE_AWS_ACCOUNT_ID?: string;
	/** Flexprice's AWS IAM role name, used in the GCP Marketplace WIF setup script's
	 * --attribute-condition — must match the role the GCP-reporting worker actually runs as. */
	readonly VITE_FLEXPRICE_AWS_ROLE_NAME?: string;
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
