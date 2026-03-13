/**
 * Environment-level org settings value schemas.
 * Keys match API path segments: GET/PUT/DELETE /v1/settings/:key
 */

// ─── 1. invoice_config ───────────────────────────────────────────────────────

export const INVOICE_FORMAT = ['YYYYMM', 'YYYYMMDD', 'YYMMDD', 'YY', 'YYYY'] as const;
export type InvoiceFormat = (typeof INVOICE_FORMAT)[number];

export interface InvoiceConfig {
	prefix: string;
	format: InvoiceFormat;
	start_sequence: number;
	timezone: string;
	separator?: string;
	suffix_length: number;
	due_date_days: number | null;
	auto_complete_purchased_credit_transaction?: boolean;
}

export const DEFAULT_INVOICE_CONFIG: InvoiceConfig = {
	prefix: 'INV',
	format: 'YYYYMM',
	start_sequence: 1,
	timezone: 'UTC',
	separator: '-',
	suffix_length: 5,
	due_date_days: 1,
	auto_complete_purchased_credit_transaction: false,
};

// ─── 2. subscription_config ─────────────────────────────────────────────────

export interface SubscriptionConfig {
	grace_period_days: number;
	auto_cancellation_enabled: boolean;
}

export const DEFAULT_SUBSCRIPTION_CONFIG: SubscriptionConfig = {
	grace_period_days: 3,
	auto_cancellation_enabled: false,
};

// ─── 3. invoice_pdf_config ───────────────────────────────────────────────────

export interface InvoicePdfConfig {
	template_name: string;
	group_by: string[];
}

export const DEFAULT_INVOICE_PDF_CONFIG: InvoicePdfConfig = {
	template_name: 'invoice.typ',
	group_by: [],
};

// ─── 4. customer_onboarding ───────────────────────────────────────────────────

export type CustomerOnboardingAction =
	| { action: 'create_customer'; default_user_id?: string }
	| { action: 'create_wallet'; currency: string; conversion_rate?: number }
	| { action: 'create_subscription'; plan_id: string; billing_cycle?: 'anniversary' | 'calendar'; start_date?: string }
	| {
			action: 'create_feature_and_price';
			plan_id: string;
			feature_type?: 'metered' | 'boolean' | 'static';
			price_start_date_time?: string;
	  };

export interface CustomerOnboardingConfig {
	workflow_type: 'customer_onboarding';
	actions: CustomerOnboardingAction[];
}

export const DEFAULT_CUSTOMER_ONBOARDING_CONFIG: CustomerOnboardingConfig = {
	workflow_type: 'customer_onboarding',
	actions: [{ action: 'create_customer' }],
};

// ─── 5. wallet_balance_alert_config ───────────────────────────────────────────

export type WalletAlertCondition = 'below' | 'above';

export interface WalletAlertLevel {
	threshold: string;
	condition: WalletAlertCondition;
}

export interface WalletBalanceAlertConfig {
	critical: WalletAlertLevel | null;
	warning: WalletAlertLevel | null;
	info: WalletAlertLevel | null;
	alert_enabled: boolean;
}

export const DEFAULT_WALLET_BALANCE_ALERT_CONFIG: WalletBalanceAlertConfig = {
	critical: null,
	warning: null,
	info: null,
	alert_enabled: false,
};

// ─── 6. prepare_processed_events_config ─────────────────────────────────────────

export type MeterAggregationType = 'COUNT' | 'SUM' | 'AVG' | 'COUNT_UNIQUE' | 'LATEST' | 'SUM_WITH_MULTIPLIER' | 'MAX' | 'WEIGHTED_SUM';

export type ResetUsageType = 'BILLING_PERIOD' | 'NEVER';

export interface PrepareProcessedEventsMeter {
	aggregation_type: MeterAggregationType;
	aggregation_field?: string;
	reset_usage?: ResetUsageType;
}

export interface PrepareProcessedEventsPrice {
	billing_cadence?: string;
	billing_period?: string;
	billing_model?: string;
	currency?: string;
	entity_type?: string;
	invoice_cadence?: string;
	price_unit_type?: string;
	type?: string;
	amount?: number;
	billing_period_count?: number;
}

export type PrepareProcessedEventsAction =
	| {
			action: 'create_feature_and_price';
			feature_type?: string;
			meter?: PrepareProcessedEventsMeter;
			price?: PrepareProcessedEventsPrice;
	  }
	| { action: 'rollout_to_subscriptions'; plan_id: string };

export interface PrepareProcessedEventsConfig {
	workflow_type: 'prepare_processed_events';
	actions: PrepareProcessedEventsAction[];
}

export const DEFAULT_PREPARE_PROCESSED_EVENTS_CONFIG: PrepareProcessedEventsConfig = {
	workflow_type: 'prepare_processed_events',
	actions: [],
};

// ─── 7. custom_analytics_config ───────────────────────────────────────────────

export type CustomAnalyticsTargetType = 'feature' | 'meter' | 'event_name';

export interface CustomAnalyticsRule {
	id: string;
	target_type: CustomAnalyticsTargetType;
	target_id: string;
}

export interface CustomAnalyticsConfig {
	rules: CustomAnalyticsRule[];
}

export const DEFAULT_CUSTOM_ANALYTICS_CONFIG: CustomAnalyticsConfig = {
	rules: [],
};

// ─── 8. customer_portal_config (org settings form) ─────────────────────────────

export interface CustomerPortalThemeOrg {
	primary_color?: string;
	secondary_color?: string;
	tertiary_color?: string;
}

export type CustomerPortalTabType =
	| 'metric_cards'
	| 'usage_graph'
	| 'current_usage'
	| 'usage_breakdown'
	| 'wallet_balance'
	| 'wallet_transactions'
	| 'invoices'
	| 'subscriptions';

export interface CustomerPortalTabConfigOrg {
	id: string;
	type: CustomerPortalTabType;
	enabled: boolean;
	order: number;
	usage_graph?: Record<string, unknown>;
	metric_cards?: Record<string, unknown>;
}

export interface CustomerPortalSectionConfigOrg {
	id: string;
	label: string;
	enabled: boolean;
	order: number;
	tabs: CustomerPortalTabConfigOrg[];
}

export interface CustomerPortalConfigOrg {
	version: string;
	theme?: CustomerPortalThemeOrg;
	sections: CustomerPortalSectionConfigOrg[];
}

export const DEFAULT_CUSTOMER_PORTAL_CONFIG_ORG: CustomerPortalConfigOrg = {
	version: '1.0',
	theme: {},
	sections: [],
};
