import { AxiosClient } from '@/core/axios/verbs';
import { Wallet, TransactionReason } from '@/models/Wallet';
import { RealtimeWalletBalance } from '@/models/WalletBalance';
import { WalletTransaction } from '@/models/WalletTransaction';
import { PaginationType } from '@/models/Pagination';

interface WalletTransactionPayload extends PaginationType {
	walletId: string;
}
interface WalletTransactionResponse {
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
	expiry_date?: number;
	expiry_date_utc?: Date;
	metadata?: Record<string, any>;
	idempotency_key: string;
	transaction_reason: TransactionReason;
}

class WalletApi {
	static async getWallets(customerId: string): Promise<Wallet[]> {
		return await AxiosClient.get<Wallet[]>(`/customers/${customerId}/wallets`);
	}

	static async getWalletTransactions({ walletId, limit = 10, offset = 0 }: WalletTransactionPayload): Promise<WalletTransactionResponse> {
		return await AxiosClient.get<WalletTransactionResponse>(`/wallets/${walletId}/transactions?limit=${limit}&offset=${offset}`);
	}

	static async getWalletBalance(walletId: string): Promise<RealtimeWalletBalance> {
		return await AxiosClient.get<RealtimeWalletBalance>(`/wallets/${walletId}/balance/real-time`);
	}
	static async createWallet({
		currency,
		customerId,
		name,
		initial_credits_to_load,
		conversion_rate,
	}: CreateWalletPayload): Promise<Wallet> {
		return await AxiosClient.post<Wallet>(`/wallets`, {
			currency,
			customer_id: customerId,
			name,
			initial_credits_to_load,
			conversion_rate,
		});
	}

	static async topupWallet(data: TopupWalletPayload): Promise<Wallet> {
		return await AxiosClient.post<Wallet>(`/wallets/${data.walletId}/top-up`, {
			...data,
		});
	}

	static async terminateWallet(walletId: string): Promise<void> {
		return await AxiosClient.post<void>(`/wallets/${walletId}/terminate`);
	}
}

export default WalletApi;
