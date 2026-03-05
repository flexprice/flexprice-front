import { BaseModel, Metadata } from './base';
import { BILLING_CADENCE, INVOICE_CADENCE } from './Invoice';
import { Meter } from './Meter';
import { Group } from './Group';

export interface Price extends BaseModel {
	readonly amount: string;
	readonly display_amount: string;
	readonly currency: string;
	readonly entity_type: PRICE_ENTITY_TYPE;
	readonly entity_id: string;
	readonly type: PRICE_TYPE;
	readonly price_unit_type: PRICE_UNIT_TYPE;
	readonly price_unit_id?: string;
	readonly price_unit_amount?: string;
	readonly display_price_unit_amount?: string;
	readonly price_unit?: string;
	readonly conversion_rate?: string;
	readonly billing_period: BILLING_PERIOD;
	readonly billing_period_count: number;
	readonly billing_model: BILLING_MODEL;
	readonly display_name: string;
	readonly billing_cadence: BILLING_CADENCE;
	readonly tier_mode: TIER_MODE;
	readonly tiers: Tier[] | null;
	readonly price_unit_tiers?: Tier[] | null;
	readonly meter_id: string;
	readonly filter_values: Record<string, string[]> | null;
	readonly lookup_key: string;
	readonly description: string;
	readonly transform_quantity: TransformQuantity | null;
	readonly meter?: Meter;
	readonly invoice_cadence: INVOICE_CADENCE;
	readonly trial_period: number;
	readonly start_date?: string;
	readonly end_date?: string;
	readonly metadata: Metadata | null;
	readonly price_unit_config?: PriceUnitConfig;
	readonly parent_price_id?: string;
	readonly group_id?: string;
	/** Expanded from API when price is included with group */
	readonly group?: Group;
	readonly min_quantity?: number;
}

export interface Tier {
	readonly flat_amount: string;
	readonly unit_amount: string;
	readonly up_to: number;
}

export interface TransformQuantity {
	readonly divide_by: number;
	readonly round?: 'up' | 'down';
}

export interface PriceUnitConfig {
	// Amount is the price amount in the custom price unit (optional)
	// Required when billing_model is FLAT_FEE or PACKAGE with custom price unit
	readonly amount?: string;
	/**
	 * The price unit code (3 characters, e.g., "BTC", "TOK", "CRD")
	 * This is the unique identifier for the price unit, not the full PriceUnit object
	 * Required when using custom price unit type
	 */
	readonly price_unit: string;
	// PriceUnitTiers are the pricing tiers for custom price units
	// Required when billing_model is TIERED with custom price unit
	readonly price_unit_tiers?: CreatePriceTier[];
}

export interface CreatePriceTier {
	readonly up_to?: number | null;
	readonly unit_amount: string;
	readonly flat_amount?: string;
}

export enum BILLING_MODEL {
	FLAT_FEE = 'FLAT_FEE',
	PACKAGE = 'PACKAGE',
	TIERED = 'TIERED',
}

export enum PRICE_TYPE {
	USAGE = 'USAGE',
	FIXED = 'FIXED',
}

export enum PRICE_UNIT_TYPE {
	FIAT = 'FIAT',
	CUSTOM = 'CUSTOM',
}

export enum PRICE_ENTITY_TYPE {
	PLAN = 'PLAN',
	ADDON = 'ADDON',
	FEATURE = 'FEATURE',
	METER = 'METER',
	COST_SHEET = 'COSTSHEET',
	SUBSCRIPTION = 'SUBSCRIPTION',
}

export enum TIER_MODE {
	VOLUME = 'VOLUME',
	SLAB = 'SLAB',
}

export enum BILLING_PERIOD {
	MONTHLY = 'MONTHLY',
	ANNUAL = 'ANNUAL',
	WEEKLY = 'WEEKLY',
	DAILY = 'DAILY',
	QUARTERLY = 'QUARTERLY',
	HALF_YEARLY = 'HALF_YEARLY',
}

export enum PRICE_STATUS {
	UPCOMING = 'upcoming',
	INACTIVE = 'inactive',
	ACTIVE = 'active',
}
