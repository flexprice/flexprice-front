import { BaseModel, Metadata } from '@/models/base';
import { Pagination } from '@/models/Pagination';
import { WALLET_TRANSACTION_REASON, WALLET_AUTO_TOPUP_TRIGGER, WALLET_STATUS, WALLET_TYPE } from '@/models/Wallet';
import { WalletTransaction } from '@/models/WalletTransaction';

export interface WalletTransactionResponse {
	items: WalletTransaction[];
	pagination: Pagination;
}

export interface CreateWalletPayload {
	customerId: string;
	currency: string;
	name?: string;
	metadata?: Metadata;
	initial_credits_to_load?: number;
	conversion_rate?: number;
	initial_credits_expiry_date_utc?: Date;
}

export interface TopupWalletPayload {
	credits_to_add: number;
	walletId: string;
	description?: string;
	priority?: number;
	expiry_date?: number;
	expiry_date_utc?: Date;
	metadata?: Record<string, any>;
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
	auto_topup_trigger?: WALLET_AUTO_TOPUP_TRIGGER;
	auto_topup_min_balance?: string;
	auto_topup_amount?: string;
	config?: {
		allowed_price_types: string[];
	};
	alert_enabled?: boolean;
	alert_config?: {
		threshold: {
			type: 'amount' | 'percentage';
			value: string;
		};
	};
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
	auto_topup_trigger: WALLET_AUTO_TOPUP_TRIGGER;
	auto_topup_min_balance: string;
	auto_topup_amount: string;
	wallet_type: WALLET_TYPE;
	config: {
		allowed_price_types: string[];
	};
	conversion_rate: string;
	created_at: string;
	updated_at: string;
	alert_enabled?: boolean;
	alert_config?: {
		threshold: {
			type: 'amount' | 'percentage';
			value: string;
		};
	};
}

export interface GetCustomerWalletsResponse extends BaseModel {
	auto_topup_amount: number;
	auto_topup_min_balance: number;
	auto_topup_trigger: string;
	balance: number;
	config: {
		allowed_price_types: string[];
	};
	conversion_rate: number;
	credit_balance: number;
	currency: string;
	customer_id: string;
	description: string;
	metadata: Record<string, any>;
	name: string;
	wallet_status: WALLET_STATUS;
	wallet_type: WALLET_TYPE;
	alert_enabled?: boolean;
	alert_config?: {
		threshold: {
			type: 'amount' | 'percentage';
			value: string;
		};
	};
}
