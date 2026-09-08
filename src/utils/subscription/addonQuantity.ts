import { PRICE_TYPE, type Price } from '@/models/Price';
import type { OverrideLineItemRequest } from '@/types/dto/Subscription';
import { parseNonNegativeQuantity } from './quantityValidation';

type QuantityOverride = number | string | undefined;

export type AddonChargeOverride = {
	quantity?: QuantityOverride;
	amount?: number | string;
};

/** Catalogue default for a FIXED addon price: `min_quantity` or 1. USAGE never has a billed qty. */
export function getDefaultFixedPriceQuantity(price: Pick<Price, 'type' | 'min_quantity'>): number {
	if (price.type !== PRICE_TYPE.FIXED) {
		return 0;
	}
	return price.min_quantity ?? 1;
}

/** Resolved FIXED qty for display / preview. USAGE always 0 so it cannot leak into totals. */
export function getResolvedFixedPriceQuantity(price: Pick<Price, 'type' | 'min_quantity'>, overrideQuantity?: QuantityOverride): number {
	if (price.type !== PRICE_TYPE.FIXED) {
		return 0;
	}
	const parsed = parseNonNegativeQuantity(overrideQuantity);
	return parsed !== undefined ? parsed : getDefaultFixedPriceQuantity(price);
}

/** Outer addons-table qty: FIXED resolved quantities, or the usage label when there is no FIXED price. */
export function formatAddonQuantityDisplay(prices: Price[], overrideLineItems: OverrideLineItemRequest[] = [], usageLabel: string): string {
	const fixedPrices = prices.filter((price) => price.type === PRICE_TYPE.FIXED);
	if (fixedPrices.length === 0) {
		return usageLabel;
	}

	const overridesByPriceId = Object.fromEntries(overrideLineItems.map((item) => [item.price_id, item]));
	return fixedPrices.map((price) => String(getResolvedFixedPriceQuantity(price, overridesByPriceId[price.id]?.quantity))).join(', ');
}

/** Unit amount × qty for FIXED addon prices. USAGE prices are ignored. */
export function sumFixedAddonRecurringTotal(prices: Price[], overridesByPriceId: Record<string, AddonChargeOverride>): number {
	return prices
		.filter((price) => price.type === PRICE_TYPE.FIXED)
		.reduce((acc, price) => {
			const override = overridesByPriceId[price.id];
			const unitAmount = override?.amount !== undefined ? Number(override.amount) : parseFloat(price.amount);
			const quantity = getResolvedFixedPriceQuantity(price, override?.quantity);
			return acc + (Number.isFinite(unitAmount) ? unitAmount : 0) * quantity;
		}, 0);
}

const hasRemainingOverrideField = (item: OverrideLineItemRequest): boolean =>
	item.quantity !== undefined ||
	item.amount !== undefined ||
	item.billing_model !== undefined ||
	item.tier_mode !== undefined ||
	(item.tiers !== undefined && item.tiers.length > 0) ||
	item.transform_quantity !== undefined ||
	item.price_unit_amount !== undefined ||
	(item.price_unit_tiers !== undefined && item.price_unit_tiers.length > 0) ||
	item.bucket_size !== undefined;

/**
 * Prepare `addons[].override_line_items` for POST /subscriptions.
 * Quantity is a decimal string; USAGE prices must not send quantity; duplicate price_ids are dropped.
 */
export function sanitizeAddonOverrideLineItemsForApi(
	items: OverrideLineItemRequest[] | undefined,
	prices: Price[],
): OverrideLineItemRequest[] | undefined {
	if (!items || items.length === 0) {
		return undefined;
	}

	const pricesById = new Map(prices.map((price) => [price.id, price]));
	const seen = new Set<string>();
	const sanitized: OverrideLineItemRequest[] = [];

	for (const item of items) {
		if (seen.has(item.price_id)) {
			continue;
		}
		seen.add(item.price_id);

		const price = pricesById.get(item.price_id);
		const next: OverrideLineItemRequest = { ...item };
		const parsedQuantity = parseNonNegativeQuantity(item.quantity);

		if (price?.type === PRICE_TYPE.USAGE || parsedQuantity === undefined) {
			delete next.quantity;
		} else {
			next.quantity = String(parsedQuantity);
		}

		if (hasRemainingOverrideField(next)) {
			sanitized.push(next);
		}
	}

	return sanitized.length > 0 ? sanitized : undefined;
}
