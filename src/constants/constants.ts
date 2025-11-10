import { getAllISOCodes } from 'iso-country-currency';
import { CREDIT_GRANT_PERIOD } from '@/models/CreditGrant';
import { BILLING_MODEL, PRICE_ENTITY_TYPE } from '@/models/Price';
import { ENTITLEMENT_ENTITY_TYPE } from '@/models/Entitlement';
import { BILLING_CADENCE, INVOICE_CADENCE } from '@/models/Invoice';
import {
	BILLING_CYCLE,
	COLLECTION_METHOD,
	PAYMENT_BEHAVIOR,
	SUBSCRIPTION_CANCELLATION_TYPE,
	SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE,
	SUBSCRIPTION_PRORATION_BEHAVIOR,
	SUBSCRIPTION_STATUS,
} from '@/models/Subscription';

export enum BILLING_PERIOD {
	DAILY = 'DAILY',
	WEEKLY = 'WEEKLY',
	MONTHLY = 'MONTHLY',
	QUARTERLY = 'QUARTERLY',
	HALF_YEARLY = 'HALF_YEARLY',
	ANNUAL = 'ANNUAL',
}

export const getCurrencyOptions = () => {
	const codes = getAllISOCodes();
	const map = new Map();
	const priorityCurrencies = ['USD', 'INR', 'EUR'];

	// First add priority currencies
	priorityCurrencies.forEach((currency) => {
		const code = codes.find((c) => c.currency === currency);
		if (code) {
			map.set(currency, {
				currency: code.currency,
				symbol: code.symbol,
			});
		}
	});

	// Then add all other currencies
	codes.forEach((code) => {
		if (!priorityCurrencies.includes(code.currency)) {
			map.set(code.currency, {
				currency: code.currency,
				symbol: code.symbol,
			});
		}
	});
	return Array.from(map.values());
};

export const currencyOptions = Array.from(
	new Map(
		getCurrencyOptions().map((currency) => [
			currency.currency,
			{
				// label: `${currency.currency} (${currency.symbol})`,
				// label: `${currency.currency} (${currency.countryName})`,
				label: currency.currency,
				value: currency.currency,
				symbol: currency.symbol,
			},
		]),
	).values(),
);
export const billlingPeriodOptions = [
	// { label: 'Daily', value: 'DAILY' },
	{ label: 'Weekly', value: BILLING_PERIOD.WEEKLY },
	{ label: 'Monthly', value: BILLING_PERIOD.MONTHLY },
	{ label: 'Yearly', value: BILLING_PERIOD.ANNUAL },
	{ label: 'Quarterly', value: BILLING_PERIOD.QUARTERLY },
	{ label: 'Half-Yearly', value: BILLING_PERIOD.HALF_YEARLY },
];

export const creditGrantPeriodOptions = [
	// { label: 'Daily', value: 'DAILY' },
	{ label: 'Weekly', value: CREDIT_GRANT_PERIOD.WEEKLY },
	{ label: 'Monthly', value: CREDIT_GRANT_PERIOD.MONTHLY },
	{ label: 'Yearly', value: CREDIT_GRANT_PERIOD.ANNUAL },
	{ label: 'Quarterly', value: CREDIT_GRANT_PERIOD.QUARTERLY },
	{ label: 'Half-Yearly', value: CREDIT_GRANT_PERIOD.HALF_YEARLY },
];

// Price-related options
export const billingModelOptions = [
	{ label: 'Flat Fee', value: BILLING_MODEL.FLAT_FEE },
	{ label: 'Package', value: BILLING_MODEL.PACKAGE },
	{ label: 'Volume Tiered', value: BILLING_MODEL.TIERED },
	{ label: 'Slab Tiered', value: 'SLAB_TIERED' }, // Maps to TIERED with SLAB tier_mode
];

export const billingCadenceOptions = [
	{ label: 'Recurring', value: BILLING_CADENCE.RECURRING },
	{ label: 'One Time', value: BILLING_CADENCE.ONETIME },
];

export const priceEntityTypeOptions = [
	{ label: 'Plan', value: PRICE_ENTITY_TYPE.PLAN },
	{ label: 'Addon', value: PRICE_ENTITY_TYPE.ADDON },
	{ label: 'Feature', value: PRICE_ENTITY_TYPE.FEATURE },
	{ label: 'Meter', value: PRICE_ENTITY_TYPE.METER },
];

export const entitlementEntityTypeOptions = [
	{ label: 'Plan', value: ENTITLEMENT_ENTITY_TYPE.PLAN },
	{ label: 'Addon', value: ENTITLEMENT_ENTITY_TYPE.ADDON },
];

export const invoiceCadenceOptions = [
	{ label: 'Arrear', value: INVOICE_CADENCE.ARREAR },
	{ label: 'Advance', value: INVOICE_CADENCE.ADVANCE },
];

// Subscription-related options
export const subscriptionStatusOptions = [
	{ label: 'Active', value: SUBSCRIPTION_STATUS.ACTIVE },
	{ label: 'Paused', value: SUBSCRIPTION_STATUS.PAUSED },
	{ label: 'Cancelled', value: SUBSCRIPTION_STATUS.CANCELLED },
	{ label: 'Incomplete', value: SUBSCRIPTION_STATUS.INCOMPLETE },
	{ label: 'Incomplete Expired', value: SUBSCRIPTION_STATUS.INCOMPLETE_EXPIRED },
	{ label: 'Past Due', value: SUBSCRIPTION_STATUS.PAST_DUE },
	{ label: 'Trialing', value: SUBSCRIPTION_STATUS.TRIALING },
	{ label: 'Unpaid', value: SUBSCRIPTION_STATUS.UNPAID },
];

export const billingCycleOptions = [
	{ label: 'Anniversary', value: BILLING_CYCLE.ANNIVERSARY },
	{ label: 'Calendar', value: BILLING_CYCLE.CALENDAR },
];

export const paymentBehaviorOptions = [
	{ label: 'Allow Incomplete', value: PAYMENT_BEHAVIOR.ALLOW_INCOMPLETE },
	{ label: 'Default Incomplete', value: PAYMENT_BEHAVIOR.DEFAULT_INCOMPLETE },
	{ label: 'Error If Incomplete', value: PAYMENT_BEHAVIOR.ERROR_IF_INCOMPLETE },
	{ label: 'Default Active', value: PAYMENT_BEHAVIOR.DEFAULT_ACTIVE },
];

export const collectionMethodOptions = [
	{ label: 'Charge Automatically', value: COLLECTION_METHOD.CHARGE_AUTOMATICALLY },
	{ label: 'Send Invoice', value: COLLECTION_METHOD.SEND_INVOICE },
];

export const prorationBehaviorOptions = [
	{ label: 'Create Prorations', value: SUBSCRIPTION_PRORATION_BEHAVIOR.CREATE_PRORATIONS },
	{ label: 'None', value: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE },
];

export const cancellationTypeOptions = [
	{ label: 'Immediate', value: SUBSCRIPTION_CANCELLATION_TYPE.IMMEDIATE },
	{ label: 'End of Period', value: SUBSCRIPTION_CANCELLATION_TYPE.END_OF_PERIOD },
];

export const subscriptionLineItemEntityTypeOptions = [
	{ label: 'Plan', value: SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE.PLAN },
	{ label: 'Addon', value: SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE.ADDON },
];
