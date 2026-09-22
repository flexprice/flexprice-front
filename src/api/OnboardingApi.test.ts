import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const logErrorMock = vi.fn();

// recordOnboardingData talks to the sheet over `fetch`, never over AxiosClient. Stubbing the
// axios module keeps its auth/supabase import chain out of the test — loading it for real cost
// ~4s per module reset, which tripped Vitest's 5s timeout in CI.
vi.mock('@/core/axios/verbs', () => ({ AxiosClient: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

vi.mock('@/core/services/error/ErrorLoggingService', () => ({
	default: { logError: (...args: unknown[]) => logErrorMock(...args) },
	errorLogger: { logError: (...args: unknown[]) => logErrorMock(...args) },
}));

const WEB_APP_URL = 'https://script.google.com/macros/s/TEST/exec';

const PAYLOAD = {
	orgName: 'Acme',
	orgUrl: 'acme.com',
	referralSource: 'LinkedIn',
	userEmail: 'someone@acme.com',
	tenantId: 'tenant_123',
	timestamp: '2026-09-21T00:00:00.000Z',
};

// The real Apps Script error page, trimmed: HTTP 200, text/html, no error status anywhere.
const APPS_SCRIPT_ERROR_PAGE =
	'<!DOCTYPE html><html><head><title>Error</title></head>' +
	'<body><div style="text-align:center;font-family:monospace">No such user</div></body></html>';

const mockResponse = (body: string, init: { status?: number; statusText?: string; contentType?: string } = {}) =>
	({
		ok: (init.status ?? 200) >= 200 && (init.status ?? 200) < 300,
		status: init.status ?? 200,
		statusText: init.statusText ?? 'OK',
		headers: { get: (key: string) => (key.toLowerCase() === 'content-type' ? (init.contentType ?? 'text/html') : null) },
		text: () => Promise.resolve(body),
	}) as unknown as Response;

async function freshOnboardingApi(webAppUrl: string) {
	vi.resetModules();
	// Keep the real config (AxiosClient/auth pull plenty out of it) and override only the URL.
	vi.doMock('@/config/config', async (importOriginal) => {
		const actual = await importOriginal<typeof import('@/config/config')>();
		return {
			...actual,
			config: { ...actual.config, integrations: { ...actual.config.integrations, googleSheetsWebAppUrl: webAppUrl } },
		};
	});
	const mod = await import('./OnboardingApi');
	return mod.default;
}

describe('OnboardingApi.recordOnboardingData', () => {
	beforeEach(() => {
		logErrorMock.mockClear();
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('reports a failure when Apps Script serves its error page as HTTP 200', async () => {
		// Regression guard: the deployment owner's Google account was deleted, so every POST got
		// back "No such user" with a 200. Checking res.ok alone read that as success and the sheet
		// silently stopped filling.
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(APPS_SCRIPT_ERROR_PAGE)));
		const OnboardingApi = await freshOnboardingApi(WEB_APP_URL);

		await expect(OnboardingApi.recordOnboardingData(PAYLOAD)).resolves.toBeUndefined();

		expect(logErrorMock).toHaveBeenCalledTimes(1);
		expect((logErrorMock.mock.calls[0][0] as Error).message).toContain('No such user');
	});

	it('stays quiet when the script answers normally', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse('{"result":"success"}', { contentType: 'application/json' })));
		const OnboardingApi = await freshOnboardingApi(WEB_APP_URL);

		await OnboardingApi.recordOnboardingData(PAYLOAD);

		expect(logErrorMock).not.toHaveBeenCalled();
	});

	it('reports a non-2xx response', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse('nope', { status: 500, statusText: 'Server Error' })));
		const OnboardingApi = await freshOnboardingApi(WEB_APP_URL);

		await OnboardingApi.recordOnboardingData(PAYLOAD);

		expect((logErrorMock.mock.calls[0][0] as Error).message).toContain('HTTP 500');
	});

	it('reports a rejected request (network / blocked CORS read) without throwing', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
		const OnboardingApi = await freshOnboardingApi(WEB_APP_URL);

		await expect(OnboardingApi.recordOnboardingData(PAYLOAD)).resolves.toBeUndefined();
		expect((logErrorMock.mock.calls[0][0] as Error).message).toContain('Failed to fetch');
	});

	it('reports a missing web app URL instead of returning silently', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		const OnboardingApi = await freshOnboardingApi('');

		await OnboardingApi.recordOnboardingData(PAYLOAD);

		expect(fetchMock).not.toHaveBeenCalled();
		expect((logErrorMock.mock.calls[0][0] as Error).message).toContain('not configured');
	});

	it('never puts the user email into failure telemetry', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(APPS_SCRIPT_ERROR_PAGE)));
		const OnboardingApi = await freshOnboardingApi(WEB_APP_URL);

		await OnboardingApi.recordOnboardingData(PAYLOAD);

		expect(JSON.stringify(logErrorMock.mock.calls[0][2])).not.toContain(PAYLOAD.userEmail);
	});

	it('sends only the fields the onboarding form collects', async () => {
		const fetchMock = vi.fn().mockResolvedValue(mockResponse('{"result":"success"}', { contentType: 'application/json' }));
		vi.stubGlobal('fetch', fetchMock);
		const OnboardingApi = await freshOnboardingApi(WEB_APP_URL);

		await OnboardingApi.recordOnboardingData(PAYLOAD);

		const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(Object.keys(sent).sort()).toEqual(['orgName', 'orgUrl', 'referralSource', 'tenantId', 'timestamp', 'userEmail']);
	});
});
