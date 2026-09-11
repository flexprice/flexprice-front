import { describe, it, expect, vi, beforeEach } from 'vitest';

const getMock = vi.fn();
const postMock = vi.fn();

vi.mock('@/core/axios/verbs', () => ({
	AxiosClient: {
		get: (...args: unknown[]) => getMock(...args),
	},
}));

vi.mock('axios', async (importOriginal) => {
	const actual = await importOriginal<typeof import('axios')>();
	return {
		...actual,
		default: {
			...actual.default,
			create: () => ({ get: getMock, post: postMock }),
			isAxiosError: actual.default.isAxiosError,
		},
	};
});

// Real JWTs (unsigned — LicenseApi never verifies, only decodes claims client-side) so the
// exp-based localStorage reuse logic in getLicensingToken has something valid to parse.
function fakeJwt(claims: Record<string, unknown>): string {
	const b64url = (obj: unknown) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	return `${b64url({ alg: 'none' })}.${b64url(claims)}.sig`;
}

const validToken = fakeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });

// The test runner's `localStorage` global doesn't implement setItem/getItem — stub a real
// one so the token-reuse behavior under test actually has somewhere to persist to.
function stubLocalStorage() {
	const store = new Map<string, string>();
	vi.stubGlobal('localStorage', {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => void store.set(key, value),
		removeItem: (key: string) => void store.delete(key),
		clear: () => void store.clear(),
	});
}

describe('LicenseApi', () => {
	beforeEach(() => {
		vi.resetModules();
		getMock.mockReset();
		postMock.mockReset();
		stubLocalStorage();
	});

	it('fetches a flexprice licensing token before calling Heimdall, and reuses it on the next call', async () => {
		getMock.mockResolvedValueOnce({ token: validToken }); // flexprice /licensing-token
		getMock.mockResolvedValueOnce({ data: { licenses: [] } }); // heimdall /licenses

		const { default: LicenseApi } = await import('./LicenseApi');
		const licenses = await LicenseApi.listLicenses();

		expect(licenses).toEqual([]);
		expect(getMock).toHaveBeenNthCalledWith(1, '/licensing-token');
		expect(getMock).toHaveBeenNthCalledWith(2, '/licenses', { headers: { Authorization: `Bearer ${validToken}` } });

		// second call reuses the still-valid (unexpired) token — no second /licensing-token fetch
		getMock.mockResolvedValueOnce({ data: { licenses: [] } });
		await LicenseApi.listLicenses();
		expect(getMock).toHaveBeenCalledTimes(3);
	});

	it('mints a license against Heimdall with the licensing token as Bearer', async () => {
		getMock.mockResolvedValueOnce({ token: validToken });
		postMock.mockResolvedValueOnce({ data: { license_key: 'lic_secret', jti: 'jti_1' } });

		const { default: LicenseApi } = await import('./LicenseApi');
		const res = await LicenseApi.mintLicense({ tier: 'community' as never, env: 'sandbox' });

		expect(res).toEqual({ license_key: 'lic_secret', jti: 'jti_1' });
		expect(postMock).toHaveBeenCalledWith(
			'/licenses/mint',
			{ tier: 'community', env: 'sandbox' },
			{ headers: { Authorization: `Bearer ${validToken}` } },
		);
	});
});
