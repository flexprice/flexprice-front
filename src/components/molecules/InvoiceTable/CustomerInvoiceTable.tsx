import { FC } from 'react';
import FlexpriceTable, { ColumnData } from '../Table';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { formatBillingPeriod } from '@/utils/common/format_date';
import { Invoice, INVOICE_STATUS } from '@/models/Invoice';
import { getPaymentStatusChip, getStatusChip } from './InvoiceTable';

import InvoiceTableMenu from './InvoiceTableMenu';

interface Props {
	data: Invoice[];
	customerId?: string;
	onRowClick?: (row: Invoice) => void;
}

const CustomerInvoiceTable: FC<Props> = ({ data, onRowClick }) => {
	const columnData: ColumnData<Invoice>[] = [
		{
			title: 'Invoice Number',
			render: (row) =>
				row.invoice_status?.toUpperCase() === INVOICE_STATUS.DRAFT ? (
					<span className='text-gray-400 italic text-[13px]'>To be generated</span>
				) : (
					<>{row.invoice_number || '--'}</>
				),
		},
		{
			title: 'Status',
			render: (row: Invoice) => getStatusChip(row.invoice_status),
		},
		{
			title: 'Payment Status',
			render: (row: Invoice) => getPaymentStatusChip(row.payment_status),
		},
		{
			title: 'Billing Period',
			render: (row) => <>{row.period_start && row.period_end ? formatBillingPeriod(row.period_start, row.period_end) : '--'}</>,
		},
		{
			title: 'Total',
			render: (row) => <>{`${getCurrencySymbol(row.currency)} ${row.total}`}</>,
		},
		{
			title: 'Amount Due',
			render: (row) => <>{`${getCurrencySymbol(row.currency)} ${row.amount_due}`}</>,
		},
		{
			fieldVariant: 'interactive',
			hideOnEmpty: true,
			render: (row) => <InvoiceTableMenu data={row} />,
		},
	];

	return (
		<div>
			<FlexpriceTable showEmptyRow onRowClick={onRowClick} columns={columnData} data={data ?? []} />
		</div>
	);
};

export default CustomerInvoiceTable;
