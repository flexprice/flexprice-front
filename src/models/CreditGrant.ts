import { BILLING_CADENCE } from './Invoice';

export enum CREDIT_SCOPE {
	PLAN = 'PLAN',
	SUBSCRIPTION = 'SUBSCRIPTION',
}

export interface CreditGrant {
	readonly id: string;

	// this is the amount of the credit grant in the currency of the subscription
	readonly credits: number;
	readonly cadence: BILLING_CADENCE;
	readonly currency: string;
	readonly metadata: Record<string, any>;
	readonly name: string;
	readonly period?: CREDIT_GRANT_PERIOD;
	readonly period_count: number;
	readonly plan_id: string;
	readonly priority: number;
	readonly scope: CREDIT_SCOPE;
	readonly expiration_duration?: number;
	readonly expiration_type: CREDIT_GRANT_EXPIRATION_TYPE;
	readonly expiration_duration_unit?: CREDIT_GRANT_PERIOD_UNIT;
	readonly subscription_id: string;
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
