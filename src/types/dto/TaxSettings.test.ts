import { describe, it, expect } from 'vitest';
import { FALLBACK_TAX_CONFIG, parseTaxConfig, serializeTaxConfig, usesExternalTaxEngine } from './TaxSettings';

describe('parseTaxConfig', () => {
	it('resolves an absent or empty setting to the native engine', () => {
		expect(parseTaxConfig(undefined)).toEqual(FALLBACK_TAX_CONFIG);
		expect(parseTaxConfig(null)).toEqual(FALLBACK_TAX_CONFIG);
		// The backend's default for this key is literally {}.
		expect(parseTaxConfig({})).toEqual({ enabled: false, provider: '' });
	});

	it('reads a configured external engine', () => {
		expect(parseTaxConfig({ enabled: true, provider: 'stripe' })).toEqual({ enabled: true, provider: 'stripe' });
	});

	it('keeps the provider when the engine is switched off', () => {
		// The backend stores enabled separately so an engine can be turned off
		// without losing which one was chosen.
		expect(parseTaxConfig({ enabled: false, provider: 'stripe' })).toEqual({ enabled: false, provider: 'stripe' });
	});

	it('treats a provider this build does not know as native rather than throwing', () => {
		expect(parseTaxConfig({ enabled: true, provider: 'avalara' })).toEqual({ enabled: true, provider: '' });
	});

	it('does not treat a truthy non-boolean as enabled', () => {
		expect(parseTaxConfig({ enabled: 'yes', provider: 'stripe' }).enabled).toBe(false);
	});

	it('ignores a non-object value', () => {
		expect(parseTaxConfig('stripe')).toEqual(FALLBACK_TAX_CONFIG);
		expect(parseTaxConfig([{ enabled: true }])).toEqual(FALLBACK_TAX_CONFIG);
	});
});

describe('serializeTaxConfig', () => {
	// The backend omits `omitempty` on both fields on purpose: a disabled config
	// has to persist as enabled:false rather than vanishing from the document.
	it('always sends both fields, including the falsy ones', () => {
		expect(serializeTaxConfig({ enabled: false, provider: '' })).toEqual({ enabled: false, provider: '' });
		expect(Object.keys(serializeTaxConfig({ enabled: false, provider: '' })).sort()).toEqual(['enabled', 'provider']);
	});

	it('round-trips through parse unchanged', () => {
		const config = { enabled: true, provider: 'stripe' } as const;
		expect(parseTaxConfig(serializeTaxConfig(config))).toEqual(config);
	});
});

describe('usesExternalTaxEngine', () => {
	it('is true only for an enabled, non-native provider', () => {
		expect(usesExternalTaxEngine({ enabled: true, provider: 'stripe' })).toBe(true);
	});

	it('is false when disabled, whatever it names', () => {
		expect(usesExternalTaxEngine({ enabled: false, provider: 'stripe' })).toBe(false);
	});

	// Enabled + native is still native — this is the case that would be easy to
	// get wrong by reading `enabled` alone.
	it('is false when enabled but naming the native engine', () => {
		expect(usesExternalTaxEngine({ enabled: true, provider: 'flexprice' })).toBe(false);
		expect(usesExternalTaxEngine({ enabled: true, provider: '' })).toBe(false);
	});
});
