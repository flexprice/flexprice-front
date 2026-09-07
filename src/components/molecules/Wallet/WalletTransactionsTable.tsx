import FlexpriceTable, { ColumnData } from '@/components/molecules/Table/Table';
import { cn } from '@/lib/utils';
import { WALLET_TRANSACTION_REASON } from '@/models/Wallet';
import { WalletTransaction } from '@/models/WalletTransaction';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { formatCredits, formatMoney } from '@/utils/common/formatBalance';
import { FC, useMemo } from 'react';
import { useWalletTransactionsTableT } from './WalletTransactionsTable.i18n';
import { PortalDataTable } from '@/components/atoms/PortalTable/PortalTable';

const TX_AMOUNT_PRIMARY = 'text-base font-medium';
const TX_AMOUNT_SECONDARY = 'text-sm';

interface Props {
	data: WalletTransaction[];
	/** 'portal' swaps the dashboard's filled header for the portal's table chrome. */
	chrome?: 'dashboard' | 'portal';
}

const WalletTransactionsTable: FC<Props> = ({ data, chrome = 'dashboard' }) => {
	const t = useWalletTransactionsTableT();

	const columnData: ColumnData<WalletTransaction>[] = useMemo(() => {
		const formatAmountEl = ({
			type,
			amount,
			currency,
			className,
			status,
		}: {
			type: string;
			amount: number;
			currency?: string;
			className?: string;
			status?: string;
		}) => {
			const isPending = status?.toLowerCase() === 'pending';
			const colorClass = isPending ? 'text-accent-yellow-brand' : type === 'credit' ? 'text-accent-teal-brand' : 'text-content-zinc-bold';
			const sign = type === 'credit' ? '+' : '-';

			// Raw amounts carry full float precision and must be rounded before display.
			// Money leads with its symbol (+$100.00); credits are suffixed (+100 credits).
			return (
				<span className={cn(colorClass, className)}>
					{currency
						? `${sign}${getCurrencySymbol(currency)}${formatMoney(Math.abs(amount))}`
						: `${sign}${formatCredits(Math.abs(amount))} ${t('payments.transactions.creditsSuffix')}`}
				</span>
			);
		};

		const transactionReasonLabel = (type: string, reason: string) => {
			const keyByReason: Partial<Record<WALLET_TRANSACTION_REASON, string>> = {
				[WALLET_TRANSACTION_REASON.INVOICE_PAYMENT]: 'payments.transactions.reasonInvoicePayment',
				[WALLET_TRANSACTION_REASON.FREE_CREDIT_GRANT]: 'payments.transactions.reasonFreeCreditGrant',
				[WALLET_TRANSACTION_REASON.SUBSCRIPTION_CREDIT_GRANT]: 'payments.transactions.reasonSubscriptionCreditGrant',
				[WALLET_TRANSACTION_REASON.PURCHASED_CREDIT_INVOICED]: 'payments.transactions.reasonPurchasedCreditInvoiced',
				[WALLET_TRANSACTION_REASON.PURCHASED_CREDIT_DIRECT]: 'payments.transactions.reasonPurchasedCreditDirect',
				[WALLET_TRANSACTION_REASON.INVOICE_REFUND]: 'payments.transactions.reasonInvoiceRefund',
				[WALLET_TRANSACTION_REASON.CREDIT_EXPIRED]: 'payments.transactions.reasonCreditExpired',
				[WALLET_TRANSACTION_REASON.WALLET_TERMINATION]: 'payments.transactions.reasonWalletTermination',
				[WALLET_TRANSACTION_REASON.CREDIT_NOTE]: 'payments.transactions.reasonCreditNote',
				[WALLET_TRANSACTION_REASON.MANUAL_BALANCE_DEBIT]: 'payments.transactions.reasonManualBalanceDebit',
			};
			const key = keyByReason[reason as WALLET_TRANSACTION_REASON];
			if (key) return t(key);
			return type === 'credit' ? t('payments.transactions.fallbackCredited') : t('payments.transactions.fallbackDebited');
		};

		const emptyCell = t('wallet.table.emptyCell');

		return [
			{
				title: t('wallet.table.columnTransactions'),
				render: (rowData) => transactionReasonLabel(rowData.type, rowData.transaction_reason),
			},
			{
				title: t('wallet.table.columnPaymentDate'),
				render: (rowData) => <span>{formatDateShort(rowData.created_at)}</span>,
			},
			{
				title: t('wallet.table.columnExpiryDate'),
				render: (rowData) => {
					if (rowData.expiry_date) {
						return <span>{formatDateShort(rowData.expiry_date)}</span>;
					}
					return <span>{emptyCell}</span>;
				},
			},
			{
				title: t('wallet.table.columnAmount'),
				align: 'right',
				render: (rowData) => {
					return (
						<span className='flex flex-col justify-center items-end'>
							{formatAmountEl({
								type: rowData.type,
								amount: rowData.amount,
								currency: rowData.currency,
								className: TX_AMOUNT_PRIMARY,
								status: rowData.transaction_status,
							})}
							{formatAmountEl({
								type: rowData.type,
								amount: rowData.credit_amount,
								className: TX_AMOUNT_SECONDARY,
								status: rowData.transaction_status,
							})}
						</span>
					);
				},
			},
		];
	}, [t]);

	// The portal renders the same columns through its own chrome — white header,
	// hairline divider, no outer border — so its three tables match each other
	// rather than the dashboard's filled-header treatment. Columns and their copy
	// stay defined once, here.
	if (chrome === 'portal') {
		return (
			<PortalDataTable
				columns={columnData.map((column, index) => ({
					title: column.title,
					// Amount is the last column and is money: it goes right, per the portal's
					// one alignment rule.
					align: index === columnData.length - 1 ? ('end' as const) : ('start' as const),
					render: (row: WalletTransaction) =>
						'render' in column && column.render ? column.render(row) : String(row[column.fieldName!] ?? ''),
				}))}
				data={data}
				getRowKey={(row) => row.id}
			/>
		);
	}

	return <FlexpriceTable columns={columnData} data={data} />;
};

export default WalletTransactionsTable;
