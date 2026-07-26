import type { EndpointStats } from 'svix';
import type { Svix } from 'svix';

export type ActivityPoint = {
	timestamp: string;
	successful: number;
	failed: number;
};

export type WebhookActivitySummary = {
	successfulAttempts: number;
	failedAttempts: number;
	points: ActivityPoint[];
};

const HOURS = 6;

export function aggregateEndpointStats(stats: Array<Pick<EndpointStats, 'success' | 'fail'>>): {
	successful: number;
	failed: number;
} {
	return stats.reduce(
		(acc, s) => ({
			successful: acc.successful + (s.success ?? 0),
			failed: acc.failed + (s.fail ?? 0),
		}),
		{ successful: 0, failed: 0 },
	);
}

/** Builds [now-hours, now) as consecutive 1-hour windows, oldest first. */
export function buildHourlyWindows(now: Date, hours: number = HOURS): Array<{ start: Date; end: Date; label: string }> {
	const endMs = now.getTime();
	const windows: Array<{ start: Date; end: Date; label: string }> = [];
	for (let i = hours; i >= 1; i -= 1) {
		const end = new Date(endMs - (i - 1) * 60 * 60 * 1000);
		const start = new Date(end.getTime() - 60 * 60 * 1000);
		windows.push({
			start,
			end,
			label: start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
		});
	}
	return windows;
}

export async function fetchWebhookActivity(params: {
	svix: Svix;
	appId: string;
	endpointIds: string[];
	now?: Date;
}): Promise<WebhookActivitySummary> {
	const { svix, appId, endpointIds, now = new Date() } = params;
	if (endpointIds.length === 0) {
		return { successfulAttempts: 0, failedAttempts: 0, points: [] };
	}

	const windows = buildHourlyWindows(now, HOURS);
	const points: ActivityPoint[] = await Promise.all(
		windows.map(async (window) => {
			const stats = await Promise.all(
				endpointIds.map((endpointId) => svix.endpoint.getStats(appId, endpointId, { since: window.start, until: window.end })),
			);
			const { successful, failed } = aggregateEndpointStats(stats);
			return { timestamp: window.label, successful, failed };
		}),
	);

	const successfulAttempts = points.reduce((sum, p) => sum + p.successful, 0);
	const failedAttempts = points.reduce((sum, p) => sum + p.failed, 0);

	return { successfulAttempts, failedAttempts, points };
}
