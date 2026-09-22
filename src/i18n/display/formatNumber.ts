import { DEFAULT_CURRENCY_CODE } from '@/constants/constants';
import { getIntlDigitOptions, getIntlLocale } from './intlLocale';
import { getCustomCurrencySymbol } from '@/utils/common/custom_currency';

/** Use a neutral locale for symbols so USD stays "$" in RTL locales (ar uses "US$" otherwise). */
const CURRENCY_SYMBOL_LOCALE = 'en-US';

/** Normalize currency code with a non-translatable default when missing. */
export function resolveCurrencyCode(currency?: string | null): string {
	const code = currency?.trim();
	return code ? code.toUpperCase() : DEFAULT_CURRENCY_CODE;
}

export type LocalizedNumberOptions = {
	language?: string;
	minimumFractionDigits?: number;
	maximumFractionDigits?: number;
	notation?: 'standard' | 'compact';
};

/** Parse numeric strings that may include grouping separators from API or inputs. */
export function parseNumericAmount(value: number | string): number | null {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : null;
	}
	const trimmed = value.trim();
	if (!trimmed) return null;
	const normalized = trimmed.replace(/,/g, '');
	const num = Number(normalized);
	return Number.isFinite(num) ? num : null;
}

/**
 * Locale-aware number formatting (digits, grouping, decimals) using the active UI language.
 */
export function formatLocalizedNumber(value: number | string, options: LocalizedNumberOptions = {}): string {
	const num = parseNumericAmount(value);
	if (num === null) return '—';

	const locale = getIntlLocale(options.language);
	return new Intl.NumberFormat(locale, {
		...getIntlDigitOptions(options.language),
		minimumFractionDigits: options.minimumFractionDigits,
		maximumFractionDigits: options.maximumFractionDigits ?? 2,
		notation: options.notation ?? 'standard',
	}).format(num);
}

/**
 * Locale-aware currency formatting (symbol position, digits, grouping per locale).
 */
export function formatLocalizedCurrency(amount: number | string, currency: string, options: LocalizedNumberOptions = {}): string {
	const num = parseNumericAmount(amount);
	const currencyCode = resolveCurrencyCode(currency);
	const locale = getIntlLocale(options.language);

	const formatOpts: Intl.NumberFormatOptions = {
		...getIntlDigitOptions(options.language),
		style: 'currency',
		currency: currencyCode,
		minimumFractionDigits: options.minimumFractionDigits,
		maximumFractionDigits: options.maximumFractionDigits ?? 2,
	};

	try {
		const symbol = getLocalizedCurrencySymbol(currencyCode);
		const parts = new Intl.NumberFormat(locale, formatOpts).formatToParts(num ?? 0);
		return parts.map((part) => (part.type === 'currency' ? symbol : part.value)).join('');
	} catch {
		const symbol = getLocalizedCurrencySymbol(currencyCode);
		return num === null ? `${symbol}0` : `${symbol}${formatLocalizedNumber(num, options)}`;
	}
}

/** Currency symbol for a code (narrow symbol, locale-neutral so $ stays $ in Arabic UI). */
export function getLocalizedCurrencySymbol(currency: string, _language?: string): string {
	// A tenant-defined currency is not an ISO code, so Intl cannot resolve it.
	const customSymbol = getCustomCurrencySymbol(currency);
	if (customSymbol) return customSymbol;

	const currencyCode = resolveCurrencyCode(currency);
	try {
		return (
			new Intl.NumberFormat(CURRENCY_SYMBOL_LOCALE, {
				style: 'currency',
				currency: currencyCode,
				currencyDisplay: 'narrowSymbol',
			})
				.formatToParts(0)
				.find((part) => part.type === 'currency')?.value ?? currencyCode
		);
	} catch {
		return currencyCode;
	}
}

/** Compact notation for charts and summaries (e.g. 10K, 1.2M). */
export function formatLocalizedCompactNumber(value: number, language?: string): string {
	if (!Number.isFinite(value)) return '—';
	return new Intl.NumberFormat(getIntlLocale(language), {
		...getIntlDigitOptions(language),
		notation: 'compact',
		maximumFractionDigits: 1,
	}).format(value);
}
