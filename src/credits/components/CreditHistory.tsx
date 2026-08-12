// src/credits/components/CreditHistory.tsx
import { useMemo } from 'react';
import Card from '@/components/atoms/Card/Card';
import Select from '@/components/atoms/Select/Select';
import { ShortPaginationControls } from '@/components/atoms/ShortPagination/ShortPaginationControls';
// Imported by direct file path rather than the `@/components/molecules` barrel: the barrel's
// `WalletTransactionsTable` export actually resolves to `./Wallet/index.ts`'s `default`, which is
// `CustomerWalletTransactionsTable` (a different, unrelated component) — NOT the
// `WalletTransactionsTable.tsx` module this plan's Step Group A fixed to use bundled i18n. Going
// through the barrel here would silently pull in the wrong, still-raw-`useTranslation` table.
// Reconciling that barrel naming collision is out of scope for this task; see the plan's Task 2
// notes for the full rationale. `CustomerWalletTransactionsTable` and its 3 existing callers are
// untouched by this change.
import WalletTransactionsTable from '@/components/molecules/Wallet/WalletTransactionsTable';
import { cn } from '@/lib/utils';
import { useCreditsT } from '../i18n';
import { normalizeCreditTransactions } from '../schema';
import type { CreditHistoryProps } from '../types';
import type { WalletTransaction } from '@/models/WalletTransaction';

/**
 * Prop-only wallet-transaction history — no fetching, no auth, no PortalConfigContext, no router.
 * Pagination is fully controlled via `page`/`pageSize`/`totalItems`/`onPageChange` (the old
 * internal widget read/wrote page state from the URL via `usePagination()`; this component never
 * does — see this plan's Global Constraints). Consumers supply already-adapted `transactions`
 * (see `adaptCreditTransactions`) and, for multi-wallet accounts, `wallets` (see `adaptWalletOptions`).
 */
const CreditHistory = ({
	transactions: rawTransactions,
	wallets,
	selectedWalletId,
	onSelectWallet,
	page,
	pageSize,
	totalItems,
	onPageChange,
	isLoading = false,
	className,
}: CreditHistoryProps) => {
	const transactions = useMemo(() => normalizeCreditTransactions(rawTransactions), [rawTransactions]);
	const t = useCreditsT();

	if (isLoading) {
		return (
			<div className={cn('flexprice-ui', 'space-y-6', className)}>
				<Card noPadding className='rounded-xl overflow-hidden bg-surface'>
					<div className='p-6 border-b border-line'>
						<div className='h-5 w-40 bg-surface-muted animate-pulse rounded' />
					</div>
					<div className='p-6 space-y-3'>
						{[1, 2, 3].map((i) => (
							<div key={i} className='h-12 bg-surface-muted animate-pulse rounded' />
						))}
					</div>
				</Card>
			</div>
		);
	}

	// FlexpriceTable/WalletTransactionsTable expects the real WalletTransaction shape for fields
	// this component's decoupled model doesn't carry (balance_after/before, description, etc.) —
	// those aren't rendered by any column WalletTransactionsTable defines, so a minimal cast with
	// safe defaults for the untouched fields keeps the table's existing render logic unchanged.
	const tableData: WalletTransaction[] = transactions.map((tx) => ({
		id: tx.id,
		amount: tx.amount,
		credit_amount: tx.creditAmount,
		currency: tx.currency,
		type: tx.type,
		transaction_reason: tx.reason,
		created_at: tx.createdAt,
		expiry_date: tx.expiryDate ?? '',
		priority: tx.priority,
		balance_after: 0,
		balance_before: 0,
		description: '',
		metadata: {},
		reference_id: '',
		reference_type: '',
		transaction_status: tx.transactionStatus ?? '',
		wallet_id: '',
	}));

	return (
		<div className={cn('flexprice-ui', 'space-y-6', className)}>
			{wallets && wallets.length > 1 && (
				<Select
					value={selectedWalletId || ''}
					onChange={(value) => onSelectWallet?.(value)}
					options={wallets.map((w) => ({ value: w.id, label: w.label || t('creditWidgets.fallbackWalletName', { id: w.id.slice(0, 8) }) }))}
					className='w-full max-w-xs'
				/>
			)}

			<Card noPadding className='rounded-xl overflow-hidden bg-surface'>
				<div className='p-6 border-b border-line'>
					<h3 className='text-base font-medium text-content'>{t('creditWidgets.transactionHistory')}</h3>
				</div>
				<div className='p-6'>
					{transactions.length > 0 ? (
						<WalletTransactionsTable data={tableData} />
					) : (
						<div className='flex flex-col items-center justify-center py-16 px-4'>
							<p className='text-sm font-medium text-content-secondary mb-1'>{t('creditWidgets.noTransactionsTitle')}</p>
							<p className='text-xs text-content-muted text-center max-w-sm mt-1'>{t('creditWidgets.noTransactionsDescription')}</p>
						</div>
					)}
					{/* Rendered on totalItems, not the current page's row count, so a stale out-of-range
					    page (e.g. after a delete/filter shrinks the total) still shows pagination and
					    lets ShortPaginationControls' own resync effect clamp `page` back into range. */}
					{totalItems > 0 && (
						<ShortPaginationControls
							page={page}
							onPageChange={onPageChange}
							totalItems={totalItems}
							pageSize={pageSize}
							unit={t('creditWidgets.transactionsUnit')}
						/>
					)}
				</div>
			</Card>
		</div>
	);
};

export default CreditHistory;
