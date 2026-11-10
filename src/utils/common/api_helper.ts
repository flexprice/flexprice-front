import { EXPAND } from '@/models/expand';

export const generateExpandQueryParams = (expand: EXPAND[]): string => {
	return expand.join(',');
};

// `object` rather than `Record<string, unknown>` so callers can pass their filter interfaces directly.
export const generateQueryParams = (baseUrl: string, params: object): string => {
	const entries = params as Record<string, unknown>;
	const queryParams = Object.keys(entries)
		.filter((key) => key && entries[key] !== undefined && entries[key] !== null)
		.map((key) => {
			const raw = entries[key];
			const value = Array.isArray(raw) ? raw.join(',') : String(raw);
			return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
		})
		.join('&');

	return queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
};
