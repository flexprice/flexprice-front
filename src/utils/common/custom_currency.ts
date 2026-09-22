/**
 * Display data for the tenant's custom currencies, kept in a module so the currency
 * formatters — which are synchronous and called from render — can consult it without
 * every call site becoming async or hook-aware.
 *
 * Populated by `useCustomCurrencyConfig`, which also clears it when the environment
 * changes: the setting is scoped per tenant and environment.
 */
interface CustomCurrencyDisplay {
	symbol: string;
	name: string;
}

let customCurrencies: Record<string, CustomCurrencyDisplay> = {};

export const setCustomCurrencies = (currencies: Record<string, CustomCurrencyDisplay>): void => {
	customCurrencies = currencies;
};

/** Returns the configured symbol for a custom currency, or undefined if it is not one. */
export const getCustomCurrencySymbol = (currency?: string | null): string | undefined => {
	if (!currency) return undefined;
	return customCurrencies[currency.toLowerCase()]?.symbol;
};

/** Returns the configured display name for a custom currency, or undefined if it is not one. */
export const getCustomCurrencyName = (currency?: string | null): string | undefined => {
	if (!currency) return undefined;
	return customCurrencies[currency.toLowerCase()]?.name;
};

export const isCustomCurrency = (currency?: string | null): boolean => {
	if (!currency) return false;
	return customCurrencies[currency.toLowerCase()] !== undefined;
};
