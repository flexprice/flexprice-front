import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { formatBillingPeriod, formatBillingPeriodDate, formatBillingPeriodLong, toInclusivePeriodEnd } from './format_date';

const IST = 'Asia/Kolkata';
const previousTz = process.env.TZ;

// Pinned for the whole file, not per-describe: several cases below assert how a UTC instant
// lands on the viewer's *local* calendar, so they only mean anything against a known zone.
// CI runs in UTC, so a block left unpinned silently asserts something different there.
beforeAll(() => {
	process.env.TZ = IST;
	// Fail fast if the runner ignores mid-process TZ changes.
	expect(new Date().getTimezoneOffset()).toBe(-330);
});

afterAll(() => {
	if (previousTz === undefined) {
		delete process.env.TZ;
	} else {
		process.env.TZ = previousTz;
	}
});

describe('formatBillingPeriodDate / formatBillingPeriod (Asia/Kolkata)', () => {
	test('utc zone uses the UTC calendar day for IST midnight instants', () => {
		// 31 Jul 00:00 IST == 30 Jul 18:30 UTC
		expect(formatBillingPeriodDate('2025-07-30T18:30:00.000Z', 'utc')).toBe('30 Jul 2025');
	});

	test('local zone uses the local calendar day for IST midnight instants', () => {
		expect(formatBillingPeriodDate('2025-07-30T18:30:00.000Z', 'local')).toBe('31 Jul 2025');
		expect(formatBillingPeriodDate('2025-07-30T18:30:00.000Z', 'utc')).toBe('30 Jul 2025');
	});

	// Both shapes below are real: invoice periods on the backend are anchored either to UTC
	// midnight (`…T00:00:00Z`) or to IST midnight (`…T18:30:00Z`). The exclusive end must resolve
	// to the same last day for either, and regardless of where the viewer sits.
	test('quarterly period ending at UTC midnight shows the last day of the quarter', () => {
		// API: 1 Jun 00:00 UTC → 1 Sep 00:00 UTC (exclusive). Jun–Aug quarter.
		expect(formatBillingPeriod('2026-06-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z')).toBe('1 Jun 2026 - 31 Aug 2026');
	});

	test('quarterly period ending at IST midnight shows the last day of the quarter', () => {
		// API: 1 Jun 00:00 IST → 1 Sep 00:00 IST (exclusive).
		expect(formatBillingPeriod('2026-05-31T18:30:00.000Z', '2026-08-31T18:30:00.000Z')).toBe('1 Jun 2026 - 31 Aug 2026');
	});

	test('monthly period ending at UTC midnight shows the last day of the month', () => {
		expect(formatBillingPeriod('2025-07-01T00:00:00.000Z', '2025-08-01T00:00:00.000Z')).toBe('1 Jul 2025 - 31 Jul 2025');
	});

	test('mid-month anchored period keeps the day before the next anchor', () => {
		// Subscription-anchored periods are the common case on the backend: 29th to 29th.
		expect(formatBillingPeriod('2026-07-29T00:00:00.000Z', '2026-08-29T00:00:00.000Z')).toBe('29 Jul 2026 - 28 Aug 2026');
	});

	test('a period that does not end at midnight is left on its own day', () => {
		// Most invoices anchor to the subscription's start instant, not to a calendar boundary.
		expect(formatBillingPeriod('2026-09-22T12:06:39.618Z', '2026-09-22T13:52:19.714Z')).toBe('22 Sep 2026 - 22 Sep 2026');
	});
});

describe('formatBillingPeriodLong', () => {
	test('renders the full date range with an inclusive end', () => {
		expect(formatBillingPeriodLong('2026-06-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z')).toBe('Jun 1, 2026 – Aug 31, 2026');
	});

	test('reports an unparseable bound instead of rendering a wrong date', () => {
		expect(formatBillingPeriodLong('2026-06-01T00:00:00.000Z', 'not-a-date')).toBe('Invalid Date');
	});
});

describe('toInclusivePeriodEnd', () => {
	test('steps an exclusive end back to the final second of the period', () => {
		expect(toInclusivePeriodEnd('2026-06-01T00:00:00.000Z').toISOString()).toBe('2026-05-31T23:59:59.000Z');
	});

	test('the shifted instant only reads as the previous day in UTC, not in IST', () => {
		// Why formatPeriodEndDate renders in UTC: locally this instant is still 1 Jun in IST.
		const shifted = toInclusivePeriodEnd('2026-06-01T00:00:00.000Z');
		expect(formatBillingPeriodDate(shifted, 'utc')).toBe('31 May 2026');
		expect(formatBillingPeriodDate(shifted, 'local')).toBe('1 Jun 2026');
	});

	test('accepts a Date and leaves the input untouched', () => {
		const end = new Date('2026-06-01T00:00:00.000Z');
		expect(toInclusivePeriodEnd(end).toISOString()).toBe('2026-05-31T23:59:59.000Z');
		expect(end.toISOString()).toBe('2026-06-01T00:00:00.000Z');
	});

	test('passes an unparseable date through instead of inventing one', () => {
		expect(isNaN(toInclusivePeriodEnd('not-a-date').getTime())).toBe(true);
	});
});
