import { Invoice, INVOICE_STATUS } from '@/models/Invoice';
import { FC, useMemo } from 'react';
import FlexpriceTable, { ColumnData, RedirectCell } from '../Table';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { useNavigate } from 'react-router';
import InvoiceTableMenu from './InvoiceTableMenu';
import { RouteNames } from '@/core/routes/Routes';
import { useTranslation } from 'react-i18next';
import { getPaymentStatusChip, getStatusChip } from './invoiceStatusChips';
export interface Props {
	data: Invoice[];
}

const InvoiceTable: FC<Props> = ({ data }) => {
	const navigate = useNavigate();
	const { t } = useTranslation(['billing', 'common']);

	const columns: ColumnData<Invoice>[] = useMemo(
		() => [
			{
				title: t('invoices.list.columns.invoiceNumber'),
				render: (row: Invoice) =>
					row.invoice_status?.toUpperCase() === INVOICE_STATUS.DRAFT ? (
						<span className='text-content-subtle italic text-[13px]'>{t('invoices.list.toBeGenerated')}</span>
					) : (
						<span>{row.invoice_number || t('common:labels.na')}</span>
					),
			},
			{
				title: t('invoices.list.columns.amount'),
				render: (row) => <span>{`${getCurrencySymbol(row.currency)}${row.amount_due}`}</span>,
			},
			{
				title: t('invoices.list.columns.invoiceStatus'),
				render: (row: Invoice) => getStatusChip(row.invoice_status, t),
			},
			{
				title: t('invoices.list.columns.billingEntity'),
				render: (row: Invoice) => {
					if (!row.customer?.name || !row.customer?.id) {
						return t('common:labels.na');
					}

					return <RedirectCell redirectUrl={`${RouteNames.customers}/${row.customer.id}`}>{row.customer.name}</RedirectCell>;
				},
			},
			// {
			// 	title: 'Billing Interval',
			// 	render: (row: Invoice) => <span>{toSentenceCase(row.billing_period || '')}</span>,
			// },
			{
				title: t('invoices.list.columns.paymentStatus'),
				render: (row: Invoice) => getPaymentStatusChip(row.payment_status, t),
			},
			{
				title: t('invoices.list.columns.dueDate'),
				render: (row: Invoice) => <span>{row.due_date ? formatDateShort(row.due_date) : t('common:labels.na')}</span>,
			},
			{
				fieldVariant: 'interactive',
				hideOnEmpty: true,
				render: (row: Invoice) => {
					return <InvoiceTableMenu data={row} />;
				},
			},
		],
		[t],
	);

	return (
		<div>
			<FlexpriceTable
				showEmptyRow={true}
				onRowClick={(row) => {
					navigate(`/billing/invoices/${row.id}`);
				}}
				columns={columns}
				data={data}
			/>
		</div>
	);
};

export default InvoiceTable;
