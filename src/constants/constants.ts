import { getCurrencyOptions } from '@/utils/common/helper_functions';

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
	{ label: 'Weekly', value: 'WEEKLY' },
	{ label: 'Monthly', value: 'MONTHLY' },
	{ label: 'Yearly', value: 'ANNUAL' },
	{ label: 'Quarterly', value: 'QUARTERLY' },
	{ label: 'Half-Yearly', value: 'HALF_YEARLY' },
];
