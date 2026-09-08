import { Price, PRICE_UNIT_TYPE } from '@/models/Price';
import { BILLING_MODEL, PRICE_TYPE, TIER_MODE, CreatePriceTier, TransformQuantity } from '@/models/Price';
import { PriceUnit } from '@/models/PriceUnit';
import { getCurrencySymbol } from './helper_functions';
import { formatAmount } from '@/components/atoms/Input/Input';
import { ExtendedPriceOverride } from './price_override_helpers';
import { PERCENTAGE_BILLING_MODEL, PercentageBillingModel, decimalAmountToPercentage, isPercentagePrice } from './percentage_price_helpers';

/**
 * Normalized price structure - single source of truth for price display
 * This interface represents price data in a consistent format regardless of
 * whether it's FIAT or CUSTOM price unit type
 */
export interface NormalizedPriceDisplay {
	amount: string; // The amount to display
	symbol: string; // Currency/unit symbol to display
	tiers: CreatePriceTier[] | null; // Pricing tiers (null if not tiered)
	billingModel: BILLING_MODEL | 'SLAB_TIERED' | PercentageBillingModel; // Billing model
	tierMode: TIER_MODE; // Tier mode (VOLUME or SLAB)
	transformQuantity: TransformQuantity | null; // Transform quantity for package billing
	priceUnitType: PRICE_UNIT_TYPE; // FIAT or CUSTOM
}

// Helper to get the appropriate symbol for display
const getDisplaySymbol = (price: Price & { pricing_unit?: PriceUnit }): string => {
	// Priority 1: Use pricing_unit.symbol from PriceResponse if available (preferred - has actual symbol like "₿", "€", etc.)
	if (price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM && price.pricing_unit?.symbol) {
		return price.pricing_unit.symbol;
	}

	// Priority 2: Fall back to price_unit_config.price_unit (code string like "BTC", "TOK")
	if (price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM && price.price_unit_config?.price_unit) {
		return price.price_unit_config.price_unit;
	}

	// Priority 3: Use currency symbol for FIAT currencies
	return getCurrencySymbol(price.currency);
};

// Helper to get the appropriate amount for display
const getDisplayAmount = (price: Price): string => {
	if (price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM) {
		// For custom price units, prefer price_unit_amount or price_unit_config.amount
		return price.price_unit_amount || price.price_unit_config?.amount || price.amount || '0';
	}
	return price.amount || '0';
};

// Helper to get the appropriate tiers for display
const getDisplayTiers = (price: Price) => {
	if (price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM) {
		return price.price_unit_tiers || null;
	}
	return price.tiers;
};

/**
 * Normalize a price with optional overrides into a standard format
 * This is the single transformation point for all price display logic
 *
 * @param price - The original price object (may include pricing_unit from API response)
 * @param override - Optional price override configuration
 * @returns NormalizedPriceDisplay - Consistent format for display regardless of price unit type
 */
export const normalizePriceDisplay = (
	price: Price & { pricing_unit?: PriceUnit },
	override?: ExtendedPriceOverride,
): NormalizedPriceDisplay => {
	const isCustomPriceUnit = price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM;

	// Step 1: Extract symbol with correct priority
	// Priority: pricing_unit.symbol > price_unit_config.price_unit > price.price_unit > currency symbol
	let symbol: string;
	if (isCustomPriceUnit) {
		if (price.pricing_unit?.symbol) {
			symbol = price.pricing_unit.symbol;
		} else if (price.price_unit_config?.price_unit) {
			symbol = price.price_unit_config.price_unit;
		} else if (price.price_unit) {
			symbol = price.price_unit;
		} else {
			symbol = getCurrencySymbol(price.currency);
		}
	} else {
		symbol = getCurrencySymbol(price.currency);
	}

	// Step 2: Extract amount based on price unit type and overrides
	let amount: string;
	if (isCustomPriceUnit) {
		// For CUSTOM: override.price_unit_amount > price.price_unit_amount > price_unit_config.amount > price.amount
		amount = override?.price_unit_amount || price.price_unit_amount || price.price_unit_config?.amount || price.amount || '0';
	} else {
		// For FIAT: override.amount > price.amount
		amount = override?.amount || price.amount || '0';
	}

	// Step 3: Extract tiers based on price unit type and overrides
	let tiers: CreatePriceTier[] | null;
	if (isCustomPriceUnit) {
		// For CUSTOM: override.price_unit_tiers > price.price_unit_tiers
		tiers = (override?.price_unit_tiers || price.price_unit_tiers || null) as CreatePriceTier[] | null;
	} else {
		// For FIAT: override.tiers > price.tiers
		tiers = (override?.tiers || price.tiers || null) as CreatePriceTier[] | null;
	}

	// Step 4: Extract billing model and tier mode
	let billingModel: BILLING_MODEL | 'SLAB_TIERED' | PercentageBillingModel = override?.billing_model || price.billing_model;
	let tierMode: TIER_MODE = override?.tier_mode || price.tier_mode;

	// A percentage charge is stored as a FLAT_FEE tagged in metadata - surface it as its own billing
	// model so display formats the amount as a percentage rather than a currency value. An override
	// that moves the charge off FLAT_FEE drops back to the overridden model.
	if (isPercentagePrice({ billing_model: billingModel, metadata: price.metadata })) {
		billingModel = PERCENTAGE_BILLING_MODEL;
	}

	// Step 5: Handle SLAB_TIERED special case
	// SLAB_TIERED is a frontend convenience representation for TIERED + SLAB mode
	if (billingModel === 'SLAB_TIERED') {
		tierMode = TIER_MODE.SLAB;
	}

	// Step 6: Extract transform quantity
	const transformQuantity = override?.transform_quantity || price.transform_quantity || null;

	return {
		amount,
		symbol,
		tiers,
		billingModel,
		tierMode,
		transformQuantity,
		priceUnitType: price.price_unit_type,
	};
};

/**
 * Format price display based on normalized data and billing model
 *
 * @param normalized - The normalized price display data
 * @returns Formatted price string for display
 */
// Backend amounts can carry full floating-point precision (e.g. a per-unit rate computed as
// amount/quantity yielding "0.066666666666667"). Display doesn't need more than this many decimal
// places - values with fewer decimals are returned untouched, so the common 2-decimal case is
// unaffected.
const MAX_DISPLAY_DECIMALS = 6;

const capDisplayDecimals = (amount: string, maxDecimals: number = MAX_DISPLAY_DECIMALS): string => {
	const [, decimalPart] = amount.split('.');
	if (!decimalPart || decimalPart.length <= maxDecimals) return amount;
	const parsed = Number(amount);
	return Number.isFinite(parsed) ? parsed.toFixed(maxDecimals) : amount;
};

/**
 * Renders a stored decimal amount as the percentage it stands for: "0.025" -> "2.5%".
 * Single place every percentage-aware display goes through, so the symbol and the decimal cap stay
 * consistent across charge tables, previews, tooltips and the pricing card.
 */
export const formatPercentageAmount = (amount: string): string =>
	`${formatAmount(capDisplayDecimals(decimalAmountToPercentage(amount || '0')))}%`;

export const formatPriceDisplay = (normalized: NormalizedPriceDisplay): string => {
	const { amount, symbol, billingModel, transformQuantity, tiers } = normalized;

	switch (billingModel) {
		case BILLING_MODEL.FLAT_FEE:
			return `${symbol}${formatAmount(capDisplayDecimals(amount))}`;

		case PERCENTAGE_BILLING_MODEL:
			return formatPercentageAmount(amount);

		case BILLING_MODEL.PACKAGE: {
			const divideBy = transformQuantity?.divide_by || 1;
			return `${symbol}${formatAmount(capDisplayDecimals(amount))} / ${divideBy} units`;
		}

		case BILLING_MODEL.TIERED:
		case 'SLAB_TIERED': {
			const firstTier = tiers?.[0];
			return `starts at ${symbol}${formatAmount(capDisplayDecimals(firstTier?.unit_amount || '0'))} per unit`;
		}

		default:
			return `${symbol}${formatAmount(capDisplayDecimals(amount))}`;
	}
};

/**
 * Get human-readable label for billing model
 */
export const getBillingModelLabel = (model: BILLING_MODEL | 'SLAB_TIERED' | PercentageBillingModel): string => {
	switch (model) {
		case BILLING_MODEL.FLAT_FEE:
			return 'Flat Fee';
		case PERCENTAGE_BILLING_MODEL:
			return 'Percentage Fee';
		case BILLING_MODEL.PACKAGE:
			return 'Package';
		case BILLING_MODEL.TIERED:
			return 'Volume Tiered';
		case 'SLAB_TIERED':
			return 'Slab Tiered';
		default:
			return model;
	}
};

/**
 * Get human-readable label for tier mode
 */
export const getTierModeLabel = (mode: TIER_MODE): string => {
	switch (mode) {
		case TIER_MODE.VOLUME:
			return 'Volume';
		case TIER_MODE.SLAB:
			return 'Slab';
		default:
			return mode;
	}
};

export const getPriceTableCharge = (price: Price & { pricing_unit?: PriceUnit }, normalizedPrice: boolean = true) => {
	const displaySymbol = getDisplaySymbol(price);
	const displayAmount = getDisplayAmount(price);
	const displayTiers = getDisplayTiers(price);

	// Percentage charges are FLAT_FEE prices whose amount is the decimal equivalent - render the
	// percentage rather than a currency amount, for both fixed and usage charges.
	if (isPercentagePrice(price)) {
		return formatPercentageAmount(displayAmount);
	}

	if (price.type === PRICE_TYPE.FIXED) {
		return `${displaySymbol}${formatAmount(displayAmount)}`;
	} else {
		if (price.billing_model === BILLING_MODEL.PACKAGE) {
			return `${displaySymbol}${formatAmount(displayAmount)} / ${formatAmount((price.transform_quantity as { divide_by: number }).divide_by.toString())} units`;
		} else if (price.billing_model === BILLING_MODEL.FLAT_FEE) {
			return `${displaySymbol}${formatAmount(displayAmount)} / unit`;
		} else if (price.billing_model === BILLING_MODEL.TIERED) {
			const firstTier = displayTiers?.[0];
			return `Starts at ${normalizedPrice ? displaySymbol : displaySymbol}${formatAmount(firstTier?.unit_amount?.toString() || '0')} / unit`;
		} else {
			return price.display_amount || `${displaySymbol}${formatAmount(displayAmount)}`;
		}
	}
};

export const getActualPriceForTotal = (price: Price) => {
	const displayAmount = getDisplayAmount(price);
	const displayTiers = getDisplayTiers(price);

	let result: number;
	if (price.billing_model === BILLING_MODEL.PACKAGE) {
		result = parseFloat(displayAmount);
	} else if (price.billing_model === BILLING_MODEL.TIERED) {
		result = parseFloat(String(displayTiers?.[0]?.flat_amount || '0'));
	} else {
		result = parseFloat(displayAmount);
	}

	return result;
};

export const calculateDiscountedPrice = (price: Price, coupon: any) => {
	if (!coupon || price.type !== 'FIXED') return null;

	const originalAmount = parseFloat(price.amount);
	let discountedAmount = originalAmount;

	if (coupon.type === 'fixed') {
		// Fixed amount discount
		const discountAmount = parseFloat(coupon.amount_off || '0');
		discountedAmount = Math.max(0, originalAmount - discountAmount);
	} else if (coupon.type === 'percentage') {
		// Percentage discount
		const discountPercentage = parseFloat(coupon.percentage_off || '0');
		discountedAmount = originalAmount * (1 - discountPercentage / 100);
	}

	return {
		originalAmount,
		discountedAmount,
		savings: originalAmount - discountedAmount,
	};
};
