export enum LICENSE_TIER {
	COMMUNITY = 'community',
	ENTERPRISE = 'enterprise',
}

export enum LICENSE_STATUS {
	ACTIVE = 'active',
	REVOKED = 'revoked',
	EXPIRED = 'expired',
}

// Metadata only — Heimdall never returns the signed token after mint.
export interface License {
	jti: string;
	tier: LICENSE_TIER;
	env: string;
	customer?: string;
	features?: string[];
	status: LICENSE_STATUS;
	exp: string;
	created_at?: string;
}
