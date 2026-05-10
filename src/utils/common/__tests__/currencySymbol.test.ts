import { describe, it, expect } from 'vitest';
import { getCurrencySymbol } from '../helper_functions';

describe('getCurrencySymbol', () => {
	it('returns $ for USD', () => {
		expect(getCurrencySymbol('USD')).toBe('$');
	});

	it('returns € for EUR', () => {
		expect(getCurrencySymbol('EUR')).toBe('€');
	});

	it('returns £ for GBP', () => {
		expect(getCurrencySymbol('GBP')).toBe('£');
	});

	it('returns ¥ for JPY', () => {
		expect(getCurrencySymbol('JPY')).toBe('¥');
	});

	it('returns ₹ for INR', () => {
		expect(getCurrencySymbol('INR')).toBe('₹');
	});

	it('handles lowercase currency codes gracefully', () => {
		// Should not throw regardless of case handling
		expect(() => getCurrencySymbol('usd')).not.toThrow();
	});
});
