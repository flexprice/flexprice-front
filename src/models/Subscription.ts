import Customer from './Customer';
import { BILLING_CADENCE, INVOICE_CADENCE } from './Invoice';
import { BILLING_PERIOD } from '@/constants/constants';
import { Plan } from './Plan';
import { CreditGrant } from './CreditGrant';
import { BaseModel, ENTITY_STATUS, Metadata } from './base';
import { Price } from './Price';

export interface LineItem extends BaseModel {
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
	readonly metadata: Metadata;
	readonly price?: Price;
}

export interface Pause extends BaseModel {
	readonly id: string;
	readonly subscription_id: string;
	readonly environment_id: string;
	readonly tenant_id: string;
	readonly pause_start: string;
	readonly pause_end: string;
	readonly pause_status: PauseStatus;
	readonly pause_mode: SUBSCRIPTION_PAUSE_MODE;
	readonly resume_mode: RESUME_MODE;
	readonly reason: string;
	readonly original_period_start: string;
	readonly original_period_end: string;
	readonly resumed_at: string;
	readonly metadata: Metadata;
	readonly status: ENTITY_STATUS;
}

export interface Subscription extends BaseModel {
	readonly id: string;
	readonly lookup_key: string;
	readonly customer_id: string;
	readonly plan_id: string;
	readonly environment_id: string;
	readonly tenant_id: string;
	readonly subscription_status: SUBSCRIPTION_STATUS;
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
	readonly pause_status: PauseStatus;
	readonly metadata: Metadata;
	readonly customer: Customer;
	readonly billing_cycle: BILLING_CYCLE;
	readonly line_items: LineItem[];
	readonly plan: Plan;
	readonly pauses: Pause[];

	// experimental fields
	credit_grants?: CreditGrant[];
	commitment_amount?: number;
	overage_factor?: number;

	// Subscription phases
	readonly phases?: SubscriptionPhase[];

	// experimental fields
	readonly schedule: Schedule;
}

export interface SubscriptionUsage extends BaseModel {
	readonly amount: number;
	readonly currency: string;
	readonly display_amount: string;
	readonly start_time: Date;
	readonly end_time: Date;
	readonly charges: SubscriptionUsageByMeters[];
	readonly commitment_amount?: number;
	readonly overage_factor?: number;
	readonly commitment_utilized?: number; // Amount of commitment used
	readonly overage_amount?: number; // Amount charged at overage rate
	readonly has_overage: boolean; // Whether any usage exceeded commitment
}

export interface SubscriptionUsageByMeters extends BaseModel {
	readonly amount: number;
	readonly currency: string;
	readonly display_amount: string;
	readonly quantity: number;
	readonly filter_values: Metadata;
	readonly meter_id: string;
	readonly meter_display_name: string;
	readonly price: Price;
	readonly is_overage: boolean; // Whether this charge is at overage rate
	readonly overage_factor?: number; // Factor applied to this charge if in overage
}

export interface SubscriptionUpdatePeriodResponse {
	total_success: number;
	total_failed: number;
	items: SubscriptionUpdatePeriodResponseItem[];
	start_at: Date;
}

export interface SubscriptionUpdatePeriodResponseItem {
	subscription_id: string;
	period_start: Date;
	period_end: Date;
	success: boolean;
	error?: string;
}

export interface Charge extends BaseModel {
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

export interface SubscriptionPhase extends BaseModel {
	readonly id: string;
	readonly subscription_id: string;
	readonly start_date: string;
	readonly end_date?: string | null;
	readonly metadata?: Metadata;
	readonly environment_id: string;
}

export interface Schedule extends BaseModel {
	readonly id: string;
	readonly subscription_id: string;
	readonly status: ENTITY_STATUS;
	readonly current_phase_index: number;
	readonly end_behavior: string;
	readonly start_date: string;
	readonly phases: readonly SubscriptionPhase[];
	readonly metadata: Metadata;
}

export enum SUBSCRIPTION_STATUS {
	ACTIVE = 'active',
	PAUSED = 'paused',
	CANCELLED = 'cancelled',
	INCOMPLETE = 'incomplete',
	INCOMPLETE_EXPIRED = 'incomplete_expired',
	PAST_DUE = 'past_due',
	TRIALING = 'trialing',
	UNPAID = 'unpaid',
}

// PaymentBehavior determines how subscription payments are handled
export enum PAYMENT_BEHAVIOR {
	// Immediately attempts payment. If fails, subscription becomes incomplete
	ALLOW_INCOMPLETE = 'allow_incomplete',
	// Always creates incomplete subscription if payment required
	DEFAULT_INCOMPLETE = 'default_incomplete',
	// Fails subscription creation if payment fails
	ERROR_IF_INCOMPLETE = 'error_if_incomplete',
	// Creates active subscription without payment attempt
	DEFAULT_ACTIVE = 'default_active',
}

// CollectionMethod determines how invoices are collected for subscriptions
export enum COLLECTION_METHOD {
	// Automatically charge payment method
	CHARGE_AUTOMATICALLY = 'charge_automatically',
	// Send invoice to customer for manual payment
	SEND_INVOICE = 'send_invoice',
}

// SubscriptionLineItemEntityType is the type of the source of a subscription line item
export enum SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE {
	PLAN = 'plan',
	ADDON = 'addon',
}

// SubscriptionChangeType defines the type of subscription change
export enum SUBSCRIPTION_CHANGE_TYPE {
	UPGRADE = 'upgrade',
	DOWNGRADE = 'downgrade',
	LATERAL = 'lateral',
}

// PauseStatus represents the pause state of a subscription
export enum PauseStatus {
	// PauseStatusNone indicates the subscription is not paused
	PauseStatusNone = 'none',
	// PauseStatusActive indicates the subscription is currently paused
	PauseStatusActive = 'active',
	// PauseStatusScheduled indicates the subscription is scheduled to be paused
	PauseStatusScheduled = 'scheduled',
	// PauseStatusCompleted indicates the pause has been completed (subscription resumed)
	PauseStatusCompleted = 'completed',
	// PauseStatusCancelled indicates the pause was cancelled
	PauseStatusCancelled = 'cancelled',
}

export enum SUBSCRIPTION_PAUSE_MODE {
	IMMEDIATE = 'immediate',
	SCHEDULED = 'scheduled',
	PERIOD_END = 'period_end',
}

export enum RESUME_MODE {
	IMMEDIATE = 'immediate',
	SCHEDULED = 'scheduled',
	AUTO = 'auto',
}

/**
 * ProrationAction defines the type of change triggering proration.
 */
export enum SUBSCRIPTION_PRORATION_ACTION {
	UPGRADE = 'upgrade',
	DOWNGRADE = 'downgrade',
	QUANTITY_CHANGE = 'quantity_change',
	CANCELLATION = 'cancellation',
	ADD_ITEM = 'add_item',
	REMOVE_ITEM = 'remove_item',
}

/**
 * ProrationStrategy defines how the proration coefficient is calculated.
 */
export enum SUBSCRIPTION_PRORATION_STRATEGY {
	DAY_BASED = 'day_based', // Default
	SECOND_BASED = 'second_based', // Future enhancement
}

/**
 * ProrationBehavior defines how proration is applied (e.g., create invoice items).
 */
export enum SUBSCRIPTION_PRORATION_BEHAVIOR {
	CREATE_PRORATIONS = 'create_prorations', // Default: Create credits/charges on invoice
	NONE = 'none', // Calculate but don't apply (e.g., for previews)
}

export enum SUBSCRIPTION_CANCELLATION_TYPE {
	IMMEDIATE = 'immediate',
	END_OF_PERIOD = 'end_of_period',
}
