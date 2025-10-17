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
}
