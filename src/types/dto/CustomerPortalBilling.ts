/**
 * Customer Portal billing DTOs.
 *
 * Mirrors the /v1/customer/portal contract. The portal deliberately gets a
 * narrower surface than the admin API: collection method, mandate limits,
 * transaction reason, expiry and priority are all pinned server-side, so none of
 * them appear here.
 */

// ─── Providers and capabilities ───────────────────────────────────────────────

export type PaymentGatewayType = 'stripe' | 'razorpay' | 'chargebee' | 'nomod' | 'moyasar' | 'paddle' | 'whop';

export type IntegrationCapabilityType = 'checkout' | 'auto_charge' | 'set_default_method' | 'payment_link' | 'payment_method_management';

export interface IntegrationCapability {
	type: IntegrationCapabilityType;
	/** Which provider is chosen for this capability when the caller names none. */
	is_default: boolean;
}

export interface PaymentIntegration {
	provider: PaymentGatewayType;
	capabilities: IntegrationCapability[];
}

export interface PortalIntegrationsResponse {
	payment_integrations: PaymentIntegration[];
}

// ─── Payment actions ──────────────────────────────────────────────────────────

export type PaymentActionType = 'checkout_url' | 'payment_link';

/**
 * What the client should do next. Read this rather than reaching for a URL field —
 * whether a provider uses a hosted page or a link is its own property.
 */
export interface PaymentAction {
	type: PaymentActionType;
	url: string;
}

export type CheckoutStatus = 'initiated' | 'pending' | 'completed' | 'failed' | 'expired';

export interface PortalCheckoutSession {
	id: string;
	checkout_status: CheckoutStatus;
	payment_provider: PaymentGatewayType;
	payment_action?: PaymentAction;
	checkout_invoice_id?: string;
	checkout_payment_id?: string;
	expires_at: string;
	completed_at?: string;
	cancelled_at?: string;
	failure_reason?: string;
}

// ─── Top up ───────────────────────────────────────────────────────────────────

/**
 * Portal checkout opt-in. There is no save-payment-method flag — portal checkouts
 * always vault — and no provider config, since collection method and mandate
 * limits are not a customer's to choose.
 */
export interface PortalCheckoutParams {
	/** Omit to let the backend resolve the tenant's configured provider. */
	payment_provider?: PaymentGatewayType;
	/**
	 * Authorisation for this one payment, given while the customer is present.
	 * Falls back to a link when no usable saved method exists or the charge
	 * declines — so read payment_action, never assume a silent success.
	 */
	use_saved_method?: boolean;
	idempotency_key?: string;
	success_url?: string;
	cancel_url?: string;
	failure_url?: string;
	metadata?: Record<string, string>;
}

export interface PortalTopUpRequest {
	credits_to_add: string;
	amount?: string;
	/** Required: the backend's fallback key is timestamp-derived, so a retry
	 *  without this would be treated as a fresh top-up and grant credits twice. */
	idempotency_key: string;
	description?: string;
	/** Omit to raise an invoice the customer settles later. */
	checkout?: PortalCheckoutParams;
}

export interface PortalTopUpResponse {
	wallet_transaction?: { id: string; amount: string; credits: string; transaction_status?: string };
	invoice_id?: string;
	wallet?: unknown;
	checkout_session?: PortalCheckoutSession;
}

// ─── Auto top-up ──────────────────────────────────────────────────────────────

/**
 * Flat, unlike the admin request. `invoicing` is withheld — it selects the
 * transaction reason and is the tenant's call — and there is no auto-charge flag:
 * enabling auto top-up is itself the consent to be charged unattended.
 */
export interface PortalAutoTopupRequest {
	enabled: boolean;
	threshold?: string;
	amount?: string;
	/**
	 * A cooloff between automatic top-ups. `value: 0` clears a stored one — null
	 * reads as an absent field on the server and leaves it in place.
	 */
	cooldown?: { value: number; unit: 'second' | 'minute' | 'hour' | 'day' } | null;
}

// ─── Payment methods ──────────────────────────────────────────────────────────

export type PaymentMethodStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

export interface SavedCardDetails {
	brand?: string;
	last4?: string;
	exp_month?: number;
	exp_year?: number;
}

export interface SavedPaymentMethod {
	id: string;
	provider: PaymentGatewayType;
	type: string;
	status: PaymentMethodStatus;
	card?: SavedCardDetails;
	/** Which method to use at this provider — scoped per provider, so two
	 *  providers means two defaults. Answers "which one", never "may we". */
	is_default: boolean;
	/** Capability, not permission: could this be charged with nobody present. */
	can_auto_charge: boolean;
}

export interface ProviderError {
	message: string;
}

export interface ProviderSavedPaymentMethods {
	provider: PaymentGatewayType;
	items: SavedPaymentMethod[];
	/** Set when this provider could not be read. Keeps "no saved cards" distinct
	 *  from "we could not ask" — the two need different UI. */
	error?: ProviderError;
}

export interface SavedPaymentMethodsResponse {
	providers: ProviderSavedPaymentMethods[];
}

export interface PortalListPaymentMethodsQuery {
	providers?: PaymentGatewayType[];
}

// ─── Adding a payment method ──────────────────────────────────────────────────

export type SetupActionType = 'redirect' | 'none';

/** Members are additive: switching on `type` keeps working as embedded flows land. */
export interface SetupAction {
	type: SetupActionType;
	url?: string;
	expires_at?: string;
}

export interface PortalAddPaymentMethodRequest {
	payment_provider: PaymentGatewayType;
	success_url?: string;
	cancel_url?: string;
	failure_url?: string;
}

/** Returns an action, not a method — nothing is vaulted yet when this is written. */
export interface AddPaymentMethodResponse {
	provider: PaymentGatewayType;
	action: SetupAction;
}

export interface PortalDeletePaymentMethodRequest {
	payment_provider: PaymentGatewayType;
	payment_method_id: string;
}

export interface PortalSetDefaultPaymentMethodRequest {
	payment_provider: PaymentGatewayType;
	payment_method_id: string;
}

// ─── Invoice payment ──────────────────────────────────────────────────────────

/** No amount — it comes from the invoice, so a customer cannot part-pay. */
export interface PortalPayInvoiceRequest {
	payment_provider?: PaymentGatewayType;
	idempotency_key?: string;
	success_url?: string;
	cancel_url?: string;
	failure_url?: string;
}

export interface PortalPayInvoiceResponse {
	payment_id: string;
	invoice_id: string;
	status: string;
	amount: string;
	currency: string;
	payment_action?: PaymentAction;
}
