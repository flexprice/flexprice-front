import { describe, expect, it, vi } from 'vitest';
import { buildSvixPlayIngestUrl, buildSvixPlayInspectorUrl, generateSvixPlayEndpoint } from './svixPlay';

describe('svixPlay', () => {
	it('builds ingest and inspector urls from a token', () => {
		expect(buildSvixPlayIngestUrl('e_abc')).toBe('https://play.svix.com/in/e_abc/');
		expect(buildSvixPlayInspectorUrl('e_abc')).toBe('https://play.svix.com/#e_abc');
	});

	it('parses object token responses', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ token: 'e_obj' }),
		});

		await expect(generateSvixPlayEndpoint(fetchImpl)).resolves.toEqual({
			token: 'e_obj',
			ingestUrl: 'https://play.svix.com/in/e_obj/',
			inspectorUrl: 'https://play.svix.com/#e_obj',
		});
		expect(fetchImpl).toHaveBeenCalledWith('https://api.play.svix.com/api/v1/token/generate/', { method: 'POST' });
	});

	it('parses string token responses', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => 'e_str',
		});

		await expect(generateSvixPlayEndpoint(fetchImpl)).resolves.toMatchObject({ token: 'e_str' });
	});

	it('throws when the request fails', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 });
		await expect(generateSvixPlayEndpoint(fetchImpl)).rejects.toThrow(/failed \(500\)/);
	});

	it('throws when the response body is invalid', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ token: '' }),
		});
		await expect(generateSvixPlayEndpoint(fetchImpl)).rejects.toThrow(/invalid/);
	});
});
