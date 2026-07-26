import { describe, expect, it, vi } from 'vitest';
import { aggregateEndpointStats, buildHourlyWindows, fetchWebhookActivity } from './activityStats';

describe('activityStats', () => {
	it('sums success and fail across endpoints', () => {
		expect(
			aggregateEndpointStats([
				{ success: 2, fail: 1 },
				{ success: 3, fail: 0 },
			]),
		).toEqual({ successful: 5, failed: 1 });
	});

	it('builds 6 consecutive hourly windows ending at now', () => {
		const now = new Date('2026-07-26T18:00:00.000Z');
		const windows = buildHourlyWindows(now, 6);
		expect(windows).toHaveLength(6);
		expect(windows[0].start.toISOString()).toBe('2026-07-26T12:00:00.000Z');
		expect(windows[0].end.toISOString()).toBe('2026-07-26T13:00:00.000Z');
		expect(windows[5].start.toISOString()).toBe('2026-07-26T17:00:00.000Z');
		expect(windows[5].end.toISOString()).toBe('2026-07-26T18:00:00.000Z');
	});

	it('aggregates hourly getStats into activity summary', async () => {
		const getStats = vi.fn().mockResolvedValue({ success: 1, fail: 2, pending: 0, sending: 0, canceled: 0 });
		const svix = { endpoint: { getStats } } as never;

		const summary = await fetchWebhookActivity({
			svix,
			appId: 'app_1',
			endpointIds: ['ep_1', 'ep_2'],
			now: new Date('2026-07-26T18:00:00.000Z'),
		});

		// 6 hours × 2 endpoints
		expect(getStats).toHaveBeenCalledTimes(12);
		expect(summary.successfulAttempts).toBe(12);
		expect(summary.failedAttempts).toBe(24);
		expect(summary.points).toHaveLength(6);
		expect(summary.points[0]).toMatchObject({ successful: 2, failed: 4 });
	});

	it('returns empty summary when there are no endpoints', async () => {
		const getStats = vi.fn();
		const svix = { endpoint: { getStats } } as never;
		await expect(fetchWebhookActivity({ svix, appId: 'app_1', endpointIds: [] })).resolves.toEqual({
			successfulAttempts: 0,
			failedAttempts: 0,
			points: [],
		});
		expect(getStats).not.toHaveBeenCalled();
	});
});
