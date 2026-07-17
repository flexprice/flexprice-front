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
