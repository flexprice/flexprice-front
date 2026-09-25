import { BILLING_MODEL, PRICE_UNIT_TYPE } from '@/models/Price';
import type { LineItem } from '@/models/Subscription';

/**
 * Current per-unit price when `line_item_change` may reprice this line item, else undefined.
 * The backend rejects `amount` for tiered, package and custom-price-unit prices; quantity still works for those.
 */
export function getEditableLineItemAmount(lineItem: LineItem): string | undefined {
	const price = lineItem.price;
	if (!price || price.billing_model !== BILLING_MODEL.FLAT_FEE || price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM) {
		return undefined;
	}
	return price.amount ?? undefined;
}

/**
 * Strict price input check: plain digits or correctly grouped thousands ("1,200"), optional "." decimals.
 * Rejects "1,20" (a comma-decimal would otherwise be read as 120), hex, exponents and negatives.
 */
export function isValidPriceString(value: string): boolean {
	return /^(\d{1,3}(,\d{3})+|\d+)(\.\d+)?$/.test(value.trim());
}

/** Numeric equality for decimal strings ("100" === "100.00"); strips comma separators. */
export function isSameDecimal(a: string, b: string): boolean {
	const x = Number(a.trim().replace(/,/g, ''));
	const y = Number(b.trim().replace(/,/g, ''));
	return Number.isFinite(x) && Number.isFinite(y) && x === y;
}
