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
