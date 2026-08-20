import { describe, expect, it } from 'vitest';
import { BILLING_MODEL, PRICE_TYPE, PRICE_UNIT_TYPE } from '@/models/Price';
import { INVOICE_CADENCE } from '@/models/Invoice';
import { BILLING_PERIOD } from '@/constants/constants';
import { CommitmentType } from '@/types/dto/LineItemCommitmentConfig';
import type { CreateSubscriptionLineItemRequest } from '@/types/dto/Subscription';
import type { LineItem } from '@/models/Subscription';
import {
	applyBaseCommitmentToLineItem,
	applyWindowCommitmentToLineItem,
	buildLineItemCommitmentUpdatePayload,
	DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE,
	lineItemHasCommitment,
	lineItemWindowCommitmentStateFromBuckets,
	subscriptionChargeCommitmentFromLineItem,
} from '@/utils/subscription/subscription_line_item_commitment_helpers';

const baseRequest: CreateSubscriptionLineItemRequest = {
	price: {
		type: PRICE_TYPE.USAGE,
		price_unit_type: PRICE_UNIT_TYPE.FIAT,
		billing_period: BILLING_PERIOD.MONTHLY,
		billing_period_count: 1,
		billing_model: BILLING_MODEL.FLAT_FEE,
		invoice_cadence: INVOICE_CADENCE.ARREAR,
		currency: 'usd',
		meter_id: 'meter_01',
	},
	quantity: 0,
};

describe('subscription charge base commitment fields', () => {
	it('applyBaseCommitmentToLineItem sets parent commitment fields on the line item request', () => {
		const request = { ...baseRequest };
		const commitmentState = {
			...DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE,
			commitmentType: CommitmentType.AMOUNT,
			commitmentAmount: '250',
			overageFactor: '1.2',
			enableTrueUp: true,
			commitmentDuration: BILLING_PERIOD.ANNUAL,
		};

		const result = applyBaseCommitmentToLineItem(request, commitmentState);

		expect(result).toBeNull();
		expect(request).toMatchObject({
			commitment_type: CommitmentType.AMOUNT,
			commitment_amount: 250,
			commitment_overage_factor: 1.2,
			commitment_true_up_enabled: true,
			commitment_duration: BILLING_PERIOD.ANNUAL,
		});
	});

	it('applyWindowCommitmentToLineItem includes parent fields when window commitment is enabled', () => {
		const request = { ...baseRequest };
		const commitmentState = {
			...DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE,
			commitmentType: CommitmentType.AMOUNT,
			commitmentAmount: '50',
			overageFactor: '1',
			enableTrueUp: true,
			windowCommitment: true,
			timeBuckets: [
				{
					start: { hour: 9, minute: 0 },
					end: { hour: 17, minute: 0 },
					commitment_value: '50',
					overage_factor: '1',
					true_up_enabled: true,
					bucket_amount: '1',
					billing_model: BILLING_MODEL.FLAT_FEE,
				},
			],
		};

		const result = applyWindowCommitmentToLineItem(request, commitmentState, {
			meter_id: 'meter_01',
			currency: 'usd',
			billing_period: BILLING_PERIOD.MONTHLY,
			type: PRICE_TYPE.USAGE,
			bucket_size: 'HOUR',
		});

		expect(result).toBeNull();
		expect(request).toMatchObject({
			commitment_type: CommitmentType.AMOUNT,
			commitment_amount: 50,
			commitment_overage_factor: 1,
			commitment_true_up_enabled: true,
			commitment_windowed: true,
		});
		expect(request.commitment_time_buckets).toHaveLength(1);
	});

	it('subscriptionChargeCommitmentFromLineItem hydrates base fields from a stored line item request', () => {
		const item: CreateSubscriptionLineItemRequest = {
			...baseRequest,
			commitment_type: CommitmentType.QUANTITY,
			commitment_quantity: 1000,
			commitment_overage_factor: 1.5,
			commitment_true_up_enabled: false,
			commitment_duration: BILLING_PERIOD.QUARTERLY,
		};

		const state = subscriptionChargeCommitmentFromLineItem(item);

		expect(state).toMatchObject({
			commitmentType: CommitmentType.QUANTITY,
			commitmentQuantity: '1000',
			overageFactor: '1.5',
			enableTrueUp: false,
			commitmentDuration: BILLING_PERIOD.QUARTERLY,
			windowCommitment: false,
		});
	});

	it('lineItemWindowCommitmentStateFromBuckets hydrates string commitment fields from persisted line items', () => {
		const state = lineItemWindowCommitmentStateFromBuckets(
			{
				commitment_amount: '75',
				commitment_type: CommitmentType.AMOUNT,
				commitment_overage_factor: '2',
				commitment_true_up_enabled: true,
				commitment_windowed: true,
			},
			[],
		);

		expect(state).toMatchObject({
			commitmentAmount: '75',
			commitmentType: CommitmentType.AMOUNT,
			overageFactor: '2',
			enableTrueUp: true,
			windowCommitment: true,
		});
	});
});

describe('buildLineItemCommitmentUpdatePayload', () => {
	it('allows clearing all window commitment time buckets on edit', () => {
		const lineItem = {
			id: 'li_01',
			currency: 'usd',
			meter_id: 'meter_01',
			billing_period: BILLING_PERIOD.MONTHLY,
			price: {
				type: PRICE_TYPE.USAGE,
				meter_id: 'meter_01',
				billing_period: BILLING_PERIOD.MONTHLY,
				price_unit_type: PRICE_UNIT_TYPE.FIAT,
				invoice_cadence: INVOICE_CADENCE.ARREAR,
				bucket_size: 'HOUR',
			},
			commitment_time_buckets: [
				{
					id: 'bucket_01',
					start: { hour: 9, minute: 0 },
					end: { hour: 17, minute: 0 },
					commitment_value: '50',
				},
			],
		} as LineItem;

		const result = buildLineItemCommitmentUpdatePayload(
			{
				...DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE,
				commitmentType: CommitmentType.AMOUNT,
				commitmentAmount: '50',
				windowCommitment: true,
				timeBuckets: [],
			},
			lineItem,
		);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.payload.commitment_windowed).toBe(true);
			expect(result.payload.commitment_time_buckets).toEqual([]);
		}
	});
});

describe('lineItemHasCommitment', () => {
	it('returns false when no commitment fields are set', () => {
		expect(lineItemHasCommitment({})).toBe(false);
	});

	it('returns true for base amount commitment', () => {
		expect(lineItemHasCommitment({ commitment_amount: 100 })).toBe(true);
	});

	it('returns true for base quantity commitment', () => {
		expect(lineItemHasCommitment({ commitment_quantity: 50 })).toBe(true);
	});

	it('returns true for window commitment', () => {
		expect(lineItemHasCommitment({ commitment_windowed: true })).toBe(true);
	});
});
