// src/components/molecules/Wallet/WalletTransactionsTable.i18n.ts
//
// Bundled i18n so WalletTransactionsTable renders real English out-of-the-box when reused by
// exportable components (e.g. @flexprice/ui's CreditHistory) — WITHOUT overriding a
// host app that has its own i18n. Mirrors `src/components/molecules/CustomerUsageChart.i18n.ts`.
// Namespace is `'billing'` (not `'common'`) to match WalletTransactionsTable's existing
// `useTranslation('billing')` call — the host-i18n handoff only works if the namespace matches
// what the host actually has loaded.
import { createBundledT } from '@/lib/exportable/bundledI18n';

const EN_WALLET_TRANSACTIONS_TABLE = {
	payments: {
		transactions: {
			creditsSuffix: 'credits',
			reasonInvoicePayment: 'Invoice Payment',
			reasonFreeCreditGrant: 'Free Credits Added',
			reasonSubscriptionCreditGrant: 'Subscription Credits Added',
			reasonPurchasedCreditInvoiced: 'Purchased Credits (Invoiced)',
			reasonPurchasedCreditDirect: 'Purchased Credits',
			reasonInvoiceRefund: 'Invoice Refund',
			reasonCreditExpired: 'Credits Expired',
			reasonWalletTermination: 'Wallet Terminated',
			reasonCreditNote: 'Credit Note Refund',
			reasonManualBalanceDebit: 'Manual Debit',
			fallbackCredited: 'Credited',
			fallbackDebited: 'Debited',
		},
	},
	wallet: {
		table: {
			emptyCell: '—',
			columnTransactions: 'Transactions',
			columnPaymentDate: 'Payment Date',
			columnExpiryDate: 'Expiry Date',
			columnPriority: 'Priority',
			columnAmount: 'Amount',
		},
	},
};

export const useWalletTransactionsTableT = createBundledT('billing', EN_WALLET_TRANSACTIONS_TABLE).useBoundT;
