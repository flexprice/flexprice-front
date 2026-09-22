import { z } from 'zod';

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

// Every field falls back rather than throwing: a malformed setting must not take down
// the pages that read it. An entry left without a symbol is dropped by the display map.
const settingString = z.union([z.string(), z.number()]).transform(String).catch('');

const customCurrencyDefinitionSchema = z.object({
	name: settingString,
	symbol: settingString,
	fiat_conversion_factors: z.record(settingString).catch({}),
});

const customCurrencyConfigSchema = z.object({
	custom_currencies: z.record(customCurrencyDefinitionSchema).catch({}),
	default_fiat_currency: settingString,
});

/** Reads an unknown settings payload into a config, tolerating a missing or partial value. */
export const parseCustomCurrencyConfig = (value: unknown): CustomCurrencyConfig => {
	const parsed = customCurrencyConfigSchema.safeParse(value ?? {});
	return parsed.success ? parsed.data : { custom_currencies: {}, default_fiat_currency: '' };
};

/** Maps lowercased currency code to the display data the formatters need. */
export const toCustomCurrencyDisplay = (config: CustomCurrencyConfig): Record<string, { symbol: string; name: string }> => {
	return Object.entries(config.custom_currencies ?? {}).reduce<Record<string, { symbol: string; name: string }>>(
		(display, [code, definition]) => {
			if (definition?.symbol) {
				display[code.toLowerCase()] = { symbol: definition.symbol, name: definition.name || code.toUpperCase() };
			}
			return display;
		},
		{},
	);
};

/**
 * Editor shape for the settings form. The backend requires every custom currency to
 * define a factor for the same set of fiat currencies, so the fiat codes are held once
 * for the whole config rather than per currency, which makes that rule unbreakable.
 */
export interface CustomCurrencyDraftRow {
	/** Stable React key. Codes are editable, so they cannot serve as the key. */
	id: string;
	code: string;
	name: string;
	symbol: string;
	factors: Record<string, string>;
}

export interface CustomCurrencyDraft {
	defaultFiatCurrency: string;
	fiatCurrencies: string[];
	currencies: CustomCurrencyDraftRow[];
}

export const EMPTY_CUSTOM_CURRENCY_DRAFT: CustomCurrencyDraft = {
	defaultFiatCurrency: '',
	fiatCurrencies: [],
	currencies: [],
};

export const toCustomCurrencyDraft = (config: CustomCurrencyConfig): CustomCurrencyDraft => {
	const entries = Object.entries(config.custom_currencies ?? {});
	const defaultFiat = (config.default_fiat_currency ?? '').toLowerCase();

	const fiatCurrencies = entries.reduce<string[]>(
		(codes, [, definition]) => {
			Object.keys(definition?.fiat_conversion_factors ?? {}).forEach((fiat) => {
				const lower = fiat.toLowerCase();
				if (!codes.includes(lower)) codes.push(lower);
			});
			return codes;
		},
		defaultFiat ? [defaultFiat] : [],
	);

	return {
		defaultFiatCurrency: defaultFiat,
		fiatCurrencies,
		currencies: entries.map(([code, definition], index) => ({
			id: `${code}-${index}`,
			code: code.toLowerCase(),
			name: definition?.name ?? '',
			symbol: definition?.symbol ?? '',
			factors: fiatCurrencies.reduce<Record<string, string>>((factors, fiat) => {
				factors[fiat] = String(definition?.fiat_conversion_factors?.[fiat] ?? '');
				return factors;
			}, {}),
		})),
	};
};

/** A row the user has not started filling in is ignored rather than reported as invalid. */
export const isBlankCustomCurrencyRow = (row: CustomCurrencyDraftRow): boolean =>
	!row.code.trim() && !row.name.trim() && !row.symbol.trim() && Object.values(row.factors).every((rate) => !String(rate).trim());

/** Payload for PUT /v1/settings/custom_currency_config. An empty draft clears the config. */
export const serializeCustomCurrencyConfig = (draft: CustomCurrencyDraft): CustomCurrencyConfig => {
	const rows = draft.currencies.filter((row) => !isBlankCustomCurrencyRow(row));
	if (rows.length === 0) {
		return { custom_currencies: {}, default_fiat_currency: '' };
	}

	return {
		default_fiat_currency: draft.defaultFiatCurrency.toLowerCase(),
		custom_currencies: rows.reduce<Record<string, CustomCurrencyDefinition>>((currencies, row) => {
			currencies[row.code.trim().toLowerCase()] = {
				name: row.name.trim(),
				symbol: row.symbol.trim(),
				fiat_conversion_factors: draft.fiatCurrencies.reduce<Record<string, string>>((factors, fiat) => {
					factors[fiat] = (row.factors[fiat] ?? '').trim();
					return factors;
				}, {}),
			};
			return currencies;
		}, {}),
	};
};

export type CustomCurrencyErrorKey =
	| 'defaultFiatRequired'
	| 'codeLength'
	| 'codeDuplicate'
	| 'codeMatchesFiat'
	| 'nameRequired'
	| 'symbolRequired'
	| 'factorInvalid';

/** Mirrors CustomCurrencyConfig.Validate on the backend so the failure is shown before the request. */
export const getCustomCurrencyErrorKey = (draft: CustomCurrencyDraft): CustomCurrencyErrorKey | null => {
	const rows = draft.currencies.filter((row) => !isBlankCustomCurrencyRow(row));
	if (rows.length === 0) return null;
	if (!draft.defaultFiatCurrency) return 'defaultFiatRequired';

	const seen = new Set<string>();
	for (const row of rows) {
		const code = row.code.trim().toLowerCase();
		if (code.length !== 3) return 'codeLength';
		if (seen.has(code)) return 'codeDuplicate';
		seen.add(code);
		if (draft.fiatCurrencies.includes(code)) return 'codeMatchesFiat';
		if (!row.name.trim()) return 'nameRequired';
		if (!row.symbol.trim()) return 'symbolRequired';

		for (const fiat of draft.fiatCurrencies) {
			const rate = Number((row.factors[fiat] ?? '').trim());
			if (!Number.isFinite(rate) || rate <= 0) return 'factorInvalid';
		}
	}

	return null;
};
