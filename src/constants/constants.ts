import { getAllISOCodes } from 'iso-country-currency';
import { CREDIT_GRANT_PERIOD } from '@/models/CreditGrant';
import { BILLING_MODEL, PRICE_ENTITY_TYPE } from '@/models/Price';
import { ENTITLEMENT_ENTITY_TYPE } from '@/models/Entitlement';
import { BILLING_CADENCE, INVOICE_CADENCE } from '@/models/Invoice';
import { BUCKET_SIZE } from '@/models/Meter';
import {
	BILLING_CYCLE,
	COLLECTION_METHOD,
	PAYMENT_BEHAVIOR,
	PAYMENT_TERMS,
	SUBSCRIPTION_CANCELLATION_TYPE,
	SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE,
	SUBSCRIPTION_PRORATION_BEHAVIOR,
	SUBSCRIPTION_STATUS,
} from '@/models/Subscription';

export const DEFAULT_CURRENCY_CODE = 'USD';

export enum BILLING_PERIOD {
	DAILY = 'DAILY',
	WEEKLY = 'WEEKLY',
	MONTHLY = 'MONTHLY',
	QUARTERLY = 'QUARTERLY',
	HALF_YEARLY = 'HALF_YEARLY',
	ANNUAL = 'ANNUAL',
	ONETIME = 'ONETIME',
}

// Dashboard time periods for analytics and monitoring
export enum TIME_PERIOD {
	LAST_HOUR = 'last-hour',
	LAST_DAY = 'last-day',
	LAST_WEEK = 'last-week',
	LAST_30_DAYS = 'last-30-days',
}

/** ISO 4217 codes valid but absent from iso-country-currency (funds, SDRs, etc.). */
type SupplementalIsoCurrency = { currency: string; symbol: string };

const SUPPLEMENTAL_ISO_CURRENCIES: SupplementalIsoCurrency[] = [{ currency: 'CLF', symbol: 'CLF' }];

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

	SUPPLEMENTAL_ISO_CURRENCIES.forEach(({ currency, symbol }) => {
		if (!map.has(currency)) {
			map.set(currency, { currency, symbol });
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
	{ label: 'Daily', value: BILLING_PERIOD.DAILY },
	{ label: 'Weekly', value: BILLING_PERIOD.WEEKLY },
	{ label: 'Monthly', value: BILLING_PERIOD.MONTHLY },
	{ label: 'Yearly', value: BILLING_PERIOD.ANNUAL },
	{ label: 'Quarterly', value: BILLING_PERIOD.QUARTERLY },
	{ label: 'Half-Yearly', value: BILLING_PERIOD.HALF_YEARLY },
	{ label: 'One-time', value: BILLING_PERIOD.ONETIME },
];

export const creditGrantPeriodOptions = [
	{ label: 'Daily', value: CREDIT_GRANT_PERIOD.DAILY },
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

/**
 * Sent as the literal string value of `bucket_size` on an UpdatePriceRequest to remove bucketing
 * from an existing price. Distinct from simply omitting the field, which leaves it unchanged.
 */
export const BUCKET_SIZE_NONE = 'none' as const;

// Usage-window options for a price's `bucket_size` (windows usage into fixed buckets before the
// meter's aggregation runs, e.g. per-HOUR SUM). Only the values the backend accepts at the price
// level - WEEK/MONTH (present on the meter-level BUCKET_SIZE enum) are not offered here.
export const priceBucketSizeOptions = [
	{ label: 'Minute', value: BUCKET_SIZE.WindowSizeMinute },
	{ label: '15 Minute', value: BUCKET_SIZE.WindowSize15Min },
	{ label: '30 Minute', value: BUCKET_SIZE.WindowSize30Min },
	{ label: 'Hour', value: BUCKET_SIZE.WindowSizeHour },
	{ label: '3 Hour', value: BUCKET_SIZE.WindowSize3Hour },
	{ label: '6 Hour', value: BUCKET_SIZE.WindowSize6Hour },
	{ label: '12 Hour', value: BUCKET_SIZE.WindowSize12Hour },
	{ label: 'Day', value: BUCKET_SIZE.WindowSizeDay },
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
	{ label: 'Cancelled', value: SUBSCRIPTION_STATUS.CANCELLED },
	{ label: 'Incomplete', value: SUBSCRIPTION_STATUS.INCOMPLETE },
	{ label: 'Trialing', value: SUBSCRIPTION_STATUS.TRIALING },
	{ label: 'Draft', value: SUBSCRIPTION_STATUS.DRAFT },
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

// Sentinel for "no payment terms" — Radix Select disallows value=""
export const PAYMENT_TERMS_NONE = '__none__';
export const paymentTermsOptions = [
	{ label: 'None', value: PAYMENT_TERMS_NONE },
	{ label: 'NET 15', value: PAYMENT_TERMS.NET_15 },
	{ label: 'NET 30', value: PAYMENT_TERMS.NET_30 },
	{ label: 'NET 45', value: PAYMENT_TERMS.NET_45 },
	{ label: 'NET 60', value: PAYMENT_TERMS.NET_60 },
	{ label: 'NET 75', value: PAYMENT_TERMS.NET_75 },
	{ label: 'NET 90', value: PAYMENT_TERMS.NET_90 },
];

export const prorationBehaviorOptions = [
	{ label: 'Create Prorations', value: SUBSCRIPTION_PRORATION_BEHAVIOR.CREATE_PRORATIONS },
	{ label: 'None', value: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE },
];

export const cancellationTypeOptions = [
	{ label: 'Immediate', value: SUBSCRIPTION_CANCELLATION_TYPE.IMMEDIATE },
	{ label: 'End of Period', value: SUBSCRIPTION_CANCELLATION_TYPE.END_OF_PERIOD },
	{ label: 'Scheduled date', value: SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE },
];

export const subscriptionLineItemEntityTypeOptions = [
	{ label: 'Plan', value: SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE.PLAN },
	{ label: 'Addon', value: SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE.ADDON },
];

// Sandbox environment auto-cancellation period (in days)
export const SANDBOX_AUTO_CANCELLATION_DAYS = 45;
