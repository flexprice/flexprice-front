import { PriceUnit } from '@/models/PriceUnit';
import { PRICE_UNIT_TYPE } from '@/models/Price';
import type { CustomCurrencyConfig } from '@/types/dto/CustomCurrency';

/**
 * Represents a currency option (FIAT type)
 */
export interface CurrencyOption {
	type: PRICE_UNIT_TYPE.FIAT;
	code: string;
	symbol: string;
	value: string; // Same as code for currencies
	label: string; // Currency code (e.g., "USD")
}

/**
 * Represents a price unit option (CUSTOM type)
 */
export interface PriceUnitOption {
	type: PRICE_UNIT_TYPE.CUSTOM;
	code: string;
	symbol: string;
	base_currency: string;
	conversion_rate: string;
	value: string; // Price unit code (e.g., "BTC")
	label: string; // Display format: "BTC (₿)" or "TOK (tokens)"
	priceUnit: PriceUnit; // Full PriceUnit object
}

/**
 * Unified option type that can represent both currency and price unit
 */
export type CurrencyPriceUnitOption = CurrencyOption | PriceUnitOption;

/**
 * Result type returned when an option is selected
 */
export interface CurrencyPriceUnitSelection {
	type: PRICE_UNIT_TYPE;
	data: CurrencyOption | PriceUnitOption;
}

/**
 * Converts a currency option from constants to CurrencyOption
 */
export const currencyToOption = (currency: { label: string; value: string; symbol: string }): CurrencyOption => {
	return {
		type: PRICE_UNIT_TYPE.FIAT,
		code: currency.value,
		symbol: currency.symbol,
		value: currency.value,
		label: currency.label,
	};
};

/**
 * Converts a PriceUnit to PriceUnitOption
 */
export const priceUnitToOption = (priceUnit: PriceUnit): PriceUnitOption => {
	return {
		type: PRICE_UNIT_TYPE.CUSTOM,
		code: priceUnit.code,
		symbol: priceUnit.symbol,
		base_currency: priceUnit.base_currency,
		conversion_rate: priceUnit.conversion_rate,
		value: priceUnit.code,
		label: `${priceUnit.code} (${priceUnit.symbol})`,
		priceUnit,
	};
};

/**
 * Helper to check if an option is a currency (FIAT)
 */
export const isCurrencyOption = (option: CurrencyPriceUnitOption): option is CurrencyOption => {
	return option.type === PRICE_UNIT_TYPE.FIAT;
};

/**
 * Helper to check if an option is a price unit (CUSTOM)
 */
export const isPriceUnitOption = (option: CurrencyPriceUnitOption): option is PriceUnitOption => {
	return option.type === PRICE_UNIT_TYPE.CUSTOM;
};

/**
 * Tenant-defined currencies as ordinary currency options. Selecting one sets `currency`
 * on the price with no conversion, unlike a price unit, so they are FIAT options even
 * though the selector groups them beside the price units.
 */
export const customCurrencyConfigToOptions = (config: CustomCurrencyConfig): CurrencyOption[] => {
	return Object.entries(config.custom_currencies).map(([code, definition]) =>
		currencyToOption({ label: `${code.toUpperCase()} (${definition.symbol})`, value: code, symbol: definition.symbol }),
	);
};
