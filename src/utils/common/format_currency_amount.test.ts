import { describe, expect, it } from 'vitest';
import { formatCurrencyAmount } from './format_currency_amount';

describe('formatCurrencyAmount', () => {
	it('renders zero as 0.00 instead of dash', () => {
		expect(formatCurrencyAmount(0, 'usd')).toBe('$0.00');
	});

	it('renders null without currency as dash', () => {
		expect(formatCurrencyAmount(null, 'usd')).toBe('-');
		expect(formatCurrencyAmount(10, undefined)).toBe('-');
	});

	it('renders negative amounts with sign when requested', () => {
		expect(formatCurrencyAmount(-12.5, 'usd', { showSign: true })).toBe('-$12.50');
	});
});
