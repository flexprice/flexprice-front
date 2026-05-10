import { describe, it, expect, vi } from 'vitest';
import { createQueryConfig, QUERY_PRESETS } from './queryConfig';

describe('QUERY_PRESETS', () => {
	it('REALTIME has staleTime of 0', () => {
		expect(QUERY_PRESETS.REALTIME.staleTime).toBe(0);
	});

	it('REALTIME has gcTime of 60 seconds', () => {
		expect(QUERY_PRESETS.REALTIME.gcTime).toBe(60_000);
	});

	it('DEFAULT has staleTime of 5 minutes', () => {
		expect(QUERY_PRESETS.DEFAULT.staleTime).toBe(5 * 60_000);
	});

	it('STATIC has staleTime of 30 minutes (1800000ms)', () => {
		expect(QUERY_PRESETS.STATIC.staleTime).toBe(1_800_000);
	});

	it('STATIC has gcTime of 60 minutes', () => {
		expect(QUERY_PRESETS.STATIC.gcTime).toBe(60 * 60_000);
	});
});

describe('createQueryConfig', () => {
	const mockFn = vi.fn(() => Promise.resolve([]));

	it('returns the provided queryFn', () => {
		const config = createQueryConfig(mockFn);
		expect(config.queryFn).toBe(mockFn);
	});

	it('defaults to DEFAULT preset', () => {
		const config = createQueryConfig(mockFn);
		expect(config.staleTime).toBe(QUERY_PRESETS.DEFAULT.staleTime);
		expect(config.gcTime).toBe(QUERY_PRESETS.DEFAULT.gcTime);
	});

	it('uses REALTIME preset when specified', () => {
		const config = createQueryConfig(mockFn, 'REALTIME');
		expect(config.staleTime).toBe(0);
	});

	it('uses STATIC preset when specified', () => {
		const config = createQueryConfig(mockFn, 'STATIC');
		expect(config.staleTime).toBe(1_800_000);
	});

	it('applies overrides over preset values', () => {
		const config = createQueryConfig(mockFn, 'DEFAULT', { staleTime: 999 });
		expect(config.staleTime).toBe(999);
		// gcTime should still be from preset
		expect(config.gcTime).toBe(QUERY_PRESETS.DEFAULT.gcTime);
	});

	it('override does not affect other preset values', () => {
		const config = createQueryConfig(mockFn, 'STATIC', { gcTime: 1000 });
		expect(config.staleTime).toBe(QUERY_PRESETS.STATIC.staleTime);
		expect(config.gcTime).toBe(1000);
	});
});
