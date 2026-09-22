import { config } from '@/config/config';
import { AxiosClient } from '@/core/axios/verbs';
import errorLogger from '@/core/services/error/ErrorLoggingService';
import type { FireEventsPayload } from '@/types/dto';
import { logger } from '@/utils/common/Logger';

export interface SetupDemoRequest {
	// Add fields based on backend requirements
	// This may need to be updated once backend structure is known
	[key: string]: unknown;
}

export interface SetupDemoResponse {
	// Add fields based on backend response
	// This may need to be updated once backend structure is known
	message?: string;
	[key: string]: unknown;
}

/**
 * One column per field in the onboarding sheet. Explicit (rather than `Record<string, string>`)
 * so a field that the form no longer collects can't silently keep shipping as an empty string —
 * which is how `role` / `teamSize` / `pricingType` / `website` ended up blank in the sheet for
 * months after the onboarding redesign dropped those steps.
 */
export interface OnboardingDataRequest {
	orgName: string;
	orgUrl: string;
	referralSource: string;
	userEmail: string;
	tenantId: string;
	timestamp: string;
}

/**
 * Apps Script serves its own failures as an HTTP **200** `text/html` page rather than an error
 * status, so `res.ok` alone reports a dead deployment as a success. These are the markers it
 * renders in that page; `No such user` in particular means the account that owns the deployment
 * no longer exists, which silently stopped every onboarding row from being written.
 */
const APPS_SCRIPT_ERROR_MARKERS = [
	'No such user',
	'Script function not found',
	'Authorization is required',
	'Sorry, unable to open the file',
	'Sorry, unable to open the page',
	'The script completed but did not return anything',
] as const;

/** Returns the Apps Script error rendered in the response, or null when it looks like a real result. */
const findAppsScriptError = (body: string, contentType: string | null): string | null => {
	const marker = APPS_SCRIPT_ERROR_MARKERS.find((m) => body.includes(m));
	if (marker) return marker;

	// A healthy deployment answers from script.googleusercontent.com with the payload its
	// ContentService returns. An HTML document back from /exec means Google rendered a page
	// of its own — an error or a sign-in wall — and doPost never ran.
	if (contentType?.includes('text/html') && /<title>\s*Error\s*<\/title>/i.test(body)) {
		return 'Apps Script returned an error page';
	}

	return null;
};

/**
 * Reported loudly rather than via `console.warn`: this call is fire-and-forget telemetry with no
 * user-visible failure mode, so an unreported break stays invisible until someone notices the
 * sheet has stopped filling. Deliberately omits `userEmail` — the failure context doesn't need PII.
 */
const reportRecordingFailure = (reason: string, payload: OnboardingDataRequest, extra?: Record<string, unknown>): void => {
	const context = { reason, tenantId: payload.tenantId, orgName: payload.orgName, ...extra };
	logger.error('Failed to record onboarding data to Google Sheets.', context);
	errorLogger.logError(new Error(`Onboarding sheet recording failed: ${reason}`), undefined, context);
};

class OnboardingApi {
	private static baseUrl = '/portal/onboarding';

	/**
	 * Generate events for onboarding
	 * POST /portal/onboarding/events
	 */
	public static async generateEvents(payload: FireEventsPayload): Promise<void> {
		return await AxiosClient.post<void>(`${this.baseUrl}/events`, payload);
	}

	/**
	 * Setup demo
	 * POST /portal/onboarding/setup
	 */
	public static async setupDemo(payload: SetupDemoRequest): Promise<SetupDemoResponse> {
		return await AxiosClient.post<SetupDemoResponse>(`${this.baseUrl}/setup`, payload);
	}

	/**
	 * Record onboarding data to Google Sheets
	 * POST to Google Apps Script Web App URL
	 *
	 * Never throws: onboarding must complete even when the sheet is unreachable.
	 */
	public static async recordOnboardingData(payload: OnboardingDataRequest): Promise<void> {
		const webAppUrl = config.integrations.googleSheetsWebAppUrl;

		if (!webAppUrl) {
			reportRecordingFailure('VITE_GOOGLE_SHEETS_WEB_APP_URL is not configured', payload);
			return;
		}

		// Use a "simple" fetch request to avoid CORS preflight (OPTIONS) where possible.
		// Note: `Content-Type: application/json` would trigger a preflight in browsers.
		const controller = new AbortController();
		const timeoutId = window.setTimeout(() => controller.abort(), 10_000);

		try {
			const res = await fetch(webAppUrl, {
				method: 'POST',
				headers: {
					// Keep request "simple" to reduce preflight chances (Google Apps Script can still read raw body).
					'Content-Type': 'text/plain;charset=UTF-8',
				},
				body: JSON.stringify(payload),
				signal: controller.signal,
			});

			const body = await res.text().catch(() => '');

			// This is non-critical telemetry; don't hard-fail onboarding on sheet issues.
			if (!res.ok) {
				reportRecordingFailure(`HTTP ${res.status} ${res.statusText}`, payload, { body: body.slice(0, 500) });
				return;
			}

			const appsScriptError = findAppsScriptError(body, res.headers.get('content-type'));
			if (appsScriptError) {
				reportRecordingFailure(appsScriptError, payload, { status: res.status });
			}
		} catch (err) {
			// A cross-origin read that the browser blocks also lands here, so the row may in fact
			// have been written — the response just wasn't readable. Still worth reporting: an
			// unreadable response means we can no longer tell working from broken.
			const reason = controller.signal.aborted
				? 'Request timed out after 10s'
				: `Request failed: ${(err as Error)?.message ?? 'unknown error'}`;
			reportRecordingFailure(reason, payload);
		} finally {
			window.clearTimeout(timeoutId);
		}
	}
}

export default OnboardingApi;
