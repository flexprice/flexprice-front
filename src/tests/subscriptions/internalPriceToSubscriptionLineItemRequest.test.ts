import { describe, expect, it } from 'vitest';
import { BILLING_MODEL, BILLING_PERIOD, PRICE_TYPE, PRICE_UNIT_TYPE, TIER_MODE } from '@/models/Price';
import { INVOICE_CADENCE } from '@/models/Invoice';
import type { InternalPrice } from '@/components/organisms/PlanForm/SetupChargesSection';
import {
	internalPriceToSubscriptionLineItemRequest,
	subscriptionLineItemToInternalPrice,
	type AddedSubscriptionLineItem,
} from '@/utils/subscription/internalPriceToSubscriptionLineItemRequest';
import { PriceInternalState } from '@/components/organisms/PlanForm/priceFormConstants';

describe('internalPriceToSubscriptionLineItemRequest fixed charges', () => {
	it('includes transform_quantity for package fixed charges', () => {
		const request = internalPriceToSubscriptionLineItemRequest({
			type: PRICE_TYPE.FIXED,
			billing_model: BILLING_MODEL.PACKAGE,
			billing_period: BILLING_PERIOD.MONTHLY,
			invoice_cadence: INVOICE_CADENCE.ARREAR,
			currency: 'usd',
			amount: '25',
			transform_quantity: { divide_by: 100 },
			min_quantity: 1,
		});

		expect(request.price?.billing_model).toBe(BILLING_MODEL.PACKAGE);
		expect(request.price?.amount).toBe('25');
		expect(request.price?.transform_quantity).toEqual({ divide_by: 100 });
		expect(request.price?.currency).toBe('usd');
	});

	it('includes tiers and tier_mode for tiered fixed charges', () => {
		const request = internalPriceToSubscriptionLineItemRequest({
			type: PRICE_TYPE.FIXED,
			billing_model: BILLING_MODEL.TIERED,
			billing_period: BILLING_PERIOD.MONTHLY,
			invoice_cadence: INVOICE_CADENCE.ARREAR,
			currency: 'usd',
			tier_mode: TIER_MODE.SLAB,
			tiers: [
				{ from: 0, up_to: 10, unit_amount: '5', flat_amount: '0' },
				{ from: 10, up_to: null, unit_amount: '3', flat_amount: '0' },
			] as unknown as InternalPrice['tiers'],
			min_quantity: 1,
		});

		expect(request.price?.billing_model).toBe(BILLING_MODEL.TIERED);
		expect(request.price?.tier_mode).toBe(TIER_MODE.SLAB);
		expect(request.price?.tiers).toEqual([
			{ up_to: 10, unit_amount: '5', flat_amount: '0' },
			{ up_to: null, unit_amount: '3', flat_amount: '0' },
		]);
		expect(request.price?.amount).toBeUndefined();
	});

	it('defaults tier_mode to VOLUME when tiers are present but tier_mode is omitted', () => {
		const request = internalPriceToSubscriptionLineItemRequest({
			type: PRICE_TYPE.FIXED,
			billing_model: BILLING_MODEL.TIERED,
			billing_period: BILLING_PERIOD.MONTHLY,
			invoice_cadence: INVOICE_CADENCE.ARREAR,
			currency: 'usd',
			tiers: [{ up_to: 5, unit_amount: '10', flat_amount: '0' }],
			min_quantity: 1,
		});

		expect(request.price?.tier_mode).toBe(TIER_MODE.VOLUME);
		expect(request.price?.tiers).toHaveLength(1);
	});

	it('stores custom unit package pricing in price_unit_config', () => {
		const request = internalPriceToSubscriptionLineItemRequest({
			type: PRICE_TYPE.FIXED,
			price_unit_type: PRICE_UNIT_TYPE.CUSTOM,
			billing_model: BILLING_MODEL.PACKAGE,
			billing_period: BILLING_PERIOD.MONTHLY,
			invoice_cadence: INVOICE_CADENCE.ARREAR,
			currency: 'usd',
			price_unit_config: { price_unit: 'TOK', amount: '12' },
			transform_quantity: { divide_by: 50 },
			min_quantity: 1,
		});

		expect(request.price?.price_unit_config).toEqual({ price_unit: 'TOK', amount: '12' });
		expect(request.price?.transform_quantity).toEqual({ divide_by: 50 });
		expect(request.price?.amount).toBeUndefined();
		expect(request.price?.tiers).toBeUndefined();
	});
});

describe('subscriptionLineItemToInternalPrice fixed charges', () => {
	it('round-trips package and tiered fixed charge fields', () => {
		const lineItem: AddedSubscriptionLineItem = {
			tempId: 'sub_1',
			display_name: 'Seats',
			quantity: 2,
			price: {
				type: PRICE_TYPE.FIXED,
				price_unit_type: PRICE_UNIT_TYPE.FIAT,
				billing_period: BILLING_PERIOD.MONTHLY,
				billing_period_count: 1,
				billing_model: BILLING_MODEL.TIERED,
				invoice_cadence: INVOICE_CADENCE.ARREAR,
				currency: 'usd',
				tier_mode: TIER_MODE.VOLUME,
				tiers: [
					{ up_to: 5, unit_amount: '10', flat_amount: '0' },
					{ up_to: 10, unit_amount: '8', flat_amount: '0' },
				],
				min_quantity: 2,
			},
		};

		const internalPrice = subscriptionLineItemToInternalPrice(lineItem, { currency: 'usd' });

		expect(internalPrice.internal_state).toBe(PriceInternalState.EDIT);
		expect(internalPrice.billing_model).toBe(BILLING_MODEL.TIERED);
		expect(internalPrice.tier_mode).toBe(TIER_MODE.VOLUME);
		expect(internalPrice.tiers).toHaveLength(2);
		expect(internalPrice.min_quantity).toBe(2);
	});

	it('round-trips custom unit package pricing', () => {
		const lineItem: AddedSubscriptionLineItem = {
			tempId: 'sub_2',
			price: {
				type: PRICE_TYPE.FIXED,
				price_unit_type: PRICE_UNIT_TYPE.CUSTOM,
				billing_period: BILLING_PERIOD.MONTHLY,
				billing_period_count: 1,
				billing_model: BILLING_MODEL.PACKAGE,
				invoice_cadence: INVOICE_CADENCE.ARREAR,
				currency: 'usd',
				price_unit_config: { price_unit: 'CRD', amount: '9' },
				transform_quantity: { divide_by: 25 },
				min_quantity: 1,
			},
		};

		const internalPrice = subscriptionLineItemToInternalPrice(lineItem);

		expect(internalPrice.price_unit_config).toEqual({ price_unit: 'CRD', amount: '9' });
		expect(internalPrice.transform_quantity).toEqual({ divide_by: 25 });
		expect(internalPrice.amount).toBe('9');
	});
});
