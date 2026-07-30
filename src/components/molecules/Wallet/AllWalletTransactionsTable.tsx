import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { RedirectCell } from '@/components/molecules';
import { cn } from '@/lib/utils';
import { WALLET_TRANSACTION_REASON } from '@/models/Wallet';
import { WalletTransaction } from '@/models/WalletTransaction';
import { User } from '@/models/User';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { RouteNames } from '@/core/routes/Routes';
import { FC, useMemo } from 'react';
import useAllUsers from '@/hooks/useAllUsers';
import { useTranslation } from 'react-i18next';

const TX_AMOUNT_PRIMARY = 'text-base font-medium';
const TX_AMOUNT_SECONDARY = 'text-sm';

interface Props {
	data: WalletTransaction[];
}

const AllWalletTransactionsTable: FC<Props> = ({ data }) => {
	const { t } = useTranslation('billing');
	const { users } = useAllUsers();

	const userMap = useMemo(() => {
		const map = new Map<string, User>();
		users?.items.forEach((user) => {
			map.set(user.id, user);
		});
		return map;
	}, [users]);

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
			const colorClass = isPending ? 'text-[#f5c50b]' : type === 'credit' ? 'text-[#2A9D90]' : 'text-[#18181B]';

			return (
				<span className={cn(colorClass, className)}>
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
				title: t('wallet.table.columnCustomer'),
				render: (rowData) => {
					if (rowData.customer_id) {
						const customerName = rowData.customer?.name || rowData.customer?.email || rowData.customer_id;
						return <RedirectCell redirectUrl={`${RouteNames.customers}/${rowData.customer_id}`}>{customerName}</RedirectCell>;
					}
					return <span className='text-gray-400'>{emptyCell}</span>;
				},
			},
			{
				title: t('wallet.table.columnTransactionReason'),
				render: (rowData) => transactionReasonLabel(rowData.type, rowData.transaction_reason),
			},
			{
				title: t('wallet.table.columnDate'),
				render: (rowData) => <span>{formatDateShort(rowData.created_at)}</span>,
			},
			{
				title: t('wallet.table.columnCreatedBy'),
				render: (rowData) => {
					if (rowData.created_by) {
						const user = rowData.created_by_user || userMap.get(rowData.created_by);
						if (user) {
							return <span>{user.email || user.name || rowData.created_by}</span>;
						}
						return <span className='text-gray-400 font-mono text-xs'>{rowData.created_by}</span>;
					}
					return <span className='text-gray-400'>{emptyCell}</span>;
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
							{rowData.credit_amount > 0 && (
								<span className='text-sm text-gray-500'>
									{formatAmountEl({
										type: rowData.type,
										amount: rowData.credit_amount,
										className: TX_AMOUNT_SECONDARY,
										status: rowData.transaction_status,
									})}
								</span>
							)}
						</span>
					);
				},
			},
		];
	}, [t, userMap]);

	return <FlexpriceTable showEmptyRow columns={columnData} data={data} />;
};

export default AllWalletTransactionsTable;
