import { PaginationType } from '@/models/Pagination';
import { TransactionReason } from '@/models/Wallet';
import { WalletTransaction } from '@/models/WalletTransaction';

export interface WalletTransactionResponse {
	items: WalletTransaction[];
	pagination: PaginationType;
}

export interface CreateWalletPayload {
	customerId: string;
	currency: string;
	name?: string;
	metadata?: Record<string, any>;
	initial_credits_to_load?: number;
	conversion_rate?: number;
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
	transaction_reason: TransactionReason;
}

export interface WalletTransactionPayload extends PaginationType {
	walletId: string;
}
