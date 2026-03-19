import {
	BILLING_CADENCE,
	LineItem as InvoiceLineItem,
	BILLING_CYCLE,
	SUBSCRIPTION_STATUS,
	SubscriptionPhase,
	SUBSCRIPTION_PRORATION_BEHAVIOR,
	SUBSCRIPTION_CANCELLATION_TYPE,
	SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY,
	PAYMENT_BEHAVIOR,
	COLLECTION_METHOD,
	PAYMENT_TERMS,
	SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE,
	Metadata,
	Subscription,
	Pagination,
	BILLING_MODEL,
	TIER_MODE,
	CreatePriceTier,
	TransformQuantity,
	INVOICE_BILLING,
	PRICE_TYPE,
	PRICE_UNIT_TYPE,
	INVOICE_CADENCE,
} from '@/models';
import { PriceUnitConfig } from '@/types/dto/Price';
import { BILLING_PERIOD } from '@/constants/constants';
import { QueryFilter, TimeRangeFilter } from './base';
import { AddAddonToSubscriptionRequest } from './Addon';
import { Invoice } from '@/models/Invoice';
import { Coupon } from '@/models/Coupon';
import Customer from '@/models/Customer';

// Re-export existing enums for convenience
export { BILLING_PERIOD } from '@/constants/constants';

// SubscriptionFilter interface for listing subscriptions
export interface ListSubscriptionsPayload extends QueryFilter, TimeRangeFilter {
	subscription_ids?: string[];
	customer_id?: string;
	external_customer_id?: string;
	plan_id?: string;
	subscription_status?: SUBSCRIPTION_STATUS[];
	billing_cadence?: BILLING_CADENCE[];
	billing_period?: BILLING_PERIOD[];
	subscription_status_not_in?: SUBSCRIPTION_STATUS[];
	active_at?: string;
	with_line_items?: boolean;
	expand?: string;
	sort?: TypedBackendSort[];
	filters?: TypedBackendFilter[];
	/** Filters by parent subscription IDs (backend: parent_subscription_ids) */
	parent_subscription_ids?: string[];
	/** Filters by invoicing customer IDs (backend: invoicing_customer_ids) */
	invoicing_customer_ids?: string[];
}

import { TaxRateOverride } from './tax';
import { TypedBackendFilter, TypedBackendSort } from '../formatters/QueryBuilder';
import { CreateCreditGrantRequest } from './CreditGrant';
import { LineItemCommitmentsMap } from './LineItemCommitmentConfig';
import { AddonResponse } from './Addon';
import { ADDON_ASSOCIATION_STATUS } from '@/models/AddonAssociation';

export interface GetSubscriptionDetailsPayload {
	subscription_id: string;
	period_end?: string;
	period_start?: string;
}

export interface GetSubscriptionPreviewResponse {
	amount_due: number;
	amount_paid: number;
	amount_remaining: number;
	billing_reason: string;
	billing_sequence: number;
	created_at: string;
	created_by: string;
	currency: string;
	customer_id: string;
	description: string;
	due_date: string;
	finalized_at: string;
	id: string;
	idempotency_key: string;
	invoice_number: string;
	invoice_pdf_url: string;
	invoice_status: string;
	invoice_type: string;
	line_items: InvoiceLineItem[];
	metadata: Metadata;
	paid_at: string;
	payment_status: string;
	period_end: string;
	period_start: string;
	status: string;
	subscription_id: string;
	tenant_id: string;
	updated_at: string;
	updated_by: string;
	subtotal: number;
	total: number;
	version: number;
	voided_at: string;
	total_discount: number;
	total_tax: number;
}

export interface PauseSubscriptionPayload {
	dry_run?: boolean;
	metadata?: Metadata;
	pause_days?: number;
	pause_end?: string;
	pause_mode?: 'immediate';
	pause_start?: string;
	reason?: string;
}

export interface ResumeSubscriptionPayload {
	dry_run?: boolean;
	metadata?: Metadata;
	resume_mode?: 'immediate';
}

export interface SubscriptionPauseResponse {
	created_at: string;
	created_by: string;
	environment_id: string;
	id: string;
	metadata: Metadata;
	original_period_end: string;
	original_period_start: string;
	pause_end: string;
	pause_mode: string;
	pause_start: string;
	pause_status: string;
	reason: string;
	resume_mode: string;
	resumed_at: string;
	status: 'published';
	subscription_id: string;
	tenant_id: string;
	updated_at: string;
	updated_by: string;
}

// Since both responses have the same structure, we can reuse the interface
export type SubscriptionResumeResponse = SubscriptionPauseResponse;

export interface SubscriptionPause {
	id: string;
	subscription_id: string;
	pause_start: string;
	pause_end: string;
	pause_status: string;
	pause_mode: string;
	created_at: string;
	updated_at: string;
}

export interface ListSubscriptionPausesResponse {
	pauses: SubscriptionPause[];
	total: number;
}

// Subscription Change Types
export interface PreviewSubscriptionChangeRequest {
	target_plan_id?: string;
	billing_cadence?: string;
	billing_period?: string;
	billing_period_count?: number;
	billing_cycle?: string;
	change_at?: string;
	proration_behavior?: SUBSCRIPTION_PRORATION_BEHAVIOR;
	metadata?: Record<string, any>;
	override_line_items?: OverrideLineItemRequest[];
	entitlement_overrides?: EntitlementOverrideRequest[];
	line_item_commitments?: LineItemCommitmentsMap;
	enable_true_up?: boolean;
	invoice_behavior?: SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY;
}

export interface PreviewSubscriptionChangeResponse {
	subscription_id: string;
	current_plan: {
		id: string;
		name: string;
		lookup_key: string;
	};
	target_plan: {
		id: string;
		name: string;
		lookup_key: string;
	};
	change_type: string;
	proration_details: {
		credit_amount: string;
		credit_description: string;
		charge_amount: string;
		charge_description: string;
		net_amount: string;
		proration_date: string;
		current_period_start: string;
		current_period_end: string;
		days_used: number;
		days_remaining: number;
		currency: string;
	};
	next_invoice_preview: {
		subtotal: string;
		tax_amount: string;
		total: string;
		currency: string;
		line_items: {
			description: string;
			amount: string;
			quantity: string;
			unit_price: string;
			is_proration: boolean;
		}[];
	};
	effective_date: string;
	new_billing_cycle: {
		period_start: string;
		period_end: string;
		billing_anchor: string;
		billing_cadence: string;
		billing_period: string;
		billing_period_count: number;
	};
	warnings: string[];
}

export interface ExecuteSubscriptionChangeRequest {
	target_plan_id?: string;
	billing_cadence?: string;
	billing_period?: string;
	billing_period_count?: number;
	billing_cycle?: string;
	change_at?: string;
	proration_behavior?: SUBSCRIPTION_PRORATION_BEHAVIOR;
	metadata?: Record<string, any>;
	override_line_items?: OverrideLineItemRequest[];
	entitlement_overrides?: EntitlementOverrideRequest[];
	line_item_commitments?: LineItemCommitmentsMap;
	enable_true_up?: boolean;
	invoice_behavior?: SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY;
}

/** Minimal subscription summary returned by change/execute API */
export interface ExecuteSubscriptionChangeSubscriptionSummary {
	id: string;
	status: string;
	plan_id: string;
	current_period_start: string;
	current_period_end: string;
	billing_anchor: string;
	created_at: string;
}

/** Actual response shape from POST /subscriptions/:id/change/execute */
export interface ExecuteSubscriptionChangeResponse {
	is_scheduled?: boolean;
	old_subscription: ExecuteSubscriptionChangeSubscriptionSummary;
	new_subscription: ExecuteSubscriptionChangeSubscriptionSummary;
	change_type: string;
	effective_date: string;
	// Legacy shape (optional, for backward compatibility if backend varies)
	subscription?: SubscriptionResponse;
	proration_invoice?: Invoice;
	proration_details?: ProrationDetail[];
	message?: string;
}

export interface ScheduleUpdateBillingPeriodRequest {
	billing_period_start: string;
	billing_period_end: string;
}

export interface ListSubscriptionsResponse extends QueryFilter, TimeRangeFilter {
	items: SubscriptionResponse[];
	pagination: Pagination;
	sort: TypedBackendSort[];
	filters: TypedBackendFilter[];
}

export interface CancelSubscriptionPayload {
	proration_behavior?: SUBSCRIPTION_PRORATION_BEHAVIOR;
	cancellation_type: SUBSCRIPTION_CANCELLATION_TYPE;
	cancel_immediately_inovice_policy?: SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY;
	reason?: string;
}

// =============================================================================
// ENHANCED SUBSCRIPTION REQUEST/RESPONSE TYPES
// =============================================================================

export interface CreateSubscriptionRequest {
	// Customer identification - prioritized over external_customer_id if both provided
	customer_id?: string;
	external_customer_id?: string;
	invoice_billing?: INVOICE_BILLING;

	// Plan and billing configuration
	plan_id: string;
	currency: string;
	lookup_key?: string;
	start_date?: string;
	end_date?: string;
	trial_start?: string;
	trial_end?: string;
	billing_cadence: BILLING_CADENCE;
	billing_period: BILLING_PERIOD;
	billing_period_count?: number;
	metadata?: Metadata;

	// Billing cycle determines the billing anchor (anniversary vs calendar)
	billing_cycle?: BILLING_CYCLE;

	// Credit grants to be applied when subscription is created
	credit_grants?: CreateCreditGrantRequest[];

	// Commitment amount and overage factor
	commitment_amount?: number;
	overage_factor?: number;

	// Tax rate overrides
	tax_rate_overrides?: TaxRateOverride[];

	// Coupons
	coupons?: string[];
	line_item_coupons?: Record<string, string[]>;

	// Price overrides
	override_line_items?: OverrideLineItemRequest[];

	// Addons
	addons?: AddAddonToSubscriptionRequest[];

	// Subscription phases
	phases?: SubscriptionPhaseCreateRequest[];

	// Payment behavior configuration
	payment_behavior?: PAYMENT_BEHAVIOR;
	gateway_payment_method_id?: string;
	collection_method?: COLLECTION_METHOD;

	// PaymentTerms (e.g. 15 NET, 30 NET) used to compute invoice due date from period end
	payment_terms?: PAYMENT_TERMS;

	// Proration behavior
	proration_behavior?: SUBSCRIPTION_PRORATION_BEHAVIOR;

	// Customer timezone
	customer_timezone?: string;

	// Entitlement overrides
	override_entitlements?: EntitlementOverrideRequest[];

	// Line item commitments
	line_item_commitments?: LineItemCommitmentsMap;

	// True up flag
	enable_true_up: boolean;

	// Commitment duration (e.g., ANNUAL, MONTHLY) - defaults to billing period if not set
	commitment_duration?: BILLING_PERIOD;

	// Subscription status
	subscription_status?: SUBSCRIPTION_STATUS;

	// Extra line items at creation (in addition to plan prices). Each has price_id or inline price.
	line_items?: CreateSubscriptionLineItemRequest[];

	// Parent subscription ID when this subscription is a child in a hierarchy
	parent_subscription_id?: string | null;
}

export interface SubscriptionPhaseCreateRequest {
	start_date: string;
	end_date?: string;

	// Coupons represents subscription-level coupons to be applied to this phase
	coupons?: string[];

	// LineItemCoupons represents line item-level coupons (map of line_item_id to coupon IDs)
	line_item_coupons?: Record<string, string[]>;

	// OverrideLineItems allows customizing specific prices for this phase
	// If not provided, phase will use the same line items as the subscription (plan prices)
	override_line_items?: OverrideLineItemRequest[];

	metadata?: Metadata;
}

export interface SubscriptionCouponRequest {
	coupon_id: string;
	start_date: string;
	end_date?: string;
	line_item_id?: string;
	subscription_phase_id?: string;
}

export interface OverrideLineItemRequest {
	// PriceID references the plan price to override
	price_id: string;

	// Quantity for this line item (optional)
	quantity?: number;

	billing_model?: BILLING_MODEL;

	// Amount is the new price amount that overrides the original price (optional)
	// For FIAT price unit type, FLAT_FEE/PACKAGE billing models
	amount?: number;

	// TierMode determines how to calculate the price for a given quantity
	tier_mode?: TIER_MODE;

	// Tiers determines the pricing tiers for this line item
	// For FIAT price unit type, TIERED billing model
	tiers?: CreatePriceTier[];

	// TransformQuantity determines how to transform the quantity for this line item
	transform_quantity?: TransformQuantity;

	// PriceUnitAmount is the amount of the price unit (for CUSTOM type, FLAT_FEE/PACKAGE billing models)
	price_unit_amount?: string;

	// PriceUnitTiers are the tiers for the price unit (for CUSTOM type, TIERED billing model)
	price_unit_tiers?: CreatePriceTier[];
}

/** Request to update a subscription (PUT /subscriptions/:id). Omitted fields are unchanged; send "" or null to clear where supported. */
export interface UpdateSubscriptionRequest {
	status?: SUBSCRIPTION_STATUS;
	cancel_at?: string | null;
	cancel_at_period_end?: boolean;
	/** Set to another subscription ID to link as child; "" or null to clear; omit to leave unchanged */
	parent_subscription_id?: string | null;
}

export interface CancelSubscriptionRequest {
	proration_behavior?: SUBSCRIPTION_PRORATION_BEHAVIOR;
	cancellation_type: SUBSCRIPTION_CANCELLATION_TYPE;
	cancel_immediately_inovice_policy?: SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY;
	reason?: string;
}

export interface CancelSubscriptionResponse {
	subscription_id: string;
	cancellation_type: SUBSCRIPTION_CANCELLATION_TYPE;
	effective_date: string;
	status: SUBSCRIPTION_STATUS;
	reason?: string;
	proration_invoice?: Invoice;
	proration_details: ProrationDetail[];
	total_credit_amount: number;
	message: string;
	processed_at: string;
}

export interface ProrationDetail {
	line_item_id: string;
	price_id: string;
	plan_name?: string;
	original_amount: number;
	credit_amount: number;
	charge_amount: number;
	proration_days: number;
	description?: string;
}

export interface SubscriptionResponse extends Subscription {
	customer: Customer;
	coupon_associations?: Coupon[];
	phases?: SubscriptionPhaseResponse[];
	latest_invoice?: Invoice;
}

export interface SubscriptionScheduleResponse {
	id: string;
	subscription_id: string;
	status: string;
	current_phase_index: number;
	end_behavior: string;
	start_date: string;
	phases: SubscriptionPhase[];
	metadata: Metadata;
}

export interface GetUsageBySubscriptionRequest {
	subscription_id: string;
	start_time: string;
	end_time: string;
	lifetime_usage?: boolean;
}

export interface GetUsageBySubscriptionResponse {
	amount: number;
	currency: string;
	display_amount: string;
	start_time: string;
	end_time: string;
	charges: SubscriptionUsageByMetersResponse[];
	commitment_amount?: number;
	overage_factor?: number;
	commitment_utilized?: number;
	overage_amount?: number;
	has_overage: boolean;
}

export interface SubscriptionUsageByMetersResponse {
	amount: number;
	currency: string;
	display_amount: string;
	quantity: number;
	filter_values: Metadata;
	meter_id: string;
	meter_display_name: string;
	price: {
		id: string;
		amount?: string;
		currency: string;
	};
	is_overage: boolean;
	overage_factor?: number;
}
export interface AddAddonRequest {
	subscription_id: string;
	addon_id: string;
	quantity?: number;
	start_date?: string;
	end_date?: string;
	metadata?: Metadata;
	line_item_commitments?: LineItemCommitmentsMap;
}

export interface RemoveAddonRequest {
	addon_association_id: string;
	reason?: string;
}

export interface AddonAssociationResponse {
	id: string;
	environment_id: string;
	entity_id: string;
	entity_type: string;
	addon_id: string;
	start_date: string;
	end_date?: string;
	cancellation_reason?: string;
	cancelled_at?: string;
	addon_status: ADDON_ASSOCIATION_STATUS;
	tenant_id: string;
	status: string;
	created_at: string;
	updated_at: string;
	created_by: string;
	updated_by: string;
	addon?: AddonResponse;
	subscription?: SubscriptionResponse;
}

export interface ListAddonAssociationsResponse {
	items: AddonAssociationResponse[];
	pagination: Pagination;
}

// =============================================================================
// SUBSCRIPTION LINE ITEM TYPES
// =============================================================================

/** Inline price for subscription-scoped line items. Currency/entity_type/entity_id are set server-side from subscription. */
export interface SubscriptionPriceCreateRequest {
	type: PRICE_TYPE;
	price_unit_type: PRICE_UNIT_TYPE;
	billing_period: BILLING_PERIOD;
	billing_period_count?: number;
	billing_model: BILLING_MODEL;
	billing_cadence: BILLING_CADENCE;
	invoice_cadence: INVOICE_CADENCE;
	amount?: string;
	meter_id?: string;
	filter_values?: Record<string, string[]>;
	lookup_key?: string;
	trial_period?: number;
	description?: string;
	metadata?: Metadata;
	tier_mode?: TIER_MODE;
	tiers?: CreatePriceTier[];
	transform_quantity?: TransformQuantity;
	price_unit_config?: PriceUnitConfig;
	start_date?: string;
	end_date?: string;
	display_name?: string;
	min_quantity?: number;
}

export interface CreateSubscriptionLineItemRequest {
	/** Existing price ID. Exactly one of price_id or price must be set. */
	price_id?: string;
	/** Inline price; server creates subscription-scoped price. Exactly one of price_id or price must be set. */
	price?: SubscriptionPriceCreateRequest;
	quantity?: number;
	start_date?: string;
	end_date?: string;
	metadata?: Metadata;
	display_name?: string;
	subscription_phase_id?: string;
	// Commitment fields
	commitment_amount?: number;
	commitment_quantity?: number;
	commitment_type?: string;
	commitment_overage_factor?: number;
	commitment_true_up_enabled?: boolean;
	commitment_windowed?: boolean;
	commitment_duration?: BILLING_PERIOD;
}

export interface UpdateSubscriptionLineItemRequest {
	effective_from?: string;
	billing_model?: BILLING_MODEL;
	amount?: number;
	tier_mode?: TIER_MODE;
	tiers?: CreatePriceTier[];
	transform_quantity?: TransformQuantity;
	metadata?: Metadata;
	price_unit_amount?: string;
	price_unit_tiers?: CreatePriceTier[];
	// Commitment fields
	commitment_amount?: number;
	commitment_quantity?: number;
	commitment_type?: string;
	commitment_overage_factor?: number;
	commitment_true_up_enabled?: boolean;
	commitment_windowed?: boolean;
	commitment_duration?: BILLING_PERIOD;
}

export interface DeleteSubscriptionLineItemRequest {
	effective_from?: string;
}

export interface SubscriptionLineItemResponse {
	id: string;
	subscription_id: string;
	customer_id: string;
	price_id: string;
	price_type: string;
	currency: string;
	billing_period: string;
	invoice_cadence: string;
	trial_period?: number;
	price_unit_id?: string;
	price_unit?: string;
	entity_type: SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE;
	entity_id?: string;
	plan_display_name?: string;
	meter_id?: string;
	meter_display_name?: string;
	display_name: string;
	quantity: number;
	start_date: string;
	end_date?: string;
	metadata: Metadata;
	created_at: string;
	updated_at: string;
}

// =============================================================================
// ENHANCED SUBSCRIPTION FILTER TYPES
// =============================================================================

export interface SubscriptionFilter extends QueryFilter, TimeRangeFilter {
	subscription_ids?: string[];
	customer_id?: string;
	external_customer_id?: string;
	plan_id?: string;
	subscription_status?: SUBSCRIPTION_STATUS[];
	billing_cadence?: BILLING_CADENCE[];
	billing_period?: BILLING_PERIOD[];
	subscription_status_not_in?: SUBSCRIPTION_STATUS[];
	active_at?: string;
	with_line_items?: boolean;
	expand?: string;
	sort?: TypedBackendSort[];
	filters?: TypedBackendFilter[];
	/** Filters by parent subscription IDs (backend: parent_subscription_ids) */
	parent_subscription_ids?: string[];
	/** Filters by invoicing customer IDs (backend: invoicing_customer_ids) */
	invoicing_customer_ids?: string[];
}

// =============================================================================
// ENTITLEMENT OVERRIDE TYPES
// =============================================================================

export interface EntitlementOverrideRequest {
	entitlement_id: string;
	usage_limit?: number | null;
	static_value?: string;
	is_enabled?: boolean;
}

// =============================================================================
// SUBSCRIPTION PHASE TYPES
// =============================================================================

export type SubscriptionPhaseResponse = SubscriptionPhase;
