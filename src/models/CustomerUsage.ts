import { Entitlement, ENTITLEMENT_GRANT_DURATION_UNIT, ENTITLEMENT_GRANT_MEASURE, GrantAllowanceState, GrantState } from './Entitlement';
import { JsonObject } from '@/types/common';
import { BaseModel } from './base';
import Feature from './Feature';

// Entity type as returned from backend (lowercase)
export enum ENTITLEMENT_SOURCE_ENTITY_TYPE {
	PLAN = 'plan',
	ADDON = 'addon',
	SUBSCRIPTION = 'subscription',
}

interface CustomerUsage extends BaseModel {
	readonly feature: Feature;
	readonly total_limit: number | null;
	readonly is_unlimited: boolean;
	readonly current_usage: number;
	readonly usage_percent: number;
	readonly is_enabled: boolean;
	readonly is_soft_limit: boolean;
	readonly next_usage_reset_at: string | null;
	readonly sources: EntitlementSource[];
	/** Per-window ledger for grant-backed features; absent for legacy entitlements. */
	readonly grant_state?: GrantState;
	/**
	 * One entry per independent budget on a parallel feature. The scalars above cannot
	 * describe several at once — a sum is not spendable from any one of them — so a
	 * parallel feature is rendered from these. Absent for additive features.
	 */
	readonly buckets?: EntitlementBudget[];
	/**
	 * The rule the windows are cut from. Sent for an additive feature; a parallel one
	 * carries one config per budget in `buckets` instead.
	 */
	readonly grant_quota?: string;
	readonly grant_duration_value?: number;
	readonly grant_duration_unit?: ENTITLEMENT_GRANT_DURATION_UNIT;
	readonly grant_measure?: ENTITLEMENT_GRANT_MEASURE;
	readonly grant_unlimited?: boolean;
}

/** One independent budget within a parallel feature. */
export interface EntitlementBudget {
	readonly entitlement_id: string;
	readonly source_entity_id: string;
	readonly usage_limit?: number | null;
	readonly grant_measure?: ENTITLEMENT_GRANT_MEASURE;
	readonly grant_quota?: string;
	readonly grant_duration_value?: number;
	readonly grant_duration_unit?: ENTITLEMENT_GRANT_DURATION_UNIT;
	readonly grant_unlimited?: boolean;
}

export interface EntitlementSource {
	readonly subscription_id: string;
	readonly entity_id: string;
	readonly entity_type: ENTITLEMENT_SOURCE_ENTITY_TYPE;
	readonly quantity: number;
	readonly entity_name: string;
	readonly entitlement_id: string;
	readonly is_enabled: boolean;
	readonly usage_limit: number | null;
	readonly static_value: string | null;
	readonly usage_reset_period: string | null;
	readonly config_value?: JsonObject | null;
	// Legacy fields for backward compatibility
	readonly plan_id?: string;
	readonly plan_name?: string;
}

export default CustomerUsage;

/** A subscription entitlement grant for usage views: a dollar allowance over every usage line, and its windows. */
export interface SubscriptionEntitlementGrantUsage {
	readonly subscription_id: string;
	readonly currency: string;
	readonly entitlement: Entitlement;
	readonly allowances: GrantAllowanceState[];
}
