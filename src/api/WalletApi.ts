import { AxiosClient } from '@/core/axios/verbs';
import { Wallet, RealtimeWalletBalance } from '@/models';
import {
	CreateWalletPayload,
	TopupWalletPayload,
	TopupWalletResponse,
	DebitWalletPayload,
	WalletTransactionResponse,
	WalletTransactionPayload,
	UpdateWalletRequest,
	WalletResponse,
	GetCustomerWalletsPayload,
	GetWalletTransactionsByFilterPayload,
	ListWalletsPayload,
	ListWalletsByFilterPayload,
	ListWalletsResponse,
} from '@/types/dto';
import { generateQueryParams } from '@/utils/common/api_helper';

class WalletApi {
	private static baseUrl = '/wallets';

	static async getWalletById(id: string): Promise<Wallet> {
		return await AxiosClient.get<Wallet>(`${this.baseUrl}/${id}`);
	}

	static async getCustomerWallets(data: GetCustomerWalletsPayload): Promise<Wallet[]> {
		const url = generateQueryParams(`/customers${this.baseUrl}`, data);
		return await AxiosClient.get<Wallet[]>(url);
	}

	static async getWalletTransactions({ walletId, limit = 10, offset = 0 }: WalletTransactionPayload): Promise<WalletTransactionResponse> {
		return await AxiosClient.get<WalletTransactionResponse>(`${this.baseUrl}/${walletId}/transactions?limit=${limit}&offset=${offset}`);
	}

	static async getWalletBalance(walletId: string): Promise<RealtimeWalletBalance> {
		return await AxiosClient.get<RealtimeWalletBalance>(`${this.baseUrl}/${walletId}/balance/real-time`);
	}

	static async getWalletBalanceV2(walletId: string): Promise<RealtimeWalletBalance> {
		return await AxiosClient.get<RealtimeWalletBalance>(`${this.baseUrl}/${walletId}/balance/real-time-v2`);
	}
	static async createWallet(data: CreateWalletPayload): Promise<Wallet> {
		return await AxiosClient.post<Wallet>(`${this.baseUrl}`, data);
	}

	static async topupWallet(data: TopupWalletPayload): Promise<TopupWalletResponse> {
		return await AxiosClient.post<TopupWalletResponse>(`${this.baseUrl}/${data.walletId}/top-up`, data);
	}

	static async debitWallet(data: DebitWalletPayload): Promise<Wallet> {
		return await AxiosClient.post<Wallet>(`${this.baseUrl}/${data.walletId}/debit`, data);
	}

	static async terminateWallet(walletId: string): Promise<void> {
		return await AxiosClient.post<void>(`${this.baseUrl}/${walletId}/terminate`, {});
	}

	static async updateWallet(walletId: string, data: UpdateWalletRequest): Promise<WalletResponse> {
		return await AxiosClient.put<WalletResponse>(`${this.baseUrl}/${walletId}`, { ...data });
	}

	// Search all wallet transactions across all wallets
	static async getAllWalletTransactionsByFilter(payload: GetWalletTransactionsByFilterPayload): Promise<WalletTransactionResponse> {
		return await AxiosClient.post<WalletTransactionResponse, GetWalletTransactionsByFilterPayload>(
			`${this.baseUrl}/transactions/search`,
			payload,
		);
	}

	// List wallets with query parameters
	static async listWallets(payload: ListWalletsPayload = {}): Promise<ListWalletsResponse> {
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get<ListWalletsResponse>(url);
	}

	// List wallets by filter with JSON body
	static async listWalletsByFilter(payload: ListWalletsByFilterPayload): Promise<ListWalletsResponse> {
		return await AxiosClient.post<ListWalletsResponse, ListWalletsByFilterPayload>(`${this.baseUrl}/search`, payload);
	}
}

export default WalletApi;
