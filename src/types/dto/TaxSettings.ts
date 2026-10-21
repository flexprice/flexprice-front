/**
 * Mirrors the FlexPrice `tax_config` setting (see `internal/types/tax.go`).
 *
 * The setting names an external engine that calculates tax on invoices and
 * credit notes in place of FlexPrice's native rates. Its zero value is the
 * native engine, so an environment that has never held this setting behaves
 * exactly as it did before the setting existed.
 */

/** Empty means the native engine. It is accepted by the API but never offered as a choice. */
export type TaxProvider = '' | 'flexprice' | 'stripe';

export interface TaxConfig {
	enabled: boolean;
	provider: TaxProvider;
}

/**
 * The providers offered in the tax-engine dropdown. Stripe is the only
 * external engine the UI exposes. `flexprice` stays a valid stored value
 * (the native engine) but is not a choice.
 */
export const TAX_PROVIDERS: Array<'stripe'> = ['stripe'];

/**
 * What an environment with no saved setting resolves to. The backend's default
 * is `{}`, whose zero value is this.
 */
export const FALLBACK_TAX_CONFIG: TaxConfig = {
	enabled: false,
	provider: '',
};

function isTaxProvider(value: unknown): value is TaxProvider {
	return value === '' || value === 'flexprice' || value === 'stripe';
}

/**
 * Reads the stored value into a config.
 *
 * Anything unrecognised resolves to the native engine rather than throwing: a
 * provider this build does not know about must not leave the section unable to
 * render, and showing it as native matches what the backend does with an engine
 * it cannot resolve to an external one.
 */
export function parseTaxConfig(value: unknown): TaxConfig {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return FALLBACK_TAX_CONFIG;
	const raw = value as Record<string, unknown>;
	return {
		enabled: raw.enabled === true,
		provider: isTaxProvider(raw.provider) ? raw.provider : '',
	};
}

/**
 * Builds the payload for a save.
 *
 * Both fields are always sent. The backend deliberately omits `omitempty` so a
 * disabled config persists as `enabled: false` instead of disappearing from the
 * stored document, which would be indistinguishable from never having been
 * configured — dropping either field here would undo that.
 */
export function serializeTaxConfig(config: TaxConfig): TaxConfig {
	return {
		enabled: config.enabled,
		provider: config.provider,
	};
}

/**
 * Whether an engine outside FlexPrice calculates tax, matching the backend's
 * `UsesExternalTaxEngine`. This is the single question every behaviour turns on:
 * a config that is enabled but names the native engine is still native.
 */
export function usesExternalTaxEngine(config: TaxConfig): boolean {
	return config.enabled && config.provider !== '' && config.provider !== 'flexprice';
}
