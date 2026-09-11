import axios from 'axios';
import { AxiosClient } from '@/core/axios/verbs';
import { License } from '@/models/License';
import { LicensingTokenResponse, MintLicenseRequest, MintLicenseResponse, ListLicensesResponse } from '@/types/dto/License';

// Heimdall is a separate host from the flexprice backend — it must NOT go through the shared
// AxiosClient, which would leak the flexprice JWT + X-Environment-ID header to it. Separate
// instance, no interceptors, only the short-lived licensing token as Bearer.
const HEIMDALL_URL = import.meta.env.VITE_HEIMDALL_URL ?? 'http://localhost:58080';

const heimdallClient = axios.create({
	baseURL: `${HEIMDALL_URL}/v1`,
	timeout: 30000,
	headers: { 'Content-Type': 'application/json' },
});

// Licensing token is session-bound and short-lived — cached in memory only, re-fetched on 401.
let cachedToken: string | null = null;

class LicenseApi {
	public static async getLicensingToken(forceRefresh = false): Promise<string> {
		if (cachedToken && !forceRefresh) return cachedToken;
		const res = await AxiosClient.get<LicensingTokenResponse>('/licensing-token');
		cachedToken = res.token;
		return cachedToken;
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
