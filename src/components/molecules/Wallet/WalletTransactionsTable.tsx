import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { cn } from '@/lib/utils';
import { WALLET_TRANSACTION_REASON } from '@/models/Wallet';
import { WalletTransaction } from '@/models/WalletTransaction';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const TX_AMOUNT_PRIMARY = 'text-base font-medium';
const TX_AMOUNT_SECONDARY = 'text-sm';

interface Props {
	data: WalletTransaction[];
}

const WalletTransactionsTable: FC<Props> = ({ data }) => {
	const { t } = useTranslation('billing');

	const columnData: ColumnData<WalletTransaction>[] = useMemo(() => {
		const formatAmountEl = ({
			type,
			amount,
			currency,
			className,
		}: {
			type: string;
			amount: number;
			currency?: string;
			className?: string;
		}) => {
			return (
				<span className={cn(type === 'credit' ? 'text-[#2A9D90] ' : 'text-[#18181B] ', className)}>
					{type === 'credit' ? '+' : '-'}
					{amount}
					{currency ? ` ${getCurrencySymbol(currency)}` : ` ${t('payments.transactions.creditsSuffix')}`}
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
				title: t('wallet.table.columnPriority'),
				render: (rowData) => {
					return <span>{rowData.priority || emptyCell}</span>;
				},
			},
			{
				title: t('wallet.table.columnAmount'),
				align: 'right',
				render: (rowData) => {
					return (
						<span className='flex flex-col justify-center items-end'>
							{formatAmountEl({ type: rowData.type, amount: rowData.amount, currency: rowData.currency, className: TX_AMOUNT_PRIMARY })}
							{formatAmountEl({ type: rowData.type, amount: rowData.credit_amount, className: TX_AMOUNT_SECONDARY })}
						</span>
					);
				},
			},
		];
	}, [t]);

	return <FlexpriceTable columns={columnData} data={data} />;
};

export default WalletTransactionsTable;
