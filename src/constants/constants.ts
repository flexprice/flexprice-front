import { getAllISOCodes } from 'iso-country-currency';
import { CREDIT_GRANT_PERIOD } from '@/models/CreditGrant';
import { BILLING_MODEL, PRICE_TYPE, PRICE_UNIT_TYPE, TIER_MODE, PRICE_ENTITY_TYPE } from '@/models/Price';
import { ENTITLEMENT_ENTITY_TYPE } from '@/models/Entitlement';
import { BILLING_CADENCE, INVOICE_CADENCE } from '@/models/Invoice';

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
	const priorityCurrencies = ['usd', 'inr', 'eur'];

	// First add priority currencies
	priorityCurrencies.forEach((currency) => {
		const code = codes.find((c) => c.currency === currency);
		if (code) {
			map.set(currency, {
				currency: code.currency.toLowerCase(),
				symbol: code.symbol,
			});
		}
	});

	// Then add all other currencies
	codes.forEach((code) => {
		if (!priorityCurrencies.includes(code.currency)) {
			map.set(code.currency, {
				currency: code.currency.toLowerCase(),
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
	{ label: 'Tiered', value: BILLING_MODEL.TIERED },
];

export const priceTypeOptions = [
	{ label: 'Usage', value: PRICE_TYPE.USAGE },
	{ label: 'Fixed', value: PRICE_TYPE.FIXED },
];

export const priceUnitTypeOptions = [
	{ label: 'Fiat', value: PRICE_UNIT_TYPE.FIAT },
	{ label: 'Custom', value: PRICE_UNIT_TYPE.CUSTOM },
];

export const tierModeOptions = [
	{ label: 'Volume', value: TIER_MODE.VOLUME },
	{ label: 'Slab', value: TIER_MODE.SLAB },
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
	{ label: 'Feature', value: ENTITLEMENT_ENTITY_TYPE.FEATURE },
];

export const invoiceCadenceOptions = [
	{ label: 'Arrear', value: INVOICE_CADENCE.ARREAR },
	{ label: 'Advance', value: INVOICE_CADENCE.ADVANCE },
];
