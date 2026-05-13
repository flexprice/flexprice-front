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
