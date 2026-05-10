import { describe, it, expect } from 'vitest';
import formatNumber from '../format_number';

describe('formatNumber', () => {
	it('formats a positive integer with 2 decimal places', () => {
		expect(formatNumber(1234, 2)).toBe('1,234.00');
	});

	it('formats a large number with thousands separator', () => {
		expect(formatNumber(1000000, 0)).toBe('1,000,000');
	});

	it('returns "-" for zero', () => {
		// formatNumber returns '-' for falsy values (0 is falsy)
		expect(formatNumber(0, 2)).toBe('-');
	});

	it('formats a negative number', () => {
		expect(formatNumber(-500, 2)).toBe('-500.00');
	});

	it('formats a decimal number with correct precision', () => {
		expect(formatNumber(1234.5678, 2)).toBe('1,234.57');
	});

	it('handles decimals = 0', () => {
		expect(formatNumber(42.9, 0)).toBe('43');
	});

	it('clamps excessively large decimal count to 20', () => {
		// Should not throw; Intl.NumberFormat max is 20
		expect(() => formatNumber(1, 100)).not.toThrow();
	});

	it('handles small decimals', () => {
		expect(formatNumber(0.001, 3)).toBe('0.001');
	});
});
