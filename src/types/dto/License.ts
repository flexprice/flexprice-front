import { License, LICENSE_TIER } from '@/models/License';

export interface LicensingTokenResponse {
	token: string;
}

export interface MintLicenseRequest {
	tier: LICENSE_TIER;
	env?: string;
	// Admin-only: mints for another tenant. Backend ignores both for non-admins.
	tenant_id?: string;
	customer?: string;
	features?: string[];
	// Backend forces TTL for community; only enterprise honors this value.
	ttl_days?: number;
}

export interface LicensingTokenClaims {
	is_admin?: boolean;
	exp?: number;
}

// license_key is shown once — the licensing service doesn't persist it, so it never appears again.
export interface MintLicenseResponse {
	license_key: string;
	jti: string;
}

export interface ListLicensesResponse {
	licenses: License[];
}
