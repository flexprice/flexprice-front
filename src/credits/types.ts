import type { ReactNode } from 'react';
//
// Public presentational types for the credits widgets (balance, history).
//
// Decoupled from backend DTOs (WalletResponse / RealtimeWalletBalance / WalletTransaction).
// Containers map API responses INTO these shapes via `adapters.ts`, so backend schema changes
// never leak into the widgets' public contract.

// ── CreditBalance ────────────────────────────────────────────────────────────

export interface CreditBalanceData {
	id: string;
	name: string;
	status: 'active' | 'frozen' | 'closed';
	creditBalance: number;
	balance: number;
	currency: string;
}

export interface CreditBalanceProps {
	/**
	 * Rendered on the balance label's row, under the header rule. Whichever control
	 * belongs with the figure rather than with the wallet's identity.
	 */
	balanceAction?: ReactNode;
	/** null renders the empty state (no wallet set up). */
	wallet: CreditBalanceData | null;
	isLoading?: boolean;
	className?: string;
	/** Header-right slot, beside the wallet's name. */
	actions?: ReactNode;
}

// ── CreditHistory ────────────────────────────────────────────────────────────

export interface CreditTransaction {
	id: string;
	type: 'credit' | 'debit';
	amount: number;
	creditAmount: number;
	currency?: string;
	reason: string;
	createdAt: string;
	expiryDate?: string;
	priority?: number;
	transactionStatus?: string;
}

export interface CreditWalletOption {
	id: string;
	label: string;
}

export interface CreditHistoryProps {
	transactions: CreditTransaction[];
	/** Only rendered as a selector when there's more than one entry. */
	wallets?: CreditWalletOption[];
	selectedWalletId?: string;
	onSelectWallet?: (walletId: string) => void;
	/** Fully controlled pagination — no router dependency. See this plan's Global Constraints. */
	page: number;
	pageSize: number;
	totalItems: number;
	onPageChange: (page: number) => void;
	isLoading?: boolean;
	className?: string;
}
