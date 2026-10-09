export type OverrideStatus = 'active' | 'scheduled' | 'expired';

/** Status of a [start, end) window relative to `now`; missing bounds are open. */
export const getOverrideStatus = (start?: string | null, end?: string | null, now: Date = new Date()): OverrideStatus => {
	if (start && new Date(start).getTime() > now.getTime()) return 'scheduled';
	if (end && new Date(end).getTime() <= now.getTime()) return 'expired';
	return 'active';
};
