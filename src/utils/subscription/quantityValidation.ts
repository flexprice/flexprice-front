/** Coerce an API quantity (decimal string or number) into a UI number. */
export function parseNonNegativeQuantity(value: number | string | undefined): number | undefined {
	if (value === undefined || value === '') {
		return undefined;
	}
	const n = typeof value === 'number' ? value : parseFloat(value);
	if (!Number.isFinite(n) || n < 0) {
		return undefined;
	}
	return n;
}

/**
 * Resolves the committed quantity from a table-cell input string.
 * Falls back to `minQuantity` only when the input doesn't parse to a
 * number at all — a typed "0" must resolve to 0, not fall back.
 */
export function resolveQuantityFromInput(value: string, minQuantity: number): number {
	const parsed = parseInt(value, 10);
	return Number.isNaN(parsed) ? minQuantity : parsed;
}

/**
 * Validates a raw quantity input string (as typed in a form field).
 * Accepts 0 and any positive number; rejects negative numbers, empty
 * strings, and non-numeric input. Strips comma thousand-separators
 * before parsing.
 */
export function isValidNonNegativeQuantityString(value: string): boolean {
	const trimmed = value.trim().replace(/,/g, '');
	if (!trimmed) return false;
	const n = Number(trimmed);
	return Number.isFinite(n) && n >= 0;
}
