import { useMemo } from 'react';
import { currencyOptions } from '@/constants/constants';
import useCustomCurrencyConfig from '@/hooks/useCustomCurrencyConfig';

export interface CurrencyOptionItem {
	label: string;
	value: string;
	symbol: string;
}

/**
 * Currency choices for entities the backend lets you create in a tenant currency:
 * coupons, wallets, one-off invoices and prices. The tenant's own currencies lead, then
 * the standard list. Codes are uppercased to match the existing options; the backend
 * lowercases before matching either way.
 */
export const useCurrencyOptions = (): CurrencyOptionItem[] => {
	const { config } = useCustomCurrencyConfig();

	return useMemo(() => {
		const custom = Object.entries(config.custom_currencies).map(([code, definition]) => ({
			label: `${code.toUpperCase()} (${definition.symbol})`,
			value: code.toUpperCase(),
			symbol: definition.symbol,
		}));

		return [...custom, ...currencyOptions];
	}, [config]);
};

export default useCurrencyOptions;
