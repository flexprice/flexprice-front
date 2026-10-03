import { describe, expect, it } from 'vitest';
import { dayHeading, dayStart } from './time';

const now = new Date(2026, 9, 3, 15, 0); // Oct 3 2026, local

describe('time', () => {
	it('labels today and yesterday', () => {
		expect(dayHeading(new Date(2026, 9, 3, 1, 0).toISOString(), now).kind).toBe('today');
		expect(dayHeading(new Date(2026, 9, 2, 23, 0).toISOString(), now).kind).toBe('yesterday');
	});
	it('labels older days with a date, and adds the year only for other years', () => {
		const older = dayHeading(new Date(2026, 8, 28, 9, 0).toISOString(), now);
		expect(older.kind).toBe('date');
		expect(older.date).not.toMatch(/2026/);
		expect(dayHeading(new Date(2025, 11, 31, 9, 0).toISOString(), now).date).toMatch(/2025/);
	});
	it('groups two times on the same local day together', () => {
		expect(dayStart(new Date(2026, 9, 3, 0, 5).toISOString())).toBe(dayStart(new Date(2026, 9, 3, 23, 55).toISOString()));
	});
});
