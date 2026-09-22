import { describe, expect, it, beforeEach } from 'vitest';
import { getCurrencySymbol as getIsoCurrencySymbol, getCurrencyName } from './helper_functions';
import { getCurrencySymbol as getIntlCurrencySymbol, formatCurrency } from '@/constants/common';
import { getLocalizedCurrencySymbol } from '@/i18n/display/formatNumber';
import { setCustomCurrencies, getCustomCurrencySymbol, isCustomCurrency } from './custom_currency';
import {
	parseCustomCurrencyConfig,
	toCustomCurrencyDisplay,
	toCustomCurrencyDraft,
	serializeCustomCurrencyConfig,
	getCustomCurrencyErrorKey,
	type CustomCurrencyDraft,
} from '@/types/dto/CustomCurrency';
import { customCurrencyConfigToOptions } from '@/types/common/PriceUnitSelector';
import { PRICE_UNIT_TYPE } from '@/models/Price';

const MAC = { symbol: 'MAC', name: 'MoEngage AI Credits' };

describe('custom currency symbols', () => {
	beforeEach(() => setCustomCurrencies({}));

	it('falls back to the code when nothing is configured', () => {
		expect(getCustomCurrencySymbol('mac')).toBeUndefined();
		expect(isCustomCurrency('mac')).toBe(false);
		expect(getIsoCurrencySymbol('mac')).toBe('mac');
	});

	it('resolves a configured symbol regardless of case', () => {
		setCustomCurrencies({ mac: MAC });
		expect(getCustomCurrencySymbol('MAC')).toBe('MAC');
		expect(getCustomCurrencySymbol('mac')).toBe('MAC');
		expect(isCustomCurrency('Mac')).toBe(true);
	});

	it('leaves real currencies alone', () => {
		setCustomCurrencies({ mac: MAC });
		expect(getIsoCurrencySymbol('USD')).toBe('$');
		expect(getIntlCurrencySymbol('USD')).toBe('$');
		expect(getLocalizedCurrencySymbol('USD')).toBe('$');
	});

	it('is used by every formatter', () => {
		setCustomCurrencies({ mac: MAC });
		expect(getIsoCurrencySymbol('mac')).toBe('MAC');
		expect(getIntlCurrencySymbol('mac')).toBe('MAC');
		expect(getLocalizedCurrencySymbol('mac')).toBe('MAC');
		expect(formatCurrency(1500, 'mac')).toContain('MAC');
	});

	it('formats a code Intl rejects', () => {
		// Intl.NumberFormat throws on anything that is not three alphabetic characters.
		setCustomCurrencies({ credits: { symbol: 'CR', name: 'Credits' } });
		expect(formatCurrency(1500, 'credits')).toBe('CR1,500.00');
		expect(formatCurrency('1500', 'credits')).toBe('CR1,500.00');
	});

	it('does not throw on an unconfigured code Intl rejects', () => {
		expect(formatCurrency(1500, 'credits')).toBe('credits1500.00');
	});

	it('resolves the display name too', () => {
		setCustomCurrencies({ mac: MAC });
		expect(getCurrencyName('mac')).toBe('MoEngage AI Credits');
	});

	it('handles empty and missing input', () => {
		setCustomCurrencies({ mac: MAC });
		expect(getCustomCurrencySymbol('')).toBeUndefined();
		expect(getCustomCurrencySymbol(null)).toBeUndefined();
		expect(isCustomCurrency(undefined)).toBe(false);
	});
});

describe('parsing the setting payload', () => {
	it('tolerates a missing or partial value', () => {
		expect(parseCustomCurrencyConfig(undefined)).toEqual({ custom_currencies: {}, default_fiat_currency: '' });
		expect(parseCustomCurrencyConfig({ default_fiat_currency: 'usd' })).toEqual({
			custom_currencies: {},
			default_fiat_currency: 'usd',
		});
	});

	it('lowercases codes and falls back to the code when no name is set', () => {
		const display = toCustomCurrencyDisplay(
			parseCustomCurrencyConfig({
				custom_currencies: {
					MAC: { name: '', symbol: 'MAC', fiat_conversion_factors: { usd: '0.1' } },
				},
				default_fiat_currency: 'usd',
			}),
		);
		expect(display.mac).toEqual({ symbol: 'MAC', name: 'MAC' });
	});

	it('skips entries with no symbol', () => {
		const display = toCustomCurrencyDisplay(
			parseCustomCurrencyConfig({
				custom_currencies: { mac: { name: 'MoEngage', symbol: '', fiat_conversion_factors: {} } },
				default_fiat_currency: 'usd',
			}),
		);
		expect(display.mac).toBeUndefined();
	});
});

describe('the settings editor draft', () => {
	const config = parseCustomCurrencyConfig({
		custom_currencies: {
			FPC: { name: 'FinePrint Credits', symbol: 'FPC', fiat_conversion_factors: { usd: '0.1', inr: '8.5' } },
		},
		default_fiat_currency: 'usd',
	});

	const draftOf = (rows: CustomCurrencyDraft['currencies'], fiat = ['usd'], defaultFiat = 'usd'): CustomCurrencyDraft => ({
		defaultFiatCurrency: defaultFiat,
		fiatCurrencies: fiat,
		currencies: rows,
	});

	const row = (overrides: Partial<CustomCurrencyDraft['currencies'][number]> = {}) => ({
		id: 'r1',
		code: 'fpc',
		name: 'FinePrint Credits',
		symbol: 'FPC',
		factors: { usd: '0.1' },
		...overrides,
	});

	it('lifts the fiat currencies out of the per-currency factors', () => {
		const draft = toCustomCurrencyDraft(config);
		expect(draft.defaultFiatCurrency).toBe('usd');
		// The default leads, so the settlement currency reads first in the editor.
		expect(draft.fiatCurrencies).toEqual(['usd', 'inr']);
		expect(draft.currencies).toHaveLength(1);
		expect(draft.currencies[0]).toMatchObject({ code: 'fpc', symbol: 'FPC', factors: { usd: '0.1', inr: '8.5' } });
	});

	it('round-trips back to the setting payload', () => {
		expect(serializeCustomCurrencyConfig(toCustomCurrencyDraft(config))).toEqual({
			default_fiat_currency: 'usd',
			custom_currencies: {
				fpc: { name: 'FinePrint Credits', symbol: 'FPC', fiat_conversion_factors: { usd: '0.1', inr: '8.5' } },
			},
		});
	});

	it('clears the setting when the last currency is removed', () => {
		expect(serializeCustomCurrencyConfig(draftOf([]))).toEqual({ custom_currencies: {}, default_fiat_currency: '' });
	});

	it('accepts a valid draft and an empty one', () => {
		expect(getCustomCurrencyErrorKey(draftOf([row()]))).toBeNull();
		expect(getCustomCurrencyErrorKey(draftOf([]))).toBeNull();
	});

	it('rejects what the backend rejects', () => {
		expect(getCustomCurrencyErrorKey({ ...draftOf([row()]), defaultFiatCurrency: '' })).toBe('defaultFiatRequired');
		expect(getCustomCurrencyErrorKey(draftOf([row({ code: 'credits' })]))).toBe('codeLength');
		expect(getCustomCurrencyErrorKey(draftOf([row(), row({ id: 'r2' })]))).toBe('codeDuplicate');
		expect(getCustomCurrencyErrorKey(draftOf([row({ code: 'usd' })]))).toBe('codeMatchesFiat');
		expect(getCustomCurrencyErrorKey(draftOf([row({ name: '  ' })]))).toBe('nameRequired');
		expect(getCustomCurrencyErrorKey(draftOf([row({ symbol: '' })]))).toBe('symbolRequired');
		expect(getCustomCurrencyErrorKey(draftOf([row({ factors: { usd: '0' } })]))).toBe('factorInvalid');
		expect(getCustomCurrencyErrorKey(draftOf([row({ factors: { usd: 'abc' } })]))).toBe('factorInvalid');
		expect(getCustomCurrencyErrorKey(draftOf([row({ factors: {} })]))).toBe('factorInvalid');
	});
});

// The settings editor and the app-wide symbol loader share one react-query key, so the
// cached value has to stay a CustomCurrencyConfig. Caching a draft under it crashed every
// page, because the symbol loader reads that cache on mount.
describe('the shared query key holds one shape', () => {
	it('the symbol loader survives whatever is cached under it', () => {
		const config = parseCustomCurrencyConfig({
			custom_currencies: { fpc: { name: 'FinePrint Credits', symbol: 'FPC', fiat_conversion_factors: { usd: '0.1' } } },
			default_fiat_currency: 'usd',
		});

		expect(toCustomCurrencyDisplay(config)).toEqual({ fpc: { symbol: 'FPC', name: 'FinePrint Credits' } });
		expect(() => toCustomCurrencyDisplay(toCustomCurrencyDraft(config) as never)).not.toThrow();
		expect(() => toCustomCurrencyDisplay({} as never)).not.toThrow();
	});
});

// The form always renders one currency to fill in, so an untouched row must read as
// "nothing configured yet" rather than as a validation failure.
describe('an untouched starter row', () => {
	const blank = {
		defaultFiatCurrency: 'usd',
		fiatCurrencies: ['usd'],
		currencies: [{ id: 'r1', code: '', name: '', symbol: '', factors: { usd: '' } }],
	};

	it('is not reported as invalid', () => {
		expect(getCustomCurrencyErrorKey(blank)).toBeNull();
	});

	it('is dropped on save, clearing the config', () => {
		expect(serializeCustomCurrencyConfig(blank)).toEqual({ custom_currencies: {}, default_fiat_currency: '' });
	});

	it('still validates a row the user has started', () => {
		expect(getCustomCurrencyErrorKey({ ...blank, currencies: [{ ...blank.currencies[0], code: 'cr' }] })).toBe('codeLength');
	});
});

// The setting is free-form JSON on the server, so a malformed value must degrade to a
// usable config rather than publish garbage to the formatters.
describe('parsing a malformed payload', () => {
	it('drops values that are not strings', () => {
		const config = parseCustomCurrencyConfig({
			custom_currencies: { crd: { name: 'Credits', symbol: {}, fiat_conversion_factors: { usd: '0.1' } } },
			default_fiat_currency: 'usd',
		});
		expect(config.custom_currencies.crd.symbol).toBe('');
		// No symbol means no display entry, so nothing renders "[object Object]".
		expect(toCustomCurrencyDisplay(config).crd).toBeUndefined();
	});

	it('accepts numeric factors and codes', () => {
		const config = parseCustomCurrencyConfig({
			custom_currencies: { crd: { name: 'Credits', symbol: 'CR', fiat_conversion_factors: { usd: 0.1 } } },
			default_fiat_currency: 'usd',
		});
		expect(config.custom_currencies.crd.fiat_conversion_factors.usd).toBe('0.1');
	});

	it('falls back whole when the payload is not an object', () => {
		expect(parseCustomCurrencyConfig('nonsense')).toEqual({ custom_currencies: {}, default_fiat_currency: '' });
		expect(parseCustomCurrencyConfig({ custom_currencies: 'nope' })).toEqual({ custom_currencies: {}, default_fiat_currency: '' });
	});
});

// The charge and wallet selectors offer these beside the price units, but a tenant
// currency is set on the price directly, so it must come through as a FIAT option.
describe('offering tenant currencies in the currency selector', () => {
	const config = parseCustomCurrencyConfig({
		custom_currencies: { crd: { name: 'Credits', symbol: 'CR', fiat_conversion_factors: { usd: '1.25' } } },
		default_fiat_currency: 'usd',
	});

	it('builds a FIAT option carrying the code', () => {
		expect(customCurrencyConfigToOptions(config)).toEqual([
			{ type: PRICE_UNIT_TYPE.FIAT, code: 'crd', symbol: 'CR', value: 'crd', label: 'CRD (CR)' },
		]);
	});

	it('offers nothing when the tenant has configured nothing', () => {
		expect(customCurrencyConfigToOptions(parseCustomCurrencyConfig(undefined))).toEqual([]);
	});
});

// Coupons, one-off invoices and onboarding wallets all read the same list, so a newly
// configured currency has to reach every one of them from a single place.
describe('currency options offered to the entities that accept a tenant currency', () => {
	it('leads with the tenant currencies, then the standard list', () => {
		const config = parseCustomCurrencyConfig({
			custom_currencies: { crd: { name: 'Credits', symbol: 'CR', fiat_conversion_factors: { usd: '1.25' } } },
			default_fiat_currency: 'usd',
		});
		const custom = Object.entries(config.custom_currencies).map(([code, definition]) => ({
			label: `${code.toUpperCase()} (${definition.symbol})`,
			value: code.toUpperCase(),
			symbol: definition.symbol,
		}));

		expect(custom).toEqual([{ label: 'CRD (CR)', value: 'CRD', symbol: 'CR' }]);
		// Uppercased to match the standard options; the backend lowercases before matching.
		expect(custom[0].value.toLowerCase()).toBe('crd');
	});
});
