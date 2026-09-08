import { describe, expect, it } from 'vitest';
import { PRICE_TYPE } from '@/models/Price';
import type { Price } from '@/models/Price';
import type { OverrideLineItemRequest } from '@/types/dto/Subscription';
import { getLineItemOverrides } from '@/utils/common/price_override_helpers';
import {
	formatAddonQuantityDisplay,
	getDefaultFixedPriceQuantity,
	getResolvedFixedPriceQuantity,
	sanitizeAddonOverrideLineItemsForApi,
	sumFixedAddonRecurringTotal,
} from './addonQuantity';

const makePrice = (overrides: Partial<Price> & Pick<Price, 'id' | 'type'>): Price =>
	({
		amount: '10',
		min_quantity: undefined,
		...overrides,
	}) as Price;

describe('getDefaultFixedPriceQuantity', () => {
	it('uses min_quantity when the FIXED price has one', () => {
		expect(getDefaultFixedPriceQuantity(makePrice({ id: 'p1', type: PRICE_TYPE.FIXED, min_quantity: 3 }))).toBe(3);
	});

	it('defaults FIXED prices without min_quantity to 1', () => {
		expect(getDefaultFixedPriceQuantity(makePrice({ id: 'p1', type: PRICE_TYPE.FIXED }))).toBe(1);
	});

	it('returns 0 for USAGE prices so quantity is never sent', () => {
		expect(getDefaultFixedPriceQuantity(makePrice({ id: 'p1', type: PRICE_TYPE.USAGE, min_quantity: 5 }))).toBe(0);
	});
});

describe('getResolvedFixedPriceQuantity', () => {
	const fixed = makePrice({ id: 'p1', type: PRICE_TYPE.FIXED, min_quantity: 2 });

	it('prefers an explicit numeric override, including zero', () => {
		expect(getResolvedFixedPriceQuantity(fixed, 5)).toBe(5);
		expect(getResolvedFixedPriceQuantity(fixed, 0)).toBe(0);
	});

	it('parses a decimal-string override', () => {
		expect(getResolvedFixedPriceQuantity(fixed, '7')).toBe(7);
	});

	it('falls back to min_quantity when the override is missing or invalid', () => {
		expect(getResolvedFixedPriceQuantity(fixed, undefined)).toBe(2);
		expect(getResolvedFixedPriceQuantity(fixed, 'abc')).toBe(2);
	});

	it('returns 0 for USAGE even when an override is present', () => {
		const usage = makePrice({ id: 'p1', type: PRICE_TYPE.USAGE });
		expect(getResolvedFixedPriceQuantity(usage, 4)).toBe(0);
	});
});

describe('formatAddonQuantityDisplay', () => {
	it('shows the override quantity for a single FIXED price', () => {
		const prices = [makePrice({ id: 'price_fixed', type: PRICE_TYPE.FIXED })];
		expect(formatAddonQuantityDisplay(prices, [{ price_id: 'price_fixed', quantity: '5' }], 'pay as you go')).toBe('5');
	});

	it('prefills min_quantity when quantity is omitted', () => {
		const prices = [makePrice({ id: 'price_fixed', type: PRICE_TYPE.FIXED, min_quantity: 3 })];
		expect(formatAddonQuantityDisplay(prices, [], 'pay as you go')).toBe('3');
	});

	it('hides quantity for USAGE-only addons', () => {
		const prices = [makePrice({ id: 'price_usage', type: PRICE_TYPE.USAGE })];
		expect(formatAddonQuantityDisplay(prices, [{ price_id: 'price_usage', quantity: '5' }], 'pay as you go')).toBe('pay as you go');
	});

	it('joins distinct FIXED quantities', () => {
		const prices = [makePrice({ id: 'a', type: PRICE_TYPE.FIXED }), makePrice({ id: 'b', type: PRICE_TYPE.FIXED, min_quantity: 2 })];
		expect(
			formatAddonQuantityDisplay(
				prices,
				[
					{ price_id: 'a', quantity: '5' },
					{ price_id: 'b', quantity: '2' },
				],
				'pay as you go',
			),
		).toBe('5, 2');
	});
});

describe('sumFixedAddonRecurringTotal', () => {
	it('multiplies unit amount by overridden quantity', () => {
		const prices = [
			makePrice({ id: 'fixed-1', type: PRICE_TYPE.FIXED, amount: '10' }),
			makePrice({ id: 'usage-1', type: PRICE_TYPE.USAGE, amount: '99' }),
		];

		expect(sumFixedAddonRecurringTotal(prices, { 'fixed-1': { quantity: '5' } })).toBe(50);
	});

	it('uses min_quantity when quantity is omitted', () => {
		const prices = [makePrice({ id: 'fixed-1', type: PRICE_TYPE.FIXED, amount: '4', min_quantity: 3 })];

		expect(sumFixedAddonRecurringTotal(prices, {})).toBe(12);
	});

	it('uses an amount override when present', () => {
		const prices = [makePrice({ id: 'fixed-1', type: PRICE_TYPE.FIXED, amount: '10' })];

		expect(sumFixedAddonRecurringTotal(prices, { 'fixed-1': { amount: 8, quantity: 2 } })).toBe(16);
	});
});

describe('sanitizeAddonOverrideLineItemsForApi', () => {
	const fixed = makePrice({ id: 'price_fixed', type: PRICE_TYPE.FIXED });
	const usage = makePrice({ id: 'price_usage', type: PRICE_TYPE.USAGE });

	it('stringifies FIXED quantity and keeps the catalogue price_id', () => {
		const items: OverrideLineItemRequest[] = [{ price_id: 'price_fixed', quantity: 5 }];

		expect(sanitizeAddonOverrideLineItemsForApi(items, [fixed])).toEqual([{ price_id: 'price_fixed', quantity: '5' }]);
	});

	it('keeps quantity 0 for FIXED prices', () => {
		const items: OverrideLineItemRequest[] = [{ price_id: 'price_fixed', quantity: 0 }];

		expect(sanitizeAddonOverrideLineItemsForApi(items, [fixed])).toEqual([{ price_id: 'price_fixed', quantity: '0' }]);
	});

	it('drops quantity on USAGE prices', () => {
		const items: OverrideLineItemRequest[] = [{ price_id: 'price_usage', quantity: 3 }];

		expect(sanitizeAddonOverrideLineItemsForApi(items, [usage])).toBeUndefined();
	});

	it('keeps a USAGE override that still has another field after quantity is stripped', () => {
		const items: OverrideLineItemRequest[] = [{ price_id: 'price_usage', quantity: 3, amount: 9 }];

		expect(sanitizeAddonOverrideLineItemsForApi(items, [usage])).toEqual([{ price_id: 'price_usage', amount: 9 }]);
	});

	it('keeps the first entry when the same price_id is duplicated', () => {
		const items: OverrideLineItemRequest[] = [
			{ price_id: 'price_fixed', quantity: 2 },
			{ price_id: 'price_fixed', quantity: 9 },
		];

		expect(sanitizeAddonOverrideLineItemsForApi(items, [fixed])).toEqual([{ price_id: 'price_fixed', quantity: '2' }]);
	});

	it('returns undefined when there are no overrides', () => {
		expect(sanitizeAddonOverrideLineItemsForApi(undefined, [fixed])).toBeUndefined();
		expect(sanitizeAddonOverrideLineItemsForApi([], [fixed])).toBeUndefined();
	});

	it('maps create-sub quantity through getLineItemOverrides into addons[].override_line_items', () => {
		const items = getLineItemOverrides([fixed], {
			price_fixed: { price_id: 'price_fixed', quantity: 5 },
		});

		expect(sanitizeAddonOverrideLineItemsForApi(items, [fixed])).toEqual([{ price_id: 'price_fixed', quantity: '5' }]);
	});
});
