import { getAllISOCodes } from 'iso-country-currency';
import { CREDIT_GRANT_PERIOD } from '@/models/CreditGrant';

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
