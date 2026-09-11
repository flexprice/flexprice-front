import { describe, expect, it } from 'vitest';
import { decimalAmountToPercentage, percentageToDecimalAmount } from './percentage_price_helpers';

/**
 * The invariant behind the UpdatePriceDialog CUSTOM-price fix.
 *
 * The dialog seeds its amount field with `decimalAmountToPercentage` and saves with
 * `percentageToDecimalAmount`. The CUSTOM branch used to skip the seeding conversion while the
 * save path still applied its half, so every open/save cycle divided the amount again — a stored
 * 0.025 opened as "0.025%" and came back as 0.00025. Pinning the round trip here keeps the two
 * halves symmetric; if either side is dropped again, this fails instead of silently corrupting
 * a price.
 */
describe('percentage amount round trip', () => {
	const storedAmounts = ['0.025', '0.05', '1', '0.0001', '100', '0'];

	it.each(storedAmounts)('stored %s survives display -> save unchanged', (stored) => {
		expect(percentageToDecimalAmount(decimalAmountToPercentage(stored))).toBe(stored);
	});

	it('renders a stored decimal as its percentage for display', () => {
		expect(decimalAmountToPercentage('0.025')).toBe('2.5');
		expect(decimalAmountToPercentage('0.05')).toBe('5');
	});

	it('stores a typed percentage back as its decimal', () => {
		expect(percentageToDecimalAmount('2.5')).toBe('0.025');
		expect(percentageToDecimalAmount('5')).toBe('0.05');
	});

	it('leaves an empty value alone in both directions', () => {
		expect(decimalAmountToPercentage('')).toBe('');
		expect(percentageToDecimalAmount('')).toBe('');
	});

	it('applying only one half is what corrupted the amount', () => {
		// The pre-fix CUSTOM path: seeded raw, saved converted.
		const stored = '0.025';
		const seededRaw = stored;
		expect(percentageToDecimalAmount(seededRaw)).toBe('0.00025');
		expect(percentageToDecimalAmount(seededRaw)).not.toBe(stored);
	});
});
