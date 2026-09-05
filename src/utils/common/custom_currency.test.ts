import { describe, expect, it, beforeEach } from 'vitest';
import { getCurrencySymbol as getIsoCurrencySymbol, getCurrencyName } from './helper_functions';
import { getCurrencySymbol as getIntlCurrencySymbol, formatCurrency } from '@/constants/common';
import { getLocalizedCurrencySymbol } from '@/i18n/display/formatNumber';
import { setCustomCurrencies, getCustomCurrencySymbol, isCustomCurrency } from './custom_currency';
import { parseCustomCurrencyConfig, toCustomCurrencyDisplay } from '@/types/dto/CustomCurrency';

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
