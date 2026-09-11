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

describe('LicenseApi', () => {
	beforeEach(() => {
		vi.resetModules();
		getMock.mockReset();
		postMock.mockReset();
	});

	it('fetches a flexprice licensing token before calling Heimdall, and reuses it on the next call', async () => {
		getMock.mockResolvedValueOnce({ token: 'jwt-abc' }); // flexprice /licensing-token
		getMock.mockResolvedValueOnce({ data: { licenses: [] } }); // heimdall /licenses

		const { default: LicenseApi } = await import('./LicenseApi');
		const licenses = await LicenseApi.listLicenses();

		expect(licenses).toEqual([]);
		expect(getMock).toHaveBeenNthCalledWith(1, '/licensing-token');
		expect(getMock).toHaveBeenNthCalledWith(2, '/licenses', { headers: { Authorization: 'Bearer jwt-abc' } });

		// second call reuses the cached token — no second /licensing-token fetch
		getMock.mockResolvedValueOnce({ data: { licenses: [] } });
		await LicenseApi.listLicenses();
		expect(getMock).toHaveBeenCalledTimes(3);
	});

	it('mints a license against Heimdall with the licensing token as Bearer', async () => {
		getMock.mockResolvedValueOnce({ token: 'jwt-xyz' });
		postMock.mockResolvedValueOnce({ data: { license_key: 'lic_secret', jti: 'jti_1' } });

		const { default: LicenseApi } = await import('./LicenseApi');
		const res = await LicenseApi.mintLicense({ tier: 'community' as never, env: 'sandbox' });

		expect(res).toEqual({ license_key: 'lic_secret', jti: 'jti_1' });
		expect(postMock).toHaveBeenCalledWith(
			'/licenses/mint',
			{ tier: 'community', env: 'sandbox' },
			{ headers: { Authorization: 'Bearer jwt-xyz' } },
		);
	});
});
