export interface FxWindow {
	start_date?: string;
	end_date?: string;
}

/** Half-open [start, end) windows; a missing start is −∞ and a missing end is +∞. */
export const windowsOverlap = (a: FxWindow, b: FxWindow): boolean => {
	const time = (value?: string) => (value ? new Date(value).getTime() : undefined);
	const aStart = time(a.start_date);
	const aEnd = time(a.end_date);
	const bStart = time(b.start_date);
	const bEnd = time(b.end_date);
	if (aStart !== undefined && bEnd !== undefined && aStart >= bEnd) return false;
	if (bStart !== undefined && aEnd !== undefined && bStart >= aEnd) return false;
	return true;
};
