import { JsonObject } from '@/types/common';
import { BaseModel } from './base';
import Feature from './Feature';

export enum ENTITLEMENT_USAGE_RESET_PERIOD {
	MONTHLY = 'MONTHLY',
	ANNUAL = 'ANNUAL',
	WEEKLY = 'WEEKLY',
	DAILY = 'DAILY',
	QUARTERLY = 'QUARTERLY',
	HALF_YEARLY = 'HALF_YEARLY',
	NEVER = 'NEVER',
}

/** Counter a grant window tracks: raw meter units, or priced currency. */
export enum ENTITLEMENT_GRANT_MEASURE {
	QUANTITY = 'quantity',
	AMOUNT = 'amount',
}

/**
 * How long one allowance window lasts. `subscription_period` means the window is
 * the billing cycle itself — the shape a non-recurring allowance takes, and the
 * only one an unlimited allowance may use.
 */
export enum ENTITLEMENT_GRANT_DURATION_UNIT {
	HOUR = 'hour',
	DAY = 'day',
	WEEK = 'week',
	SUBSCRIPTION_PERIOD = 'subscription_period',
}

/** Where a window starts: at the customer's first event, or on the calendar boundary. */
export enum ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR {
	FIRST_USAGE = 'first_usage',
	UNIT_START = 'unit_start',
}

/** How several entitlements on one feature combine. */
export enum ENTITLEMENT_AGGREGATION_MODE {
	/** Quotas sum into a single shared window. */
	ADDITIVE = 'additive',
	/** Each entitlement keeps its own independent window. */
	PARALLEL = 'parallel',
}

export enum ENTITLEMENT_GRANT_STATUS {
	ACTIVE = 'active',
	EXHAUSTED = 'exhausted',
}

export enum ENTITLEMENT_ENTITY_TYPE {
	PLAN = 'PLAN',
	SUBSCRIPTION = 'SUBSCRIPTION',
	ADDON = 'ADDON',
}

export interface Entitlement extends BaseModel {
	readonly feature: Feature;
	readonly feature_id: string;
	readonly feature_type: string;
	readonly is_enabled: boolean;
	readonly is_soft_limit: boolean;
	readonly entity_type: ENTITLEMENT_ENTITY_TYPE;
	readonly entity_id: string;
	readonly static_value: string;
	readonly tenant_id: string;
	readonly usage_limit: number | null;
	readonly usage_reset_period: ENTITLEMENT_USAGE_RESET_PERIOD | null;
	readonly display_order?: number;
	readonly parent_entitlement_id?: string;
	/** ISO date string. Optional start date for the entitlement. */
	readonly start_date?: string;
	/** ISO date string. Optional end date for the entitlement. */
	readonly end_date?: string;
	readonly config_value?: JsonObject | null;

	// --- Grant config ---
	// Present together or not at all. Their presence is what makes an entitlement
	// grant-based; `grant_quota` unset with a subscription_period duration means
	// unlimited.
	readonly grant_measure?: ENTITLEMENT_GRANT_MEASURE;
	readonly grant_quota?: string | null;
	readonly grant_duration_value?: number | null;
	readonly grant_duration_unit?: ENTITLEMENT_GRANT_DURATION_UNIT;
	readonly grant_allocation_behavior?: ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR;
	readonly aggregation_mode?: ENTITLEMENT_AGGREGATION_MODE;
}

/** True when this entitlement is grant-based rather than a legacy cycle quota. */
export const hasGrantConfig = (e?: Partial<Entitlement> | null): boolean =>
	Boolean(e && (e.grant_quota != null || e.grant_duration_value != null || e.grant_measure || e.grant_duration_unit));

/** Grant-based with no ceiling. Distinct from a legacy unlimited (`usage_limit: null`). */
export const isUnlimitedGrant = (e?: Partial<Entitlement> | null): boolean => hasGrantConfig(e) && e?.grant_quota == null;

/**
 * One materialized allowance window, as returned in `grant_state`.
 * `usage` is a snapshot refreshed by a background pass — render `last_computed_at`
 * rather than implying it is live.
 */
export interface GrantWindowState {
	readonly grant_id: string;
	readonly entitlement_id: string;
	readonly measure: ENTITLEMENT_GRANT_MEASURE;
	/** No ceiling: `quota` and `remaining` are meaningless, render "Unlimited". */
	readonly unlimited: boolean;
	readonly quota: string;
	readonly usage: string;
	readonly remaining: string;
	readonly valid_from: string;
	readonly valid_to: string;
	readonly status: ENTITLEMENT_GRANT_STATUS;
	/** Open right now, decided by the server's clock rather than the client's. */
	readonly is_active: boolean;
	readonly last_computed_at?: string;
}

export interface GrantCycleTotals {
	readonly windows: number;
	readonly total_quota: string;
	readonly total_usage: string;
	readonly total_overage: string;
}

export interface GrantState {
	/**
	 * Every window overlapping the current billing period, closed ones included,
	 * oldest first — the ledger behind `cycle_totals`. A grant-backed feature
	 * bills per window, so this is what makes a cycle total explicable. The live
	 * balance is the entry (or entries, for parallel features) with `active`.
	 */
	readonly windows: GrantWindowState[];
	readonly cycle_totals?: GrantCycleTotals;
}
