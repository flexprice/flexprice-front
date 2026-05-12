import { AxiosClient } from '@/core/axios/verbs';
import { FireEventsPayload } from '@/types/dto';

export interface SetupDemoRequest {
	// Add fields based on backend requirements
	// This may need to be updated once backend structure is known
	[key: string]: any;
}

export interface SetupDemoResponse {
	// Add fields based on backend response
	// This may need to be updated once backend structure is known
	message?: string;
	[key: string]: any;
}

export type OnboardingDataRequest = Record<string, string>;

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
	 */
	public static async recordOnboardingData(payload: OnboardingDataRequest): Promise<void> {
		const webAppUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL;

		if (!webAppUrl) {
			console.warn('VITE_GOOGLE_SHEETS_WEB_APP_URL is not configured. Skipping onboarding data recording.');
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

			// This is non-critical telemetry; don't hard-fail onboarding on sheet issues.
			if (!res.ok) {
				const text = await res.text().catch(() => '');
				console.warn('Failed to record onboarding data to Google Sheets.', {
					status: res.status,
					statusText: res.statusText,
					body: text,
				});
			}
		} catch (err) {
			console.warn('Failed to record onboarding data to Google Sheets.', err);
		} finally {
			window.clearTimeout(timeoutId);
		}
	}
}

export default OnboardingApi;
