import { License, LICENSE_TIER } from '@/models/License';

export interface LicensingTokenResponse {
	token: string;
}

export interface MintLicenseRequest {
	tier: LICENSE_TIER;
	env: string;
	features?: string[];
	ttl_days?: number;
}

// license_key is shown once — Heimdall doesn't persist it, so it never appears again.
export interface MintLicenseResponse {
	license_key: string;
	jti: string;
}

export interface ListLicensesResponse {
	licenses: License[];
}
