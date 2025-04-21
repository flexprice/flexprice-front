import Customer from './Customer';
import { Plan } from './Plan';

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
	readonly billing_cadence: string;
	readonly billing_period: string;
	readonly billing_period_count: number;
	readonly invoice_cadence: string;
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
	readonly billing_cycle: string;
	readonly line_items: LineItem[];
	readonly pauses: Pause[];
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
