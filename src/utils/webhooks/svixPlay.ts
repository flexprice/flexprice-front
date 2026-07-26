import { z } from 'zod';

const SVIX_PLAY_TOKEN_URL = 'https://api.play.svix.com/api/v1/token/generate/';

const SvixPlayTokenResponseSchema = z.union([z.object({ token: z.string().min(1) }), z.string().min(1)]);

export function buildSvixPlayIngestUrl(token: string): string {
	return `https://play.svix.com/in/${token}/`;
}

export function buildSvixPlayInspectorUrl(token: string): string {
	return `https://play.svix.com/#${token}`;
}

/**
 * Generates a free Svix Play token and returns the ingest URL + inspector URL.
 * Uses the public Play API (not the Flexprice Axios client).
 */
export async function generateSvixPlayEndpoint(fetchImpl: typeof fetch = fetch): Promise<{
	token: string;
	ingestUrl: string;
	inspectorUrl: string;
}> {
	const response = await fetchImpl(SVIX_PLAY_TOKEN_URL, { method: 'POST' });
	if (!response.ok) {
		throw new Error(`Svix Play token request failed (${response.status})`);
	}

	const raw: unknown = await response.json();
	const parsed = SvixPlayTokenResponseSchema.safeParse(raw);
	if (!parsed.success) {
		throw new Error('Svix Play token response was invalid');
	}

	const token = typeof parsed.data === 'string' ? parsed.data : parsed.data.token;
	return {
		token,
		ingestUrl: buildSvixPlayIngestUrl(token),
		inspectorUrl: buildSvixPlayInspectorUrl(token),
	};
}
