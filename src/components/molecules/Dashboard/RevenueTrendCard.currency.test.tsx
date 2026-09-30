import { describe, expect, it } from 'vitest';
import { formatDashboardRevenueAmount } from './RevenueTrendCard';

/**
 * A tenant can define a currency code that Intl rejects — getCustomCurrencyErrorKey only checks
 * length, so `cr1` saves fine. This formatter runs inside the revenue card's render map, so an
 * unguarded RangeError took the whole card down rather than degrading one cell.
 */
describe('formatDashboardRevenueAmount', () => {
	it('formats a normal ISO currency', () => {
		expect(formatDashboardRevenueAmount(1234, 'USD', 'N/A')).toContain('1,234');
	});

	it('returns the not-available label for zero', () => {
		expect(formatDashboardRevenueAmount(0, 'USD', 'N/A')).toBe('N/A');
	});

	it('does not throw on a currency code Intl rejects', () => {
		expect(() => formatDashboardRevenueAmount(1234, 'cr1', 'N/A')).not.toThrow();
		// Fallback stays readable: symbol, space, grouped digits — not "cr11234".
		expect(formatDashboardRevenueAmount(1234, 'cr1', 'N/A')).toBe('cr1 1,234');
	});

	it('does not throw on an empty or malformed code', () => {
		expect(() => formatDashboardRevenueAmount(10, '', 'N/A')).not.toThrow();
		expect(() => formatDashboardRevenueAmount(10, 'TOOLONG', 'N/A')).not.toThrow();
	});

	it('keeps a negative amount legible in the fallback', () => {
		expect(formatDashboardRevenueAmount(-1234, 'cr1', 'N/A')).toBe('cr1 -1,234');
	});
});
