import { describe, expect, it } from 'vitest';
import { formatFxRate, formatRateValue } from './formatFxRate';

describe('formatRateValue', () => {
	it('pads a whole number to two decimals', () => {
		expect(formatRateValue('83')).toBe('83.00');
	});
	it('never rounds extra precision', () => {
		expect(formatRateValue('83.33335')).toBe('83.33335');
	});
});

describe('formatFxRate', () => {
	it('renders one unit of from in to, uppercase codes', () => {
		expect(formatFxRate('usd', 'inr', '83')).toBe('1 USD = 83.00 INR');
	});
});
