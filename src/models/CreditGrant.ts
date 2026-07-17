import { BaseModel, Metadata } from './base';

export enum CREDIT_GRANT_SCOPE {
	PLAN = 'PLAN',
	SUBSCRIPTION = 'SUBSCRIPTION',
	ADDON = 'ADDON',
}

export interface CreditGrant extends BaseModel {
	readonly credits: number;
	readonly cadence: CREDIT_GRANT_CADENCE;
	readonly metadata: Metadata;
	readonly name: string;
	readonly period?: CREDIT_GRANT_PERIOD;
	readonly period_count?: number;
	readonly plan_id?: string;
	readonly addon_id?: string;
	readonly priority?: number;
	readonly scope: CREDIT_GRANT_SCOPE;
	readonly expiration_duration?: number;
	readonly expiration_type?: CREDIT_GRANT_EXPIRATION_TYPE;
	readonly expiration_duration_unit?: CREDIT_GRANT_PERIOD_UNIT;
	readonly subscription_id?: string;
	readonly conversion_rate?: number;
	readonly topup_conversion_rate?: number;
	/** ISO date string. Present for SUBSCRIPTION-scoped grants. */
	readonly start_date?: string;
	/** ISO date string. Optional end date for the grant. */
	readonly end_date?: string;
	/** ISO date string. Anchor date for recurring credit grant applications. */
	readonly credit_grant_anchor?: string;
}

export enum CREDIT_GRANT_CADENCE {
	ONETIME = 'ONETIME',
	RECURRING = 'RECURRING',
}

export enum CREDIT_GRANT_EXPIRATION_TYPE {
	NEVER = 'NEVER',
	DURATION = 'DURATION',
	BILLING_CYCLE = 'BILLING_CYCLE',
}

export enum CREDIT_GRANT_PERIOD_UNIT {
	DAYS = 'DAY',
	WEEKS = 'WEEK',
	MONTHS = 'MONTH',
	YEARS = 'YEAR',
}

export enum CREDIT_GRANT_PERIOD {
	DAILY = 'DAILY',
	WEEKLY = 'WEEKLY',
	MONTHLY = 'MONTHLY',
	ANNUAL = 'ANNUAL',
	QUARTERLY = 'QUARTERLY',
	HALF_YEARLY = 'HALF_YEARLY',
}
