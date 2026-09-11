import axios from 'axios';
import { AxiosClient } from '@/core/axios/verbs';
import { License } from '@/models/License';
import {
	LicensingTokenResponse,
	MintLicenseRequest,
	MintLicenseResponse,
	ListLicensesResponse,
	LicensingTokenClaims,
} from '@/types/dto/License';

// Heimdall is a separate host from the flexprice backend — it must NOT go through the shared
// AxiosClient, which would leak the flexprice JWT + X-Environment-ID header to it. Separate
// instance, no interceptors, only the short-lived licensing token as Bearer.
const HEIMDALL_URL = import.meta.env.VITE_HEIMDALL_URL ?? 'http://localhost:58080';

const heimdallClient = axios.create({
	baseURL: `${HEIMDALL_URL}/v1`,
	timeout: 30000,
	headers: { 'Content-Type': 'application/json' },
});

// Persisted so a page refresh reuses the still-valid token instead of minting a new one every load.
const TOKEN_STORAGE_KEY = 'heimdall_licensing_token';
// Tolerate small clock drift between browser and Heimdall's exp.
const EXPIRY_SKEW_SECONDS = 10;

// No signature verification needed client-side — we only read claims to decide token reuse / admin gating.
function decodeJwtClaims(token: string): LicensingTokenClaims | null {
	try {
		const payload = token.split('.')[1];
		const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
		return JSON.parse(atob(base64));
	} catch {
		return null;
	}
}

function isTokenValid(token: string | null): token is string {
	if (!token) return false;
	const exp = decodeJwtClaims(token)?.exp;
	if (typeof exp !== 'number') return false;
	return exp > Date.now() / 1000 + EXPIRY_SKEW_SECONDS;
}

function readStoredToken(): string | null {
	try {
		return localStorage.getItem(TOKEN_STORAGE_KEY);
	} catch {
		return null;
	}
}

function storeToken(token: string) {
	try {
		localStorage.setItem(TOKEN_STORAGE_KEY, token);
	} catch {
		// ponytail: private mode / disabled storage — token still works for this in-memory session.
	}
}

class LicenseApi {
	public static async getLicensingToken(forceRefresh = false): Promise<string> {
		if (!forceRefresh) {
			const stored = readStoredToken();
			if (isTokenValid(stored)) return stored;
		}
		const res = await AxiosClient.get<LicensingTokenResponse>('/licensing-token');
		storeToken(res.token);
		return res.token;
	}

	// Drives the create-form gate: full form (incl. tenant_id) for admins, single-button
	// community mint for everyone else. Re-derived from whatever token is currently valid.
	public static async isAdmin(): Promise<boolean> {
		const token = await LicenseApi.getLicensingToken();
		return decodeJwtClaims(token)?.is_admin === true;
	}

	private static async heimdallAuthHeaders(forceRefresh = false) {
		const token = await LicenseApi.getLicensingToken(forceRefresh);
		return { Authorization: `Bearer ${token}` };
	}

	// ponytail: one retry-on-401 rather than a generic interceptor — only Heimdall calls need it,
	// and there are exactly four of them.
	private static async withHeimdallAuth<T>(fn: (headers: { Authorization: string }) => Promise<T>): Promise<T> {
		try {
			return await fn(await LicenseApi.heimdallAuthHeaders());
		} catch (err) {
			if (axios.isAxiosError(err) && err.response?.status === 401) {
				return await fn(await LicenseApi.heimdallAuthHeaders(true));
			}
			throw err;
		}
	}

	public static async mintLicense(payload: MintLicenseRequest): Promise<MintLicenseResponse> {
		return LicenseApi.withHeimdallAuth(async (headers) => {
			const res = await heimdallClient.post<MintLicenseResponse>('/licenses/mint', payload, { headers });
			return res.data;
		});
	}

	public static async listLicenses(): Promise<License[]> {
		return LicenseApi.withHeimdallAuth(async (headers) => {
			const res = await heimdallClient.get<ListLicensesResponse>('/licenses', { headers });
			return res.data.licenses;
		});
	}

	public static async getLicense(jti: string): Promise<License> {
		return LicenseApi.withHeimdallAuth(async (headers) => {
			const res = await heimdallClient.get<License>(`/licenses/${jti}`, { headers });
			return res.data;
		});
	}

	public static async revokeLicense(jti: string): Promise<void> {
		return LicenseApi.withHeimdallAuth(async (headers) => {
			await heimdallClient.post(`/licenses/${jti}/revoke`, undefined, { headers });
		});
	}
}

export default LicenseApi;
