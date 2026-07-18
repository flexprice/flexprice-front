import { describe, expect, it } from 'vitest';
import { PRICE_TYPE } from '@/models/Price';
import { getQuantityDisplayForLineItem } from './SubscriptionLineItemTable';

describe('getQuantityDisplayForLineItem', () => {
	it('returns the numeric quantity for a FIXED-type row', () => {
		expect(getQuantityDisplayForLineItem({ price_type: PRICE_TYPE.FIXED, quantity: 5 })).toBe('5');
	});

	it('returns the numeric quantity for a FIXED-type row with quantity 0', () => {
		expect(getQuantityDisplayForLineItem({ price_type: PRICE_TYPE.FIXED, quantity: 0 })).toBe('0');
	});

	it('returns "--" for a USAGE-type row regardless of quantity', () => {
		expect(getQuantityDisplayForLineItem({ price_type: PRICE_TYPE.USAGE, quantity: 3 })).toBe('--');
	});
});
