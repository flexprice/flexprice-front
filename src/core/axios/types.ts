/** Nested `error` object on typical failed API JSON bodies */
export interface FailedApiDetails {
	message: string;
	internal_error?: string;
	details?: Record<string, string>;
}

/** `{ success: false, error: … }` envelope from the API */
export interface FailedApiEnvelope {
	success: false;
	error: FailedApiDetails;
}

/** Alias for casts on {@link HttpRejectedError.cause} when branching on nested API fields */
export type ServerError = FailedApiEnvelope;

/** Normalized rejection from the shared axios client (see interceptor). Prefer `.message`; inspect `.cause` for raw JSON. */
export type HttpRejectedError = Error & { cause?: unknown };

/** Flat API error body (e.g. validation_error) returned as axios `response.data` */
export interface FlatApiError {
	code?: string;
	message?: string;
	http_status_code?: number;
}

/** True when the shared axios client rejected a 404 (e.g. DELETE with no saved setting row). */
export function isHttpNotFoundError(error: unknown): boolean {
	if (!(error instanceof Error)) return false;

	const cause = (error as HttpRejectedError).cause;
	if (cause && typeof cause === 'object') {
		const status = (cause as FlatApiError).http_status_code;
		if (status === 404) return true;
	}

	const message = error.message.toLowerCase();
	return message.includes('not found') || /\b404\b/.test(error.message);
}

/** Extracts the HTTP status code the shared axios client attached to a rejected error, if any. */
export function getHttpStatus(error: unknown): number | undefined {
	if (!(error instanceof Error)) return undefined;
	const cause = (error as HttpRejectedError).cause;
	if (cause && typeof cause === 'object') {
		return (cause as FlatApiError).http_status_code;
	}
	return undefined;
}

/** True when the shared axios client rejected a 403 (e.g. a super_admin API key, not a user session). */
export function isHttpForbiddenError(error: unknown): boolean {
	if (getHttpStatus(error) === 403) return true;
	if (!(error instanceof Error)) return false;
	return /\b403\b/.test(error.message);
}

function pickMessage(value: unknown): string | undefined {
	if (typeof value === 'string' && value.trim()) {
		return value.trim();
	}
	if (Array.isArray(value) && value.length > 0) {
		const parts = value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).filter(Boolean);
		if (parts.length) return parts.join(' ');
	}
	return undefined;
}

/** Parses API error bodies; used only by the axios client — callers should read {@link Error.message}. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
	if (typeof error === 'string') {
		const trimmed = error.trim();
		if (trimmed.startsWith('{')) {
			try {
				const parsed = JSON.parse(trimmed) as Record<string, unknown>;
				const fromJson =
					pickMessage(parsed.message) ||
					pickMessage(parsed.detail) ||
					(parsed.error && typeof parsed.error === 'object' && parsed.error !== null
						? pickMessage((parsed.error as { message?: unknown }).message)
						: undefined);
				if (fromJson) return fromJson;
			} catch {
				/* use raw string */
			}
		}
		if (trimmed) return trimmed;
	}
	if (error instanceof Error && error.message) {
		return error.message;
	}
	if (error && typeof error === 'object') {
		const e = error as Record<string, unknown>;
		const nested = e.error;
		if (nested && typeof nested === 'object' && nested !== null) {
			const msg = pickMessage((nested as { message?: unknown }).message);
			if (msg) return msg;
		}
		const fromTop = pickMessage(e.message) || pickMessage(e.detail);
		if (fromTop) return fromTop;
	}
	return fallback;
}
