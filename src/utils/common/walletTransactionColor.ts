/**
 * Amount color for a wallet transaction row.
 *
 * Failed always reads as danger, regardless of `type` -- this is the one case every
 * caller must get right, since a failed *credit* transaction would otherwise fall
 * through to the same teal used for a successful one (the bug this closes). Pending
 * reads amber. Anything else falls back to type: credit reads teal, debit reads the
 * neutral tone.
 *
 * Shared by every wallet transaction table so this rule lives in exactly one place
 * instead of being copy-pasted per table and risking the copies drifting apart.
 */
export const getWalletTransactionAmountColorClass = (type: string, status?: string): string => {
	const normalizedStatus = status?.toLowerCase();
	if (normalizedStatus === 'failed') return 'text-danger';
	if (normalizedStatus === 'pending') return 'text-accent-yellow-brand';
	return type === 'credit' ? 'text-accent-teal-brand' : 'text-content-zinc-bold';
};
