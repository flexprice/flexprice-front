export enum LICENSE_TIER {
	COMMUNITY = 'community',
	ENTERPRISE = 'enterprise',
}

export enum LICENSE_STATUS {
	ACTIVE = 'active',
	REVOKED = 'revoked',
	EXPIRED = 'expired',
}

// Metadata only — the licensing service never returns the signed token after mint.
export interface License {
	jti: string;
	tenant_id?: string;
	region?: string;
	tier: LICENSE_TIER;
	env: string;
	customer?: string;
	features?: string[];
	kid?: string;
	status: LICENSE_STATUS;
	exp: string;
	created_at?: string;
	revoked_at?: string;
	// User uuid who minted it, or "" when Flexprice staff issued it.
	issued_by?: string;
}
