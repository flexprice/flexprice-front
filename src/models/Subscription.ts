import Customer from './Customer';
import { BILLING_CADENCE, INVOICE_CADENCE } from './Invoice';
import { BILLING_PERIOD } from '@/constants/constants';
import { Plan } from './Plan';
import { CreditGrant } from './CreditGrant';
import { BaseModel, ENTITY_STATUS, Metadata } from './base';
import { Price, PRICE_TYPE } from './Price';
import { CommitmentTimeBucket } from '@/types/dto/CommitmentTimeBucket';

export interface SubscriptionCommitmentInfo {
	enable_true_up?: boolean;
	commitment_amount?: number;
	overage_factor?: number;
	commitment_duration?: string;
	currency?: string;
}

export interface LineItem extends BaseModel {
	readonly subscription_id: string;
	readonly customer_id: string;
	/** @deprecated Prefer entity_type + entity_id. When entity_type === 'plan', entity_id is the plan ID. */
	readonly plan_id?: string;
	readonly price_id: string;
	readonly meter_id: string;
	readonly environment_id: string;
	readonly tenant_id: string;
	readonly display_name: string;
	readonly plan_display_name: string;
	readonly meter_display_name: string;
	readonly price_type: PRICE_TYPE;
	readonly billing_period: string;
	readonly currency: string;
	readonly quantity: number;
	readonly start_date: string;
	readonly end_date: string;
	readonly metadata: Metadata;
	readonly price?: Price;
	readonly subscription_phase_id?: string;
	/** Source of the line item: plan, addon, or subscription (subscription-scoped price) */
	readonly entity_type?: SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE;
	/** ID of the source entity (plan_id, addon_id, or subscription_id) */
	readonly entity_id?: string;
	// Commitment fields
	readonly commitment_amount?: string | number;
	readonly commitment_quantity?: string;
	readonly commitment_type?: string;
	readonly commitment_overage_factor?: string;
	readonly commitment_true_up_enabled?: boolean;
	readonly commitment_windowed?: boolean;
	readonly commitment_duration?: string;
	readonly commitment_time_buckets?: CommitmentTimeBucket[];
}

export interface Subscription extends BaseModel {
	readonly id: string;
	readonly lookup_key: string;
	readonly customer_id: string;
	/** Read-only: API-resolved customer that receives invoices (may differ from subscriber when using hierarchy / inheritance). */
	readonly invoicing_customer_id?: string;
	/** Parent subscription ID when this subscription is a child (e.g. in parent-child subscription hierarchy) */
	readonly parent_subscription_id?: string;
	/** Hierarchy role: standalone, delegated_invoicing, parent, inherited (mirror), or grouped_invoicing. */
	readonly subscription_type?: SUBSCRIPTION_TYPE;
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
	readonly trial_period_days?: number | null;
	readonly billing_cadence?: BILLING_CADENCE;
	readonly billing_period: BILLING_PERIOD;
	readonly billing_period_count: number;
	readonly invoice_cadence: INVOICE_CADENCE;
	readonly version: number;
	readonly metadata: Metadata;
	readonly customer: Customer;
	readonly billing_cycle: BILLING_CYCLE;
	readonly line_items: LineItem[];
	readonly plan: Plan;

	// experimental fields
	credit_grants?: CreditGrant[];
	commitment_amount?: number;
	overage_factor?: number;
	enable_true_up?: boolean;

	/** Payment terms (e.g. 15 NET, 30 NET) used to compute invoice due date from period end */
	readonly payment_terms?: string;

	// Subscription phases
	readonly phases?: SubscriptionPhase[];

	// experimental fields
	readonly schedule: Schedule;

	// commitment duration
	readonly commitment_duration?: string;

	/** Usage-style subscriptions: optional threshold amount for auto-invoicing behavior (API-defined semantics). */
	readonly auto_invoice_threshold?: number;

	/** IANA timezone for billing period calculations; defaults to UTC when unset. */
	readonly timezone?: string;
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
	CANCELLED = 'cancelled',
	INCOMPLETE = 'incomplete',
	TRIALING = 'trialing',
	DRAFT = 'draft',
}

/** How this subscription participates in subscription hierarchy (backend subscription_type). */
export enum SUBSCRIPTION_TYPE {
	STANDALONE = 'standalone',
	/** Invoice raised to another customer; no parent subscription. */
	DELEGATED_INVOICING = 'delegated_invoicing',
	PARENT = 'parent',
	INHERITED = 'inherited',
	/** Own line items; invoice rolled into parent subscription. */
	GROUPED_INVOICING = 'grouped_invoicing',
}

/** Values shown in the subscription table “Hierarchy” column (maps from {@link SUBSCRIPTION_TYPE}; standalone → no chip). */
export enum SUBSCRIPTION_HIERARCHY_DISPLAY_KIND {
	INHERITED = 'inherited',
	PARENT = 'parent',
	GROUPED_INVOICING = 'grouped_invoicing',
	DELEGATED_INVOICING = 'delegated_invoicing',
}

/** Mid-cycle modify API: `POST /subscriptions/:id/modify/preview|execute` body `type`. */
export enum SUBSCRIPTION_MODIFY_TYPE {
	INHERITANCE = 'inheritance',
	QUANTITY_CHANGE = 'quantity_change',
	GROUPED_INVOICING = 'grouped_invoicing',
	COUPON = 'coupon',
	TAX = 'tax',
}

/** Payload `grouped_invoicing_params.action` for {@link SUBSCRIPTION_MODIFY_TYPE.GROUPED_INVOICING}. */
export enum GROUPED_INVOICING_MODIFY_ACTION {
	ADD = 'add',
	REMOVE = 'remove',
}

/** Payload `coupon_params.action` for {@link SUBSCRIPTION_MODIFY_TYPE.COUPON}. */
export enum SUB_MODIFY_COUPON_ACTION {
	ADD = 'add',
	REMOVE = 'remove',
}

/** Payload `tax_params.action` for {@link SUBSCRIPTION_MODIFY_TYPE.TAX}. */
export enum SUB_MODIFY_TAX_ACTION {
	ADD = 'add',
	REMOVE = 'remove',
}

/** Type alias for DTO fields that carry {@link SUBSCRIPTION_MODIFY_TYPE}. */
export type SubscriptionModifyType = SUBSCRIPTION_MODIFY_TYPE;

/** How a line item was affected (response `changed_resources.line_items`). */
export enum SUBSCRIPTION_MODIFY_LINE_ITEM_ACTION {
	CREATED = 'created',
	UPDATED = 'updated',
	ENDED = 'ended',
}

/** How a subscription row was affected (response `changed_resources.subscriptions`). */
export enum SUBSCRIPTION_MODIFY_SUBSCRIPTION_RESOURCE_ACTION {
	CREATED = 'created',
	UPDATED = 'updated',
}

/** How an invoice row was affected (response `changed_resources.invoices`). */
export enum SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION {
	CREATED = 'created',
	WALLET_CREDIT = 'wallet_credit',
}

/** Subscription edit page: which line-item editor is open. */
export enum SUBSCRIPTION_LINE_ITEM_EDIT_MODE {
	USAGE_OVERRIDE = 'usage_override',
	FIXED_QUANTITY = 'fixed_quantity',
	WINDOW_COMMITMENT = 'window_commitment',
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

// PaymentTerms (e.g. 15 NET, 30 NET) used to compute invoice due date from period end
export enum PAYMENT_TERMS {
	NET_15 = '15 NET',
	NET_30 = '30 NET',
	NET_45 = '45 NET',
	NET_60 = '60 NET',
	NET_75 = '75 NET',
	NET_90 = '90 NET',
}

// SubscriptionLineItemEntityType is the type of the source of a subscription line item
export enum SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE {
	PLAN = 'plan',
	ADDON = 'addon',
	SUBSCRIPTION = 'subscription',
}

// SubscriptionChangeType defines the type of subscription change
export enum SUBSCRIPTION_CHANGE_TYPE {
	UPGRADE = 'upgrade',
	DOWNGRADE = 'downgrade',
	LATERAL = 'lateral',
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
	/** Cancel on a specific future date (requires `cancel_at` on the cancel request). */
	SCHEDULED_DATE = 'scheduled_date',
}

export enum SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY {
	GENERATE_INVOICE = 'generate_invoice',
	SKIP = 'skip',
}
