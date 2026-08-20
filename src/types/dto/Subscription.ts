import {
	BILLING_CADENCE,
	LineItem as InvoiceLineItem,
	BILLING_CYCLE,
	SUBSCRIPTION_STATUS,
	GROUPED_INVOICING_MODIFY_ACTION,
	SUBSCRIPTION_MODIFY_LINE_ITEM_ACTION,
	SUBSCRIPTION_MODIFY_SUBSCRIPTION_RESOURCE_ACTION,
	SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION,
	SubscriptionModifyType,
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
	PRICE_TYPE,
	PRICE_UNIT_TYPE,
	INVOICE_CADENCE,
	PriceBucketSize,
} from '@/models';
import { PriceUnitConfig, PriceResponse } from '@/types/dto/Price';
import { BILLING_PERIOD, BUCKET_SIZE_NONE } from '@/constants/constants';
import { QueryFilter, TimeRangeFilter } from './base';
import { AddAddonToSubscriptionRequest, ADDON_CADENCE, ADDON_PRORATION_BEHAVIOR } from './Addon';
export { ADDON_CADENCE as AddonCadence, ADDON_PRORATION_BEHAVIOR as ProrationBehavior } from './Addon';
import { Invoice } from '@/models/Invoice';
import type { WalletTransaction } from '@/models/WalletTransaction';
import { Coupon } from '@/models/Coupon';
import Customer from '@/models/Customer';
import { JsonObject } from '@/types/common';

// Re-export existing enums for convenience
export { BILLING_PERIOD } from '@/constants/constants';

// SubscriptionFilter interface for listing subscriptions
export interface ListSubscriptionsPayload extends Omit<QueryFilter, 'sort'>, TimeRangeFilter {
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
	/** Filters by subscription hierarchy role (backend: subscription_type, comma-separated in query) */
	subscription_type?: string[];
}

import { TaxRateOverride } from './tax';
import { TypedBackendFilter, TypedBackendSort } from '../formatters/QueryBuilder';
import { CreateCreditGrantRequest } from './CreditGrant';
import { LineItemCommitmentsMap } from './LineItemCommitmentConfig';
import type { CommitmentTimeBucket } from './CommitmentTimeBucket';
import { AddonResponse } from './Addon';
import { ADDON_ASSOCIATION_STATUS } from '@/models/AddonAssociation';

// New unified coupon input for subscription creation
export interface SubscriptionCouponInput {
	coupon_code: string;
	start_date?: string;
	end_date?: string;
	price_id?: string; // omit for subscription-level; set for line-item-level
}

// Coupon mid-cycle modify params
export interface SubModifyCouponParams {
	action: 'add' | 'remove';
	coupon_code?: string; // required when action=add
	coupon_association_id?: string; // required when action=remove
	start_date?: string;
	end_date?: string;
	subscription_id?: string; // mutually exclusive with subscription_line_item_id
	subscription_line_item_id?: string;
}

// Tax mid-cycle modify params
export interface SubModifyTaxParams {
	action: 'add' | 'remove';
	tax_rate_id?: string; // required when action=add
	tax_association_id?: string; // required when action=remove
	effective_date?: string;
}

export interface GetSubscriptionDetailsPayload {
	subscription_id: string;
	period_end?: string;
	period_start?: string;
	hide_zero_charges_line_items?: boolean;
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

// Subscription Change Types
export interface PreviewSubscriptionChangeRequest {
	plan_id?: string;
	effective_date?: string;
	proration_behavior?: SUBSCRIPTION_PRORATION_BEHAVIOR;
	override_line_items?: OverrideLineItemRequest[];
	entitlement_overrides?: EntitlementOverrideRequest[];
	line_item_commitments?: LineItemCommitmentsMap;
	enable_true_up?: boolean;
	metadata?: Metadata;
}

export interface PreviewSubscriptionChangeResponse {
	subscription_id: string;
	preview: {
		amount_due: number;
		proration_amount: number;
		proration_details: ProrationDetail[];
		new_line_items: SubscriptionLineItemResponse[];
		updated_line_items: SubscriptionLineItemResponse[];
		removed_line_items: SubscriptionLineItemResponse[];
		effective_date: string;
	};
}

export interface ExecuteSubscriptionChangeRequest {
	plan_id?: string;
	effective_date?: string;
	proration_behavior?: SUBSCRIPTION_PRORATION_BEHAVIOR;
	override_line_items?: OverrideLineItemRequest[];
	entitlement_overrides?: EntitlementOverrideRequest[];
	line_item_commitments?: LineItemCommitmentsMap;
	enable_true_up?: boolean;
	metadata?: Metadata;
}

export interface ExecuteSubscriptionChangeResponse {
	subscription: SubscriptionResponse;
	proration_invoice?: Invoice;
	proration_details: ProrationDetail[];
	message: string;
}

// =============================================================================
// SUBSCRIPTION MID-CYCLE MODIFICATION (inheritance | quantity_change | grouped_invoicing)
// POST /subscriptions/:id/modify/preview | /modify/execute
// Enums live in @/models/Subscription; re-exported here for dto module consumers.
// =============================================================================

export type { SubscriptionModifyType } from '@/models';
export {
	SUBSCRIPTION_MODIFY_TYPE,
	GROUPED_INVOICING_MODIFY_ACTION,
	SUBSCRIPTION_MODIFY_LINE_ITEM_ACTION,
	SUBSCRIPTION_MODIFY_SUBSCRIPTION_RESOURCE_ACTION,
	SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION,
} from '@/models';

/** Payload when type is `inheritance` — add inherited child subscriptions. */
export interface SubModifyInheritanceRequest {
	external_customer_ids_to_inherit_subscription?: string[];
}

/** Single line item quantity change; quantity is a decimal string in API JSON. */
export interface LineItemQuantityChange {
	id: string;
	quantity: string;
	/** ISO 8601; omit for effective immediately. */
	effective_date?: string;
}

/** Payload when type is `quantity_change`. */
export interface SubModifyQuantityChangeRequest {
	line_items: LineItemQuantityChange[];
}

/** Payload when type is `grouped_invoicing` — add or remove grouped-invoicing child subscriptions. */
export interface SubModifyGroupedInvoicingParams {
	action: GROUPED_INVOICING_MODIFY_ACTION;
	/** Required when `action` is `add`. */
	parent_subscription_id?: string;
	child_subscription_ids: string[];
}

/** Unified body for modify preview and execute (exactly one params object must match `type`). */
export interface ExecuteSubscriptionModifyRequest {
	type: SubscriptionModifyType;
	inheritance_params?: SubModifyInheritanceRequest;
	quantity_change_params?: SubModifyQuantityChangeRequest;
	grouped_invoicing_params?: SubModifyGroupedInvoicingParams;
	coupon_params?: SubModifyCouponParams;
	tax_params?: SubModifyTaxParams;
}

export interface ChangedLineItem {
	id: string;
	price_id: string;
	quantity: string;
	start_date?: string;
	end_date?: string;
	change_action: SUBSCRIPTION_MODIFY_LINE_ITEM_ACTION;
}

export interface ChangedSubscription {
	id: string;
	action: SUBSCRIPTION_MODIFY_SUBSCRIPTION_RESOURCE_ACTION;
	status: SUBSCRIPTION_STATUS;
}

export interface ChangedInvoice {
	id: string;
	action: SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION;
	status: string;
	/** Present when backend returns invoice payload with proration or preview invoice. */
	invoice?: Invoice | null;
	wallet_transaction?: WalletTransaction | null;
}

export interface ChangedResources {
	line_items?: ChangedLineItem[];
	subscriptions?: ChangedSubscription[];
	invoices?: ChangedInvoice[];
}

export interface SubscriptionModifyResponse {
	subscription?: SubscriptionResponse | null;
	changed_resources: ChangedResources;
}

export interface ScheduleUpdateBillingPeriodRequest {
	billing_period_start: string;
	billing_period_end: string;
}

export interface ListSubscriptionsResponse extends Omit<QueryFilter, 'sort'>, TimeRangeFilter {
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
	/** Required when cancellation_type is scheduled_date; must be in the future (ISO 8601). */
	cancel_at?: string;
}

// =============================================================================
// ENHANCED SUBSCRIPTION REQUEST/RESPONSE TYPES
// =============================================================================

/** Matches backend SubscriptionInheritanceConfig (subscription create). */
export interface SubscriptionInheritanceConfig {
	external_customer_ids_to_inherit_subscription?: string[];
	parent_subscription_id?: string;
	invoicing_customer_external_id?: string | null;
	/** Standalone subscriptions to attach as `grouped_invoicing` under a new parent; mutually exclusive with inherited-child fields per backend validation. */
	subscriptions_ids_for_grouped_invoicing?: string[];
}

export interface CreateSubscriptionRequest {
	// Customer identification - prioritized over external_customer_id if both provided
	customer_id?: string;
	external_customer_id?: string;

	// Plan and billing configuration
	plan_id: string;
	currency: string;
	lookup_key?: string;
	start_date?: string;
	end_date?: string;
	/**
	 * Trial length for the new subscription. `undefined`/omit = inherit from plan recurring-fixed prices
	 * (must be uniform). `0` = explicitly no trial (overrides catalog). `>0` = override duration in days.
	 */
	trial_period_days?: number | null;
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

	billing_anchor?: Date;

	// Coupons
	coupons?: string[];
	line_item_coupons?: Record<string, string[]>;
	// Preferred (new): unified coupon input using coupon_code
	subscription_coupons?: SubscriptionCouponInput[];

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

	timezone?: string;

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

	/** When set, creates parent/inherited child subscriptions per backend hierarchy rules. */
	inheritance?: SubscriptionInheritanceConfig;

	/** Optional threshold for auto-invoice behavior (typically usage-only plans). Omit when not used. */
	auto_invoice_threshold?: number;
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

	/** Windows usage into fixed-size buckets before aggregation, overriding the plan price for this
	 * subscription (USAGE prices only). Omit to inherit the plan price's bucket_size unchanged. */
	bucket_size?: PriceBucketSize;
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
	/** Required when cancellation_type is scheduled_date; must be in the future (ISO 8601). */
	cancel_at?: string;
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
	start_date?: string;
	cadence?: ADDON_CADENCE;
	proration_behavior?: ADDON_PRORATION_BEHAVIOR;
	metadata?: Metadata;
	line_item_commitments?: LineItemCommitmentsMap;
}

export interface RemoveAddonRequest {
	addon_association_id: string;
	reason?: string;
	proration_behavior?: ADDON_PRORATION_BEHAVIOR;
	effective_date?: string;
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

/** Inline price for subscription-scoped line items. Entity_type/entity_id are set server-side from subscription. */
export interface SubscriptionPriceCreateRequest {
	type: PRICE_TYPE;
	price_unit_type: PRICE_UNIT_TYPE;
	billing_period: BILLING_PERIOD;
	billing_period_count?: number;
	billing_model: BILLING_MODEL;
	invoice_cadence: INVOICE_CADENCE;
	/** Lowercase ISO currency code; defaults from subscription when omitted. */
	currency?: string;
	amount?: string;
	meter_id?: string;
	filter_values?: Record<string, string[]>;
	lookup_key?: string;
	trial_period_days?: number;
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
	/** Windows usage into fixed-size buckets before aggregation (USAGE prices only). Omit for no bucketing. */
	bucket_size?: PriceBucketSize;
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
	proration_behavior?: ADDON_PRORATION_BEHAVIOR;
	// Commitment fields
	commitment_amount?: number;
	commitment_quantity?: number;
	commitment_type?: string;
	commitment_overage_factor?: number;
	commitment_true_up_enabled?: boolean;
	commitment_windowed?: boolean;
	commitment_duration?: BILLING_PERIOD;
	commitment_time_buckets?: CommitmentTimeBucket[];
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
	proration_behavior?: ADDON_PRORATION_BEHAVIOR;
	/** Same new-price/end-date-old-price semantics as UpdatePriceRequest.bucket_size - re-fetch after
	 * a successful update instead of patching in place. BUCKET_SIZE_NONE removes bucketing. */
	bucket_size?: PriceBucketSize | typeof BUCKET_SIZE_NONE;
	// Commitment fields
	commitment_amount?: number;
	commitment_quantity?: number;
	commitment_type?: string;
	commitment_overage_factor?: number;
	commitment_true_up_enabled?: boolean;
	commitment_windowed?: boolean;
	commitment_duration?: BILLING_PERIOD;
	commitment_time_buckets?: CommitmentTimeBucket[];
}

export interface DeleteSubscriptionLineItemRequest {
	effective_from?: string;
	proration_behavior?: ADDON_PRORATION_BEHAVIOR;
}

export interface SubscriptionLineItemResponse {
	id: string;
	subscription_id: string;
	customer_id: string;
	price_id: string;
	price_type: PRICE_TYPE;
	currency: string;
	billing_period: string;
	invoice_cadence: string;
	trial_period_days?: number;
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
	// Addon association link
	addon_association_id?: string;
	// Commitment fields
	commitment_amount?: string | number;
	commitment_quantity?: string;
	commitment_type?: string;
	commitment_overage_factor?: string;
	commitment_true_up_enabled?: boolean;
	commitment_windowed?: boolean;
	commitment_duration?: string;
	commitment_time_buckets?: CommitmentTimeBucket[];
}

/** Line item as returned by list/search when `expand` includes related entities (e.g. `prices`). */
export type SubscriptionLineItemListItem = SubscriptionLineItemResponse & {
	price?: PriceResponse;
};

/**
 * Filter for POST /subscriptions/lineitems/search.
 * Matches backend `SubscriptionLineItemFilter`: embedded `QueryFilter` (e.g. limit, offset, expand), `TimeRangeFilter`,
 * plus the fields below.
 */
export interface SubscriptionLineItemFilter extends Omit<QueryFilter, 'sort'>, TimeRangeFilter {
	sort?: TypedBackendSort[];
	filters?: TypedBackendFilter[];

	subscription_ids?: string[];
	customer_ids?: string[];
	price_ids?: string[];
	meter_ids?: string[];
	currencies?: string[];
	billing_periods?: string[];
	entity_ids?: string[];
	entity_type?: SUBSCRIPTION_LINE_ITEM_ENTITY_TYPE;
	addon_association_ids?: string[];
	/** Backend form/json: `active_filter` (default true when omitted). */
	active_filter?: boolean;
	current_period_start?: string;
}

/** Response for POST /subscriptions/lineitems/search (matches backend ListSubscriptionLineItemsResponse). */
export interface ListSubscriptionLineItemsResponse {
	items: SubscriptionLineItemListItem[];
	pagination: Pagination;
}

// =============================================================================
// ENHANCED SUBSCRIPTION FILTER TYPES
// =============================================================================

export interface SubscriptionFilter extends Omit<QueryFilter, 'sort'>, TimeRangeFilter {
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
	/** Filters by subscription hierarchy role (backend: subscription_type) */
	subscription_type?: string[];
}

// =============================================================================
// ENTITLEMENT OVERRIDE TYPES
// =============================================================================

export interface EntitlementOverrideRequest {
	entitlement_id: string;
	usage_limit?: number | null;
	static_value?: string;
	is_enabled?: boolean;
	config_value?: JsonObject;
}

// =============================================================================
// SUBSCRIPTION ENTITLEMENT (effective) TYPES
// =============================================================================

export interface SubscriptionEntitlementSource {
	entity_type: string;
	entity_id: string;
	entitlement_id: string;
	usage_limit?: number | null;
	static_value?: string;
	is_enabled?: boolean;
	config_value?: JsonObject | null;
}

export interface SubscriptionEntitlementEffective {
	is_enabled?: boolean;
	usage_limit?: number | null;
	usage_reset_period?: string;
	/** Aggregated static feature values (backend field name) */
	static_values?: string[];
	/** Present on EntitlementSource rows, not on aggregated entitlement */
	static_value?: string;
	is_soft_limit?: boolean;
	/** Aggregated config values array (backend field name: config_values) */
	config_values?: JsonObject[];
	/** Present on EntitlementSource rows */
	config_value?: JsonObject | null;
	id?: string;
}

export interface SubscriptionEntitlementFeature {
	feature: {
		id: string;
		name: string;
		type: string;
		[key: string]: unknown;
	};
	entitlement: SubscriptionEntitlementEffective;
	sources: SubscriptionEntitlementSource[];
}

export interface GetSubscriptionEntitlementsResponse {
	subscription_id: string;
	plan_id: string;
	features: SubscriptionEntitlementFeature[];
}

// =============================================================================
// SUBSCRIPTION PHASE TYPES
// =============================================================================

export type SubscriptionPhaseResponse = SubscriptionPhase;
