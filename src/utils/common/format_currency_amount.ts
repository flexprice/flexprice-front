import formatNumber from './format_number';
import { getCurrencySymbol } from './helper_functions';

interface FormatCurrencyAmountOptions {
	decimals?: number;
	showSign?: boolean;
}

/**
 * Formats a currency amount for display. Unlike formatNumber alone, zero amounts render as 0.00.
 */
export function formatCurrencyAmount(
	amount: number | null | undefined,
	currency?: string,
	options: FormatCurrencyAmountOptions = {},
): string {
	if (amount == null || !currency) {
		return '-';
	}

	const decimals = options.decimals ?? 2;
	const currencySymbol = getCurrencySymbol(currency);
	const formatted = amount === 0 ? (decimals > 0 ? `0.${'0'.repeat(decimals)}` : '0') : formatNumber(Math.abs(amount), decimals);
	const prefix = options.showSign && amount < 0 ? '-' : '';

	return `${prefix}${currencySymbol}${formatted}`;
}
