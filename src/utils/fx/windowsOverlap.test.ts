import { describe, expect, it } from 'vitest';
import { windowsOverlap } from './windowsOverlap';

const d = (day: number) => new Date(Date.UTC(2026, 0, day)).toISOString();

describe('windowsOverlap', () => {
	it('disjoint windows do not overlap', () => {
		expect(windowsOverlap({ start_date: d(1), end_date: d(5) }, { start_date: d(6), end_date: d(9) })).toBe(false);
	});
	it('the end is exclusive, so touching windows do not overlap', () => {
		expect(windowsOverlap({ start_date: d(1), end_date: d(5) }, { start_date: d(5) })).toBe(false);
	});
	it('partial overlap', () => {
		expect(windowsOverlap({ start_date: d(1), end_date: d(6) }, { start_date: d(5), end_date: d(9) })).toBe(true);
	});
	it('an open start overlaps anything that starts before its end', () => {
		expect(windowsOverlap({ end_date: d(4) }, { start_date: d(3) })).toBe(true);
		expect(windowsOverlap({ end_date: d(3) }, { start_date: d(3) })).toBe(false);
	});
});
