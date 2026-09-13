import {
	BaseModel,
	Metadata,
	Pagination,
	WALLET_TRANSACTION_REASON,
	WALLET_STATUS,
	WALLET_TYPE,
	WALLET_CONFIG_PRICE_TYPE,
	WalletTransaction,
	WalletAlertSettings,
	WalletAlertState,
	AutoTopup,
} from '@/models';
import { TypedBackendFilter, TypedBackendSort } from '../formatters/QueryBuilder';
import type { EntityCreationOptions, EntityCreationResult } from './EntityCreation';

export interface WalletConfig {
	allowed_price_types: WALLET_CONFIG_PRICE_TYPE[];
}

export interface WalletTransactionResponse {
	items: WalletTransaction[];
	pagination: Pagination;
}

export interface CreateWalletPayload {
	customer_id?: string;
	external_customer_id?: string;
	currency: string;
	description?: string;
	metadata?: Metadata;
	wallet_type?: WALLET_TYPE;
	config?: WalletConfig;
	conversion_rate?: number;
	topup_conversion_rate?: number;
	initial_credits_to_load?: number;
	initial_credits_to_load_expiry_date?: number; // YYYYMMDD format
	initial_credits_expiry_date_utc?: string; // ISO string
	alert_settings?: WalletAlertSettings;
	auto_topup?: AutoTopup;
	price_unit?: string;
}

export interface TopupCheckoutParams {
	payment_provider: string;
	success_url?: string;
	cancel_url?: string;
	/** Omitted for one-off top-ups — no recurring-debit mandate is needed. */
	max_mandate_limit?: string;
	/**
	 * Omit to have a checkout session already in flight reject this top-up; send
	 * `supersede` to cancel that session and start a fresh one in its place.
	 */
	entity_creation_options?: EntityCreationOptions;
}

/** Mirrors dto.TopUpWalletResponse: the wallet plus, for checkout top-ups, the session. */
export interface TopupWalletResponse {
	wallet_transaction?: { id: string; amount: string; credits: string; transaction_status?: string };
	invoice_id?: string;
	wallet?: WalletResponse;
	checkout_session?: {
		id: string;
		checkout_status?: string;
		expires_at?: string;
		payment_url?: string;
		/** `url` is what the API sends; the other two are kept for older payloads. */
		payment_action?: { type?: string; url?: string; redirect_url?: string };
		/**
		 * Outcome of this call, not state of the session: `failed_already_exists`
		 * means nothing was created and the session above is the one already in
		 * flight that blocked the top-up.
		 */
		entity_creation_result?: EntityCreationResult;
	};
}

export interface TopupWalletPayload {
	/** Opts into pay-first hosted checkout; credits apply only after payment succeeds. */
	checkout?: TopupCheckoutParams;
	credits_to_add: number;
	amount?: number; // amount in currency (alternative to credits_to_add)
	walletId: string;
	description?: string;
	priority?: number;
	expiry_date?: number; // YYYYMMDD format
	expiry_date_utc?: string; // ISO string
	metadata?: Record<string, any>;
	idempotency_key?: string;
	transaction_reason: WALLET_TRANSACTION_REASON;
}

export interface DebitWalletPayload {
	credits: number;
	walletId: string;
	idempotency_key: string;
	transaction_reason: WALLET_TRANSACTION_REASON;
}

export interface WalletTransactionPayload extends Pagination {
	walletId: string;
}

export interface GetCustomerWalletsPayload {
	id?: string;
	lookup_key?: string;
	include_real_time_balance?: boolean;
}

export interface UpdateWalletRequest {
	name?: string;
	description?: string;
	metadata?: Metadata;
	config?: WalletConfig;
	auto_topup?: AutoTopup;
	alert_settings?: WalletAlertSettings;
}

export interface WalletResponse {
	id: string;
	customer_id: string;
	name: string;
	currency: string;
	description: string;
	balance: string;
	credit_balance: string;
	wallet_status: WALLET_STATUS;
	metadata: Metadata;
	auto_topup?: AutoTopup;
	wallet_type: WALLET_TYPE;
	config: {
		allowed_price_types: WALLET_CONFIG_PRICE_TYPE[];
	};
	conversion_rate: string;
	topup_conversion_rate?: string;
	created_at: string;
	updated_at: string;
	alert_settings?: WalletAlertSettings;
	alert_state?: WalletAlertState;
}

export interface GetCustomerWalletsResponse extends BaseModel {
	auto_topup?: AutoTopup;
	balance: number;
	config: {
		allowed_price_types: WALLET_CONFIG_PRICE_TYPE[];
	};
	conversion_rate: number;
	topup_conversion_rate?: number;
	credit_balance: number;
	currency: string;
	customer_id: string;
	description: string;
	metadata: Record<string, any>;
	name: string;
	wallet_status: WALLET_STATUS;
	wallet_type: WALLET_TYPE;
	alert_settings?: WalletAlertSettings;
	alert_state?: WalletAlertState;
}

export interface GetWalletTransactionsByFilterPayload extends Pagination {
	filters?: TypedBackendFilter[];
	sort?: TypedBackendSort[];
	expand?: string;
}

export interface ListWalletsPayload {
	customer_id?: string;
	currency?: string;
	wallet_status?: WALLET_STATUS;
	limit?: number;
	offset?: number;
	sort?: string;
	order?: string;
}

export interface ListWalletsByFilterPayload extends Pagination {
	filters: TypedBackendFilter[];
	sort: TypedBackendSort[];
	expand?: string;
}

export interface ListWalletsPayload {
	customer_id?: string;
	currency?: string;
	wallet_status?: WALLET_STATUS;
	limit?: number;
	offset?: number;
	sort?: string;
	order?: string;
}

export interface ListWalletsByFilterPayload extends Pagination {
	filters: TypedBackendFilter[];
	sort: TypedBackendSort[];
	expand?: string;
}
export interface ListWalletsResponse {
	items: WalletResponse[];
	pagination: Pagination;
}

// ManualBalanceDebitRequest represents a request to debit credits from a wallet
export interface ManualBalanceDebitRequest {
	credits: number;
	transaction_reason: WALLET_TRANSACTION_REASON;
	idempotency_key: string;
	description?: string;
	metadata?: Metadata;
}
