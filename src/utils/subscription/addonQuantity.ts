import { PRICE_TYPE, type Price } from '@/models/Price';
import type { OverrideLineItemRequest } from '@/types/dto/Subscription';
import { getTotalPayableTextWithCoupons } from '@/utils/common/helper_functions';
import type { ExtendedPriceOverride } from '@/utils/common/price_override_helpers';
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

export type AddonChargeLabels = {
	empty: string;
	dependsOnUsage: string;
};

/** Shared Name/Quantity/Charges formatting used by create, edit, and overview addon tables. */
export function formatAddonCharges(
	prices: Price[] = [],
	overrideLineItems: OverrideLineItemRequest[] = [],
	priceOverrides: Record<string, ExtendedPriceOverride> = {},
	coupons: { type: string; amount_off?: string; percentage_off?: string }[] = [],
	labels: AddonChargeLabels,
): string {
	if (!prices || prices.length === 0) return labels.empty;

	const recurringPrices = prices.filter((price) => price.type === PRICE_TYPE.FIXED);
	const usagePrices = prices.filter((price) => price.type === PRICE_TYPE.USAGE);

	if (recurringPrices.length === 0) {
		return usagePrices.length > 0 ? labels.dependsOnUsage : labels.empty;
	}

	const fromLineItems = Object.fromEntries(
		overrideLineItems.map((item) => [item.price_id, { quantity: item.quantity, amount: item.amount }]),
	);
	const fromPriceOverrides = Object.fromEntries(
		Object.entries(priceOverrides).map(([id, override]) => [id, { quantity: override.quantity, amount: override.amount }]),
	);
	const recurringTotal = sumFixedAddonRecurringTotal(recurringPrices, { ...fromPriceOverrides, ...fromLineItems });

	return getTotalPayableTextWithCoupons(recurringPrices, usagePrices, recurringTotal, coupons);
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

const DEFAULT_LINE_ITEM_END_DATE = '0001-01-01T00:00:00Z';

/** Existing subscription addon line used for quantity / charges display (edit + overview). */
export type AttachedAddonChargeLine = {
	priceType: PRICE_TYPE;
	quantity: number | string;
	unitAmount: number;
	startDate?: string;
	endDate?: string;
	price?: Price;
};

/** Same window as Charges-table ACTIVE: started and not ended. */
export function isAttachedAddonLineActive(line: Pick<AttachedAddonChargeLine, 'startDate' | 'endDate'>, now: Date = new Date()): boolean {
	if (line.startDate?.trim()) {
		const start = new Date(line.startDate);
		if (!isNaN(start.getTime()) && start > now) {
			return false;
		}
	}
	if (line.endDate?.trim() && line.endDate !== DEFAULT_LINE_ITEM_END_DATE) {
		const end = new Date(line.endDate);
		if (!isNaN(end.getTime()) && end < now) {
			return false;
		}
	}
	return true;
}

function isAttachedAddonLineEnded(line: Pick<AttachedAddonChargeLine, 'endDate'>, now: Date): boolean {
	if (line.endDate?.trim() && line.endDate !== DEFAULT_LINE_ITEM_END_DATE) {
		const end = new Date(line.endDate);
		return !isNaN(end.getTime()) && end < now;
	}
	return false;
}

function normalizeAttachedPrice(line: AttachedAddonChargeLine): Price | undefined {
	if (!line.price) {
		return undefined;
	}
	if (line.price.type) {
		return line.price;
	}
	return { ...line.price, type: line.priceType };
}

/** Prefer active lines; if none, keep upcoming so qty 3 is not shown as "pay as you go". */
export function attachedAddonLinesToDisplayInput(
	lines: AttachedAddonChargeLine[],
	now: Date = new Date(),
): { prices: Price[]; overrideLineItems: OverrideLineItemRequest[] } {
	const displayable = lines.filter((line) => line.price && !isAttachedAddonLineEnded(line, now));
	const selected = displayable.filter((line) => isAttachedAddonLineActive(line, now));
	const source = selected.length > 0 ? selected : displayable;

	const prices: Price[] = [];
	const overrideLineItems: OverrideLineItemRequest[] = [];

	for (const line of source) {
		const price = normalizeAttachedPrice(line);
		if (!price) {
			continue;
		}
		prices.push(price);
		overrideLineItems.push({
			price_id: price.id,
			quantity: line.quantity,
			amount: line.unitAmount,
		});
	}

	return { prices, overrideLineItems };
}
