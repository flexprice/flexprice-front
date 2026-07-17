import { describe, expect, it } from 'vitest';
import { isValidNonNegativeQuantityString } from './quantityValidation';

describe('isValidNonNegativeQuantityString', () => {
	it('accepts zero', () => {
		expect(isValidNonNegativeQuantityString('0')).toBe(true);
		expect(isValidNonNegativeQuantityString('0.00')).toBe(true);
	});

	it('accepts positive integers and decimals', () => {
		expect(isValidNonNegativeQuantityString('5')).toBe(true);
		expect(isValidNonNegativeQuantityString('2.5')).toBe(true);
	});

	it('accepts comma-separated thousands', () => {
		expect(isValidNonNegativeQuantityString('1,000')).toBe(true);
	});

	it('trims surrounding whitespace', () => {
		expect(isValidNonNegativeQuantityString('  7  ')).toBe(true);
	});

	it('rejects negative numbers', () => {
		expect(isValidNonNegativeQuantityString('-1')).toBe(false);
		expect(isValidNonNegativeQuantityString('-0.5')).toBe(false);
	});

	it('rejects empty or whitespace-only input', () => {
		expect(isValidNonNegativeQuantityString('')).toBe(false);
		expect(isValidNonNegativeQuantityString('   ')).toBe(false);
	});

	it('rejects non-numeric input', () => {
		expect(isValidNonNegativeQuantityString('abc')).toBe(false);
		expect(isValidNonNegativeQuantityString('NaN')).toBe(false);
		expect(isValidNonNegativeQuantityString('Infinity')).toBe(false);
	});
});
