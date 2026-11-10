import { formatAmount } from '@/components/atoms/Input/inputFormatting';

/**
 * Balance formatters for customer-facing surfaces.
 *
 * `formatAmount` only inserts thousand separators — it never rounds — so passing a
 * raw balance through it renders the full float (e.g. `-15,029.004249893753`).
 * Credit balances are computed values and routinely carry that much precision, so
 * anything customer-facing must round first.
 */

/**
 * Credits: rounded to at most `maxDecimals`, with trailing zeros dropped so whole
 * amounts read as `15,029` while genuinely fractional ones keep their precision (`10.5`).
 */
export const formatCredits = (value: number | string | null | undefined, maxDecimals = 2): string => {
	const parsed = typeof value === 'number' ? value : Number(value);
	if (value === null || value === undefined || value === '' || !Number.isFinite(parsed)) return '0';
	return formatAmount(String(Number(parsed.toFixed(maxDecimals))));
};

/** Money: always two decimals, so `-17681.6234` reads as `-17,681.62`. */
export const formatMoney = (value: number | string | null | undefined): string => {
	const parsed = typeof value === 'number' ? value : Number(value);
	if (value === null || value === undefined || value === '' || !Number.isFinite(parsed)) return '0.00';
	return formatAmount(parsed.toFixed(2));
};
