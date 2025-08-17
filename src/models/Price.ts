import { BaseModel } from './base';
import { BILLING_CADENCE, INVOICE_CADENCE } from './Invoice';
import { Meter } from './Meter';
import { PriceUnit } from './PriceUnit';

export interface Price extends BaseModel {
	readonly amount: string;
	readonly display_amount: string;
	readonly currency: string;
	readonly entity_type: PRICE_ENTITY_TYPE;
	readonly entity_id: string;
	readonly type: PRICE_TYPE;
	readonly price_unit_type: PRICE_UNIT_TYPE;
	readonly billing_period: BILLING_PERIOD;
	readonly billing_period_count: number;
	readonly billing_model: BILLING_MODEL;
	readonly billing_cadence: BILLING_CADENCE;
	readonly tier_mode: TIER_MODE;
	readonly tiers: Tier[] | null;
	readonly meter_id: string;
	readonly filter_values: Record<string, string[]> | null;
	readonly lookup_key: string;
	readonly description: string;
	readonly transform_quantity: TransformQuantity | null;
	readonly meter: Meter;
	readonly invoice_cadence: INVOICE_CADENCE;
	readonly trial_period: number;
	readonly metadata: Record<string, string> | null;
	readonly price_unit_config?: PriceUnitConfig;
	readonly pricing_unit?: PriceUnit;
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
	readonly amount?: string;
	readonly price_unit: string;
	readonly price_unit_tiers?: CreatePriceTier[];
}

export interface CreatePriceTier {
	readonly up_to?: number;
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
