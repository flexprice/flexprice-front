// Shared status treatment for the three wallet-transaction tables
// (WalletTransactionsTable, CustomerWalletTransactionsTable, AllWalletTransactionsTable).
//
// All three used to colour the amount from `type` alone, special-casing only `pending`. A
// `failed` top-up therefore rendered identically to a completed one — teal, with a leading
// `+` — telling the customer they had been credited money that never reached the wallet.
// The balance was right; only the row lied.

/** The wallet transaction lifecycle, mirroring types.TransactionStatus in the backend. */
export type TransactionStatusValue = 'pending' | 'completed' | 'failed';

const normalize = (status?: string): string => status?.toLowerCase().trim() ?? '';

export const isPendingTransaction = (status?: string): boolean => normalize(status) === 'pending';

export const isFailedTransaction = (status?: string): boolean => normalize(status) === 'failed';

/** True for anything that has not moved the balance — the row must not read as settled money. */
export const isUnsettledTransaction = (status?: string): boolean => isPendingTransaction(status) || isFailedTransaction(status);

/**
 * Classes for a transaction amount.
 *
 * `failed` is struck through as well as muted, deliberately: colour alone is the one cue a
 * red/green colourblind reader cannot use, and "did this money arrive?" is exactly the question
 * they would be left guessing at. The sign is left alone — a failed credit was still an attempt
 * to add credits, and flipping it to `-` would claim a debit that never happened either.
 */
export const transactionAmountToneClass = ({ status, type }: { status?: string; type: string }): string => {
	if (isFailedTransaction(status)) return 'text-content-muted line-through';
	if (isPendingTransaction(status)) return 'text-accent-yellow-brand';
	return type === 'credit' ? 'text-accent-teal-brand' : 'text-content-zinc-bold';
};
