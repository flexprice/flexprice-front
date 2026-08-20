import { INVOICE_CADENCE, BUCKET_SIZE_NONE } from '@/constants';
import {
	Price,
	BILLING_MODEL,
	BILLING_PERIOD,
	PRICE_TYPE,
	PRICE_UNIT_TYPE,
	TIER_MODE,
	PRICE_ENTITY_TYPE,
	Plan,
	Addon,
	Feature,
	Meter,
	Metadata,
	Pagination,
	PriceUnit,
	BUCKET_SIZE,
} from '@/models';
import { QueryFilter, TimeRangeFilter } from './base';
import type { TypedBackendFilter, TypedBackendSort } from '@/types/formatters/QueryBuilder';

export interface CreateBulkPriceRequest {
	items: CreatePriceRequest[];
}

export interface GetAllPricesResponse extends Pagination {
	items: PriceResponse[];
}

/** Backend filter format for price search API (matches TypedBackendFilter). */
export type SearchPricesFilter = TypedBackendFilter;

export interface SearchPricesRequest {
	/** Optional: scope by entity (e.g. plan). When omitted, scope via filters (e.g. group_id eq). */
	entity_ids?: string[];
	entity_type?: PRICE_ENTITY_TYPE;
	filters?: TypedBackendFilter[];
	sorts?: TypedBackendSort[];
	allow_expired_prices?: boolean;
	expand?: string;
	limit?: number | null;
	offset?: number;
}

export interface SearchPricesResponse {
	items: PriceResponse[];
	pagination?: { total?: number; limit?: number; offset?: number };
}

export interface PriceFilter extends QueryFilter, TimeRangeFilter {
	price_ids?: string[];
	entity_type?: PRICE_ENTITY_TYPE;
	entity_ids?: string[];
	subscription_id?: string;
	parent_price_id?: string;
	meter_ids?: string[];
	start_date_lt?: string; // ISO date string
}

export interface CreatePriceRequest {
	amount?: string;
	currency: string;
	plan_id?: string; // TODO: This is deprecated and will be removed in the future
	entity_type: PRICE_ENTITY_TYPE;
	entity_id: string;
	type: PRICE_TYPE;
	price_unit_type: PRICE_UNIT_TYPE;
	billing_period?: BILLING_PERIOD;
	billing_period_count?: number; // defaults to 1
	billing_model: BILLING_MODEL;
	meter_id?: string;
	filter_values?: Record<string, string[]>;
	lookup_key?: string;
	invoice_cadence: INVOICE_CADENCE;
	trial_period_days?: number;
	description?: string;
	display_name?: string;
	metadata?: Metadata;
	tier_mode?: TIER_MODE;
	tiers?: CreatePriceTier[];
	transform_quantity?: TransformQuantity;
	// PriceUnitConfig is required when price_unit_type is CUSTOM
	price_unit_config?: PriceUnitConfig;
	start_date?: string; // ISO date string
	end_date?: string; // ISO date string
	group_id?: string;
	min_quantity?: number;
	/** Windows usage into fixed-size buckets before aggregation (USAGE prices only). Omit for no bucketing. */
	bucket_size?: BUCKET_SIZE;
}

export interface GetPriceResponse extends Price {
	plan: Plan;
	addon: Addon;
	feature: Feature;
	meter: Meter;
}

export interface CreatePriceTier {
	// up_to is the quantity up to which this tier applies. It is null for the last tier.
	// IMPORTANT: Tier boundaries are INCLUSIVE.
	// - If up_to is 1000, then quantity less than or equal to 1000 belongs to this tier
	// - This behavior is consistent across both VOLUME and SLAB tier modes
	up_to?: number | null;
	unit_amount: string;
	flat_amount?: string;
}

export interface PriceUnitConfig {
	// Amount is the price amount in the custom price unit (optional)
	// Required when billing_model is FLAT_FEE or PACKAGE with custom price unit
	amount?: string;
	/**
	 * The price unit code (3 characters, e.g., "BTC", "TOK", "CRD")
	 * This is the unique identifier for the price unit, not the full PriceUnit object
	 * Required when using custom price unit type
	 */
	price_unit: string;
	// PriceUnitTiers are the pricing tiers for custom price units
	// Required when billing_model is TIERED with custom price unit
	price_unit_tiers?: CreatePriceTier[];
}

export interface TransformQuantity {
	divide_by: number;
	round?: 'up' | 'down';
}

// Additional DTOs for bulk operations and responses
export interface CreateBulkPriceResponse {
	items: PriceResponse[];
}

// Response types for individual price operations
export interface PriceResponse extends Price {
	pricing_unit?: PriceUnit;
	meter?: Meter;
	plan?: Plan;
	addon?: Addon;
}

// Delete price request
export interface DeletePriceRequest {
	end_date?: string; // ISO date string
}

// Cost breakup for detailed pricing information
export interface CostBreakup {
	// EffectiveUnitCost is the per-unit cost based on the applicable tier
	effective_unit_cost: string;
	// SelectedTierIndex is the index of the tier that was applied (-1 if no tiers)
	selected_tier_index: number;
	// TierUnitAmount is the unit amount of the selected tier
	tier_unit_amount: string;
	// FinalCost is the total cost for the quantity
	final_cost: string;
}

export interface UpdatePriceRequest {
	// Non-critical fields (can be updated directly)
	lookup_key?: string;
	description?: string;
	metadata?: Metadata;
	display_name?: string;
	effective_from?: string; // ISO date string

	// Critical fields (require creating a new price)
	billing_model?: BILLING_MODEL;
	amount?: string;
	tier_mode?: TIER_MODE;
	tiers?: CreatePriceTier[];
	transform_quantity?: TransformQuantity;

	// PriceUnitAmount is the price unit amount (for CUSTOM price unit type, FLAT_FEE/PACKAGE billing models)
	price_unit_amount?: string;

	// PriceUnitTiers are the price unit tiers (for CUSTOM price unit type, TIERED billing model)
	price_unit_tiers?: CreatePriceTier[];

	// GroupID is the id of the group to update the price in
	group_id?: string;

	/**
	 * Changing this creates a new price (parent_price_id points at the old one, which is end-dated)
	 * rather than patching in place - callers must re-fetch after a successful update instead of
	 * merging the response into existing state. Send BUCKET_SIZE_NONE (the literal string "none")
	 * to remove bucketing from the price entirely; omit the field to leave it unchanged.
	 */
	bucket_size?: BUCKET_SIZE | typeof BUCKET_SIZE_NONE;
}
