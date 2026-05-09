import { describe, expect, it } from 'vitest';
import { calculateTieredPrice, formatCurrency, getStatusLabel, getStatusTone, shallowFingerprint } from './utils';
import { createQueryClient, createQueryConfig, QUERY_PRESETS, QUERY_TIMES } from './queryConfig';

describe('storybook-system utilities', () => {
	it('formats currency without noisy decimals for whole amounts', () => {
		expect(formatCurrency(4200)).toBe('$4,200');
		expect(formatCurrency(99.95)).toBe('$99.95');
	});

	it('maps billing statuses to human labels and tones', () => {
		expect(getStatusLabel('past_due')).toBe('Past due');
		expect(getStatusTone('overdue')).toBe('warning');
		expect(getStatusTone('paid')).toBe('success');
	});

	it('calculates graduated tier pricing across ranges', () => {
		const total = calculateTieredPrice(150, [
			{ from: 1, to: 100, unitPrice: 1 },
			{ from: 101, unitPrice: 0.5 },
		]);

		expect(total).toBe(125);
	});

	it('creates stable shallow fingerprints without serialising the full filter object', () => {
		expect(shallowFingerprint({ status: 'paid', empty: '', tags: [] })).toMatch(/^1-/);
		expect(shallowFingerprint({ empty: '', tags: [] })).toMatch(/^0-/);
	});

	it('applies query cache presets with declarative overrides', () => {
		expect(createQueryConfig('DEFAULT')).toEqual(QUERY_PRESETS.DEFAULT);
		expect(createQueryConfig('STATIC', { staleTime: 0 })).toEqual({
			...QUERY_PRESETS.STATIC,
			staleTime: 0,
		});
	});

	it('creates a query client with global cache defaults and local overrides', () => {
		const defaultClient = createQueryClient();
		expect(defaultClient.getDefaultOptions().queries?.staleTime).toBe(QUERY_TIMES.DEFAULT_STALE);
		expect(defaultClient.getDefaultOptions().queries?.gcTime).toBe(QUERY_TIMES.DEFAULT_GC);

		const realtimeClient = createQueryClient({
			defaultOptions: {
				queries: createQueryConfig('REALTIME'),
			},
		});
		expect(realtimeClient.getDefaultOptions().queries?.staleTime).toBe(0);
		expect(realtimeClient.getDefaultOptions().queries?.gcTime).toBe(QUERY_TIMES.DEFAULT_GC);
	});
});
