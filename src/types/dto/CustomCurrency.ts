/**
 * Tenant-defined currencies from the `custom_currency_config` setting. Prices,
 * subscriptions and wallets can be denominated in one of these; invoices are always
 * in `default_fiat_currency`.
 */
export interface CustomCurrencyDefinition {
	name: string;
	symbol: string;
	fiat_conversion_factors: Record<string, string>;
}

export interface CustomCurrencyConfig {
	custom_currencies: Record<string, CustomCurrencyDefinition>;
	default_fiat_currency: string;
}

/** Reads an unknown settings payload into a config, tolerating a missing or partial value. */
export const parseCustomCurrencyConfig = (value: unknown): CustomCurrencyConfig => {
	const raw = (value ?? {}) as Partial<CustomCurrencyConfig>;

	return {
		custom_currencies: raw.custom_currencies ?? {},
		default_fiat_currency: raw.default_fiat_currency ?? '',
	};
};

/** Maps lowercased currency code to the display data the formatters need. */
export const toCustomCurrencyDisplay = (config: CustomCurrencyConfig): Record<string, { symbol: string; name: string }> => {
	return Object.entries(config.custom_currencies).reduce<Record<string, { symbol: string; name: string }>>((display, [code, definition]) => {
		if (definition?.symbol) {
			display[code.toLowerCase()] = { symbol: definition.symbol, name: definition.name || code.toUpperCase() };
		}
		return display;
	}, {});
};
