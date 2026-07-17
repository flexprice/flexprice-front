import { describe, expect, it } from 'vitest';
import { resolveQuantityFromInput } from './SubscriptionPriceTable';

describe('resolveQuantityFromInput', () => {
	it('returns 0 when the input is "0" instead of falling back to minQuantity', () => {
		expect(resolveQuantityFromInput('0', 1)).toBe(0);
	});

	it('parses positive integers', () => {
		expect(resolveQuantityFromInput('5', 1)).toBe(5);
	});

	it('falls back to minQuantity when the input does not parse to a number', () => {
		expect(resolveQuantityFromInput('abc', 3)).toBe(3);
	});

	it('truncates decimal input the same way parseInt does', () => {
		expect(resolveQuantityFromInput('4.9', 1)).toBe(4);
	});
});
