import { Invoice, INVOICE_STATUS } from '@/models/Invoice';
import { FC, useMemo } from 'react';
import FlexpriceTable, { ColumnData, RedirectCell } from '../Table';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { StatusChip } from '@/components/atoms';
import { useNavigate } from 'react-router';
import InvoiceTableMenu from './InvoiceTableMenu';
import { RouteNames } from '@/core/routes/Routes';
import { PAYMENT_STATUS } from '@/constants';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
export interface Props {
	data: Invoice[];
}

export const getStatusChip = (status: string, t: TFunction) => {
	switch (status.toUpperCase()) {
		case INVOICE_STATUS.VOIDED:
			return <StatusChip status='Cancelled' label={t('invoices.status.void')} />;
		case INVOICE_STATUS.FINALIZED:
			return <StatusChip tone='success' label={t('invoices.status.finalized')} />;
		case INVOICE_STATUS.DRAFT:
			return <StatusChip status='Draft' label={t('common:status.draft')} />;
		case INVOICE_STATUS.SKIPPED:
			return <StatusChip status='Inactive' label={t('invoices.status.skipped')} />;
		default:
			return <StatusChip status='Inactive' label={status || t('invoices.status.unknown')} />;
	}
};

export const getPaymentStatusChip = (status: string, t: TFunction) => {
	switch (status.toUpperCase()) {
		case PAYMENT_STATUS.PENDING:
			return <StatusChip status='Pending' label={t('invoices.status.pending')} />;
		case PAYMENT_STATUS.INITIATED:
			return <StatusChip status='Pending' label={t('invoices.status.initiated')} />;
		case PAYMENT_STATUS.SUCCEEDED:
			return <StatusChip status='Paid' label={t('invoices.status.succeeded')} />;
		case PAYMENT_STATUS.FAILED:
			return <StatusChip status='Failed' label={t('invoices.status.failed')} />;
		case PAYMENT_STATUS.REFUNDED:
			return <StatusChip status='Cancelled' label={t('invoices.status.refunded')} />;
		case PAYMENT_STATUS.PARTIALLY_REFUNDED:
			return <StatusChip status='Cancelled' label={t('invoices.status.partiallyRefunded')} />;
		case PAYMENT_STATUS.OVERPAID:
			return <StatusChip tone='warning' label={t('invoices.status.overpaid')} />;
		default:
			return <StatusChip status='Inactive' label={t('invoices.status.unknown')} />;
	}
};

const InvoiceTable: FC<Props> = ({ data }) => {
	const navigate = useNavigate();
	const { t } = useTranslation(['billing', 'common']);

	const columns: ColumnData[] = useMemo(
		() => [
			{
				title: t('invoices.list.columns.invoiceNumber'),
				render: (row: Invoice) =>
					row.invoice_status?.toUpperCase() === INVOICE_STATUS.DRAFT ? (
						<span className='text-content-subtle text-[13px]'>{t('invoices.list.toBeGenerated')}</span>
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
