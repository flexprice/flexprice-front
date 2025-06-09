import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { cn } from '@/lib/utils';
import { WalletTransaction } from '@/models/WalletTransaction';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { FC } from 'react';

const formatAmount = ({ type, amount, currency, className }: { type: string; amount: number; currency?: string; className?: string }) => {
	return (
		<span className={cn(type === 'credit' ? 'text-[#2A9D90] ' : 'text-[#18181B] ', className)}>
			{type === 'credit' ? '+' : '-'}
			{amount}
			{currency ? ` ${getCurrencySymbol(currency)}` : ' credits'}
		</span>
	);
};

const fomatTransactionTitle = ({ type, reason }: { type: string; reason: string }) => {
	switch (reason) {
		case 'INVOICE_PAYMENT':
			return 'Invoice Payment';
		case 'FREE_CREDIT_GRANT':
			return 'Free Credits Added';
		case 'SUBSCRIPTION_CREDIT_GRANT':
			return 'Subscription Credits Added';
		case 'PURCHASED_CREDIT_INVOICED':
			return 'Purchased Credits (Invoiced)';
		case 'PURCHASED_CREDIT_DIRECT':
			return 'Purchased Credits';
		case 'INVOICE_REFUND':
			return 'Invoice Refund';
		case 'CREDIT_EXPIRED':
			return 'Credits Expired';
		case 'WALLET_TERMINATION':
			return 'Wallet Terminated';
		default:
			return type === 'credit' ? 'Credited' : 'Debited';
	}
};

interface Props {
	data: WalletTransaction[];
	currency: string;
}

const WalletTransactionsTable: FC<Props> = ({ data, currency }) => {
	const columnData: ColumnData<WalletTransaction>[] = [
		{
			title: 'Transactions',
			render: (rowData) => fomatTransactionTitle({ type: rowData.type, reason: rowData.transaction_reason }),
			fieldVariant: 'title',
		},
		{
			title: 'Payment Date',
			render: (rowData) => <span>{formatDateShort(rowData.created_at)}</span>,
		},
		{
			title: 'Expiry Date',
			render: (rowData) => {
				if (rowData.expiry_date) {
					return <span>{formatDateShort(rowData.expiry_date)}</span>;
				}
				return <span>--</span>;
			},
		},
		{
			title: 'Priority',
			render: (rowData) => {
				return <span>{rowData.priority || '--'}</span>;
			},
		},
		{
			title: `Amount(${getCurrencySymbol(currency)})`,
			align: 'right',
			render: (rowData) => {
				return (
					<span className='flex flex-col justify-center items-end'>
						{formatAmount({ type: rowData.type, amount: rowData.amount, currency, className: 'text-base font-medium' })}
						{formatAmount({ type: rowData.type, amount: rowData.credit_amount, className: 'text-sm' })}
					</span>
				);
			},
		},
	];
	return <FlexpriceTable columns={columnData} data={data} />;
};

export default WalletTransactionsTable;
