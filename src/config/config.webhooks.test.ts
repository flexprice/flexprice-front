import { describe, it, expect } from 'vitest';
import { resolveWebhookProvider, WEBHOOK_PROVIDER } from './config';

describe('resolveWebhookProvider', () => {
	it('returns Svix when provider is unset and svixUrl is empty', () => {
		expect(resolveWebhookProvider(undefined, '')).toBe(WEBHOOK_PROVIDER.Svix);
		expect(resolveWebhookProvider('', undefined)).toBe(WEBHOOK_PROVIDER.Svix);
	});

	it('returns Custom when VITE_WEBHOOK_PROVIDER is flexprice', () => {
		expect(resolveWebhookProvider('flexprice', '')).toBe(WEBHOOK_PROVIDER.Custom);
		expect(resolveWebhookProvider('  Flexprice  ', undefined)).toBe(WEBHOOK_PROVIDER.Custom);
	});

	it('returns Custom when VITE_SVIX_URL is set and provider is empty', () => {
		expect(resolveWebhookProvider(undefined, 'https://svix.example.com')).toBe(WEBHOOK_PROVIDER.Custom);
		expect(resolveWebhookProvider('', '  https://svix.example.com  ')).toBe(WEBHOOK_PROVIDER.Custom);
	});

	it('returns Svix when provider is explicitly svix even if svixUrl is set', () => {
		expect(resolveWebhookProvider('svix', 'https://svix.example.com')).toBe(WEBHOOK_PROVIDER.Svix);
	});

	it('returns Custom when both flexprice provider and svixUrl are set', () => {
		expect(resolveWebhookProvider('flexprice', 'https://svix.example.com')).toBe(WEBHOOK_PROVIDER.Custom);
	});

	it('returns Svix for unknown provider values when svixUrl is empty', () => {
		expect(resolveWebhookProvider('other', '')).toBe(WEBHOOK_PROVIDER.Svix);
	});

	it('returns Svix when provider is explicitly svix and svixUrl is empty', () => {
		expect(resolveWebhookProvider('svix', '')).toBe(WEBHOOK_PROVIDER.Svix);
	});
});
