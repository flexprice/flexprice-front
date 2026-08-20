import { Price } from '@/models/Price';
import { BILLING_MODEL, TIER_MODE, CreatePriceTier, TransformQuantity, PRICE_TYPE, PRICE_UNIT_TYPE } from '@/models/Price';
import { BUCKET_SIZE } from '@/models/Meter';
import { BUCKET_SIZE_NONE } from '@/constants/constants';
import { LineItemCommitmentConfig } from '@/types/dto/LineItemCommitmentConfig';
import type { CommitmentTimeBucket } from '@/types/dto/CommitmentTimeBucket';

/**
 * Interface for line item overrides that will be sent to the backend
 */
// Frontend interface (supports SLAB_TIERED)
export interface SubscriptionLineItemOverrideRequest {
	price_id: string;
	quantity?: number;
	amount?: number; // For FIAT price unit type, FLAT_FEE/PACKAGE billing models
	billing_model?: BILLING_MODEL | 'SLAB_TIERED';
	tier_mode?: TIER_MODE;
	tiers?: CreatePriceTier[]; // For FIAT price unit type, TIERED billing model
	transform_quantity?: TransformQuantity;
	price_unit_amount?: string; // For CUSTOM price unit type, FLAT_FEE/PACKAGE billing models
	price_unit_tiers?: CreatePriceTier[]; // For CUSTOM price unit type, TIERED billing model
	bucket_size?: BUCKET_SIZE; // USAGE prices only
}

// Backend interface (converted format)
export interface BackendSubscriptionLineItemOverrideRequest {
	price_id: string;
	quantity?: number;
	amount?: number; // For FIAT price unit type
	billing_model?: BILLING_MODEL;
	tier_mode?: TIER_MODE;
	tiers?: CreatePriceTier[]; // For FIAT price unit type
	transform_quantity?: TransformQuantity;
	price_unit_amount?: string; // For CUSTOM price unit type
	price_unit_tiers?: CreatePriceTier[]; // For CUSTOM price unit type
	bucket_size?: BUCKET_SIZE; // USAGE prices only
}

/**
 * Extended interface for frontend price overrides
 */
export interface ExtendedPriceOverride {
	price_id: string;
	amount?: string; // For FIAT price unit type, FLAT_FEE/PACKAGE billing models
	quantity?: number;
	billing_model?: BILLING_MODEL | 'SLAB_TIERED';
	tier_mode?: TIER_MODE;
	tiers?: CreatePriceTier[]; // For FIAT price unit type, TIERED billing model
	transform_quantity?: TransformQuantity;
	effective_from?: string; // ISO date string for scheduling price changes
	commitment?: LineItemCommitmentConfig; // Commitment configuration for this price
	commitment_time_buckets?: CommitmentTimeBucket[];
	price_unit_amount?: string; // For CUSTOM price unit type, FLAT_FEE/PACKAGE billing models
	price_unit_tiers?: CreatePriceTier[]; // For CUSTOM price unit type, TIERED billing model
	// USAGE prices only - overrides the plan price's bucket_size. BUCKET_SIZE_NONE only makes sense when
	// editing an existing subscription line item (forwarded to UpdateSubscriptionLineItemRequest); it is
	// stripped before being sent as part of a subscription-create-time override (see getLineItemOverrides).
	bucket_size?: BUCKET_SIZE | typeof BUCKET_SIZE_NONE;
}

/**
 * Check if a price has been overridden
 */
export const isPriceOverridden = (priceId: string, overriddenPrices: Record<string, ExtendedPriceOverride>): boolean => {
	return overriddenPrices[priceId] !== undefined;
};

/**
 * Get the current amount for a price (original or overridden)
 */
export const getCurrentPriceAmount = (price: Price, overriddenPrices: Record<string, ExtendedPriceOverride>): string => {
	const override = overriddenPrices[price.id];
	return override?.amount || price.amount;
};

/**
 * Get all overridden prices as line item overrides for backend submission
 *
 * IMPORTANT: For USAGE type prices, quantity should never be sent in line item overrides.
 * Usage-based prices calculate quantity dynamically from meter usage, so including a static
 * quantity override would conflict with the usage-based billing model.
 */
export const getLineItemOverrides = (
	prices: Price[],
	overriddenPrices: Record<string, ExtendedPriceOverride>,
): BackendSubscriptionLineItemOverrideRequest[] => {
	return Object.entries(overriddenPrices)
		.filter(([priceId, override]) => {
			const price = prices.find((p) => p.id === priceId);
			return (
				price &&
				(override.amount !== undefined ||
					override.quantity !== undefined ||
					override.billing_model !== undefined ||
					override.tier_mode !== undefined ||
					override.tiers !== undefined ||
					override.transform_quantity !== undefined ||
					override.price_unit_amount !== undefined ||
					override.price_unit_tiers !== undefined ||
					override.bucket_size !== undefined)
			);
		})
		.map(([priceId, override]) => {
			const price = prices.find((p) => p.id === priceId);
			const isUsagePrice = price?.type === PRICE_TYPE.USAGE;
			const isCustomPriceUnit = price?.price_unit_type === PRICE_UNIT_TYPE.CUSTOM;

			// Handle SLAB_TIERED and Volume Tiered conversion
			let billingModel = override.billing_model;
			let tierMode = override.tier_mode;

			if (override.billing_model === 'SLAB_TIERED') {
				billingModel = BILLING_MODEL.TIERED;
				tierMode = TIER_MODE.SLAB;
			} else if (override.billing_model === BILLING_MODEL.TIERED) {
				// Ensure volume tiered has VOLUME tier mode
				tierMode = TIER_MODE.VOLUME;
			}

			const result: any = {
				price_id: priceId,
				// Exclude quantity for USAGE type prices - quantity is determined by meter usage
				...(override.quantity !== undefined && !isUsagePrice && { quantity: override.quantity }),
				...(billingModel !== undefined && { billing_model: billingModel as BILLING_MODEL }),
				...(tierMode !== undefined && { tier_mode: tierMode }),
				...(override.transform_quantity !== undefined && { transform_quantity: override.transform_quantity }),
				// bucket_size only makes sense for USAGE prices, same restriction the backend enforces.
				// BUCKET_SIZE_NONE (explicit clear) isn't meaningful at subscription-create time since
				// there's no existing price to clear - drop it rather than forwarding an unsupported value.
				...(override.bucket_size !== undefined &&
					override.bucket_size !== BUCKET_SIZE_NONE &&
					isUsagePrice && { bucket_size: override.bucket_size }),
			};

			// Handle FIAT vs CUSTOM price unit fields (mutually exclusive)
			if (isCustomPriceUnit) {
				// For CUSTOM prices, use price_unit_amount and price_unit_tiers
				if (override.price_unit_amount !== undefined) {
					result.price_unit_amount = override.price_unit_amount;
				}
				if (override.price_unit_tiers !== undefined) {
					result.price_unit_tiers = override.price_unit_tiers;
				}
			} else {
				// For FIAT prices, use amount and tiers
				if (override.amount !== undefined) {
					result.amount = parseFloat(override.amount);
				}
				if (override.tiers !== undefined) {
					result.tiers = override.tiers;
				}
			}

			return result as BackendSubscriptionLineItemOverrideRequest;
		});
};

/**
 * Check if there are any price overrides
 */
export const hasPriceOverrides = (overriddenPrices: Record<string, ExtendedPriceOverride>): boolean => {
	return Object.keys(overriddenPrices).length > 0;
};

/**
 * Get the count of overridden prices
 */
export const getOverriddenPricesCount = (overriddenPrices: Record<string, ExtendedPriceOverride>): number => {
	return Object.keys(overriddenPrices).length;
};

/**
 * Get a summary of price overrides for display
 */
export const getPriceOverridesSummary = (_: Price[], overriddenPrices: Record<string, ExtendedPriceOverride>): string => {
	const overriddenCount = getOverriddenPricesCount(overriddenPrices);
	if (overriddenCount === 0) return '';
	return `${overriddenCount} price${overriddenCount > 1 ? 's' : ''} overridden`;
};

/**
 * Create a new price override
 */
export const createPriceOverride = (priceId: string, override: Partial<ExtendedPriceOverride>): ExtendedPriceOverride => {
	return {
		price_id: priceId,
		...override,
	};
};

/**
 * Update an existing price override
 */
export const updatePriceOverride = (
	priceId: string,
	overrides: Record<string, ExtendedPriceOverride>,
	updates: Partial<ExtendedPriceOverride>,
): Record<string, ExtendedPriceOverride> => {
	const merged: ExtendedPriceOverride = {
		...overrides[priceId],
		...updates,
		price_id: priceId,
	};

	for (const key of Object.keys(updates) as (keyof ExtendedPriceOverride)[]) {
		if (updates[key] === undefined) {
			delete merged[key];
		}
	}

	return {
		...overrides,
		[priceId]: merged,
	};
};

/**
 * Remove a price override
 */
export const removePriceOverride = (
	priceId: string,
	overrides: Record<string, ExtendedPriceOverride>,
): Record<string, ExtendedPriceOverride> => {
	const newOverrides = { ...overrides };
	delete newOverrides[priceId];
	return newOverrides;
};
