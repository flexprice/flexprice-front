import type { LineItem } from '@/models/Subscription';
import { PRICE_TYPE } from '@/models/Price';

/**
 * Quantity is only meaningful for FIXED charges — USAGE charges are billed
 * from metered consumption, so their quantity column shows "--" instead.
 */
export function getQuantityDisplayForLineItem(row: Pick<LineItem, 'price_type' | 'quantity'>): string {
	if (row.price_type !== PRICE_TYPE.FIXED) return '--';
	return String(row.quantity);
}
