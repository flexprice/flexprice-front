import { describe, expect, it } from 'vitest';
import { PRICE_TYPE } from '@/models/Price';
import type { Price } from '@/models/Price';
import type { OverrideLineItemRequest } from '@/types/dto/Subscription';
import { getLineItemOverrides } from '@/utils/common/price_override_helpers';
import {
	attachedAddonLinesToDisplayInput,
	formatAddonCharges,
	formatAddonQuantityDisplay,
	getDefaultFixedPriceQuantity,
	getResolvedFixedPriceQuantity,
	isAttachedAddonLineActive,
	sanitizeAddonOverrideLineItemsForApi,
	sumFixedAddonRecurringTotal,
	type AttachedAddonChargeLine,
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

describe('formatAddonCharges', () => {
	const labels = { empty: '--', dependsOnUsage: 'Depends on usage' };

	it('formats quantity × unit charge the same way create-sub does', () => {
		const prices = [makePrice({ id: 'fixed-1', type: PRICE_TYPE.FIXED, amount: '100', currency: 'usd' })];

		expect(formatAddonCharges(prices, [{ price_id: 'fixed-1', quantity: '5' }], {}, [], labels)).toBe('$500.00');
	});

	it('returns the usage label when there is no FIXED price', () => {
		const prices = [makePrice({ id: 'usage-1', type: PRICE_TYPE.USAGE, amount: '99', currency: 'usd' })];

		expect(formatAddonCharges(prices, [], {}, [], labels)).toBe('Depends on usage');
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

const now = new Date('2026-09-08T12:00:00Z');
const fixedPrice = makePrice({ id: 'price_fixed', type: PRICE_TYPE.FIXED, amount: '100', currency: 'usd' });

const activeLine: AttachedAddonChargeLine = {
	priceType: PRICE_TYPE.FIXED,
	quantity: 5,
	unitAmount: 100,
	startDate: '2026-01-01T00:00:00Z',
	price: fixedPrice,
};

const upcomingLine: AttachedAddonChargeLine = {
	priceType: PRICE_TYPE.FIXED,
	quantity: 3,
	unitAmount: 100,
	startDate: '2026-10-01T00:00:00Z',
	price: fixedPrice,
};

describe('isAttachedAddonLineActive', () => {
	it('treats a started line without an end date as active', () => {
		expect(isAttachedAddonLineActive(activeLine, now)).toBe(true);
	});

	it('treats a future start date as inactive', () => {
		expect(isAttachedAddonLineActive(upcomingLine, now)).toBe(false);
	});

	it('treats an ended line as inactive', () => {
		expect(isAttachedAddonLineActive({ ...activeLine, endDate: '2026-08-01T00:00:00Z' }, now)).toBe(false);
	});
});

describe('attachedAddonLinesToDisplayInput', () => {
	const labels = { empty: '--', dependsOnUsage: 'Depends on usage' };

	it('maps active lines into the create-sub prices + override_line_items shape', () => {
		const input = attachedAddonLinesToDisplayInput([activeLine, upcomingLine], now);

		expect(input.overrideLineItems).toEqual([{ price_id: 'price_fixed', quantity: 5, amount: 100 }]);
		expect(formatAddonQuantityDisplay(input.prices, input.overrideLineItems, 'pay as you go')).toBe('5');
		expect(formatAddonCharges(input.prices, input.overrideLineItems, {}, [], labels)).toBe('$500.00');
	});

	it('falls back to upcoming FIXED quantity when no line is currently active', () => {
		const input = attachedAddonLinesToDisplayInput([upcomingLine], now);

		expect(input.overrideLineItems).toEqual([{ price_id: 'price_fixed', quantity: 3, amount: 100 }]);
		expect(formatAddonQuantityDisplay(input.prices, input.overrideLineItems, 'pay as you go')).toBe('3');
		expect(formatAddonCharges(input.prices, input.overrideLineItems, {}, [], labels)).toBe('$300.00');
	});

	it('keeps FIXED display when the embedded price is missing type', () => {
		const untypedPrice = { ...fixedPrice, type: undefined } as unknown as typeof fixedPrice;
		const line: AttachedAddonChargeLine = { ...upcomingLine, price: untypedPrice };
		const input = attachedAddonLinesToDisplayInput([line], now);

		expect(formatAddonQuantityDisplay(input.prices, input.overrideLineItems, 'pay as you go')).toBe('3');
		expect(formatAddonCharges(input.prices, input.overrideLineItems, {}, [], labels)).toBe('$300.00');
	});
});
