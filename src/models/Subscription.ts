import Customer from './Customer';
import { BILLING_CADENCE, INVOICE_CADENCE } from './Invoice';
import { BILLING_PERIOD } from '@/constants/constants';
import { Plan } from './Plan';
import { CreditGrant } from './CreditGrant';

export interface LineItem {
	readonly id: string;
	readonly subscription_id: string;
	readonly customer_id: string;
	readonly plan_id: string;
	readonly price_id: string;
	readonly meter_id: string;
	readonly environment_id: string;
	readonly tenant_id: string;
	readonly display_name: string;
	readonly plan_display_name: string;
	readonly meter_display_name: string;
	readonly price_type: string;
	readonly billing_period: string;
	readonly currency: string;
	readonly quantity: number;
	readonly start_date: string;
	readonly end_date: string;
	readonly metadata: Record<string, any>;
	readonly status: string;
	readonly created_at: string;
	readonly updated_at: string;
	readonly created_by: string;
	readonly updated_by: string;
}

export interface Pause {
	readonly id: string;
	readonly subscription_id: string;
	readonly environment_id: string;
	readonly tenant_id: string;
	readonly pause_start: string;
	readonly pause_end: string;
	readonly pause_status: any;
	readonly pause_mode: any;
	readonly resume_mode: any;
	readonly reason: string;
	readonly original_period_start: string;
	readonly original_period_end: string;
	readonly resumed_at: string;
	readonly metadata: Record<string, any>;
	readonly status: string;
	readonly created_at: string;
	readonly updated_at: string;
	readonly created_by: string;
	readonly updated_by: string;
}

export interface Subscription {
	readonly id: string;
	readonly lookup_key: string;
	readonly customer_id: string;
	readonly plan_id: string;
	readonly environment_id: string;
	readonly tenant_id: string;
	readonly subscription_status: string;
	readonly currency: string;
	readonly billing_anchor: string;
	readonly start_date: string;
	readonly end_date: string;
	readonly current_period_start: string;
	readonly current_period_end: string;
	readonly cancelled_at: string;
	readonly cancel_at: string;
	readonly cancel_at_period_end: boolean;
	readonly trial_start: string;
	readonly trial_end: string;
	readonly billing_cadence: BILLING_CADENCE;
	readonly billing_period: BILLING_PERIOD;
	readonly billing_period_count: number;
	readonly invoice_cadence: INVOICE_CADENCE;
	readonly version: number;
	readonly active_pause_id: string;
	readonly pause_status: string;
	readonly status: string;
	readonly metadata: Record<string, string>;
	readonly created_at: string;
	readonly updated_at: string;
	readonly created_by: string;
	readonly updated_by: string;
	readonly customer: Customer;
	readonly plan: Plan;
	readonly billing_cycle: BILLING_CYCLE;
	readonly line_items: LineItem[];
	readonly pauses: Pause[];

	// experimental fields
	credit_grants?: CreditGrant[];
	commitment_amount?: number;
	overage_factor?: number;

	// experimental fields
	readonly schedule: Schedule;
}

export interface SubscriptionUsage {
	readonly amount: number;
	readonly currency: string;
	readonly display_amount: string;
	readonly start_time: Date;
	readonly end_time: Date;
	readonly charges: Charge[];
}

export interface Charge {
	readonly amount: number;
	readonly currency: string;
	readonly display_amount: string;
	readonly quantity: number;
	readonly meter_display_name: string;
}

export enum BILLING_CYCLE {
	ANNIVERSARY = 'anniversary',
	CALENDAR = 'calendar',
}

export interface SubscriptionPhaseLineItem {
	price_id: string;
	quantity?: number;
	override_amount?: string;
}

export interface SubscriptionPhase {
	billing_cycle?: BILLING_CYCLE;
	start_date: Date | string;
	end_date: Date | null | string;
	line_items?: SubscriptionPhaseLineItem[];
	prorate_charges?: boolean;
	credit_grants?: CreditGrant[];
	commitment_amount?: number;
	overage_factor?: number;
}

export interface Schedule {
	readonly id: string;
	readonly subscription_id: string;
	readonly status: string;
	readonly current_phase_index: number;
	readonly end_behavior: string;
	readonly start_date: string;
	readonly phases: readonly SubscriptionPhase[];
	readonly created_at: string;
	readonly updated_at: string;
}
