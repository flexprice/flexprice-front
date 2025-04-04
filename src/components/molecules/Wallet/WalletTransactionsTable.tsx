import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { cn } from '@/lib/utils';
import { WalletTransaction } from '@/models/WalletTransaction';
import { formatDateShort } from '@/utils/common/helper_functions';
import { FC } from 'react';

const formatAmount = (type: string, amount: number) => {
	return (
		<span className={cn(type === 'credit' ? 'text-[#2A9D90] ' : 'text-[#18181B] ')}>
			{type === 'credit' ? '+' : '-'}
			{amount}
			{' credits'}
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
	}

	return type === 'credit' ? 'Credited' : 'Debited';
};

interface Props {
	data: WalletTransaction[];
}

const columnData: ColumnData<WalletTransaction>[] = [
	{
		title: 'Transactions',
		render: (rowData) => fomatTransactionTitle({ type: rowData.type, reason: rowData.transaction_reason }),
		fieldVariant: 'title',
	},
	{
		title: 'Date',
		render: (rowData) => <span>{formatDateShort(rowData.created_at)}</span>,
	},

	{
		title: 'Balance',
		render: (rowData) => formatAmount(rowData.type, rowData.amount),
	},
];

const WalletTransactionsTable: FC<Props> = ({ data }) => {
	return <FlexpriceTable columns={columnData} data={data} />;
};

export default WalletTransactionsTable;
