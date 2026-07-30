import { Invoice, INVOICE_STATUS } from '@/models/Invoice';
import { FC, useMemo } from 'react';
import FlexpriceTable, { ColumnData, RedirectCell } from '../Table';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { Chip } from '@/components/atoms';
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
			return <Chip variant='default' label={t('invoices.status.void')} />;
		case INVOICE_STATUS.FINALIZED:
			return <Chip variant='success' label={t('invoices.status.finalized')} />;
		case INVOICE_STATUS.DRAFT:
			return <Chip variant='default' label={t('common:status.draft')} />;
		case INVOICE_STATUS.SKIPPED:
			return <Chip variant='default' label={t('invoices.status.skipped')} />;
		default:
			return <Chip variant='default' label={status || t('invoices.status.unknown')} />;
	}
};

export const getPaymentStatusChip = (status: string, t: TFunction) => {
	switch (status.toUpperCase()) {
		case PAYMENT_STATUS.PENDING:
			return <Chip variant='warning' label={t('invoices.status.pending')} />;
		case PAYMENT_STATUS.INITIATED:
			return <Chip variant='warning' label={t('invoices.status.initiated')} />;
		case PAYMENT_STATUS.SUCCEEDED:
			return <Chip variant='success' label={t('invoices.status.succeeded')} />;
		case PAYMENT_STATUS.FAILED:
			return <Chip variant='failed' label={t('invoices.status.failed')} />;
		case PAYMENT_STATUS.REFUNDED:
			return <Chip variant='default' label={t('invoices.status.refunded')} />;
		case PAYMENT_STATUS.PARTIALLY_REFUNDED:
			return <Chip variant='default' label={t('invoices.status.partiallyRefunded')} />;
		case PAYMENT_STATUS.OVERPAID:
			return <Chip variant='warning' label={t('invoices.status.overpaid')} />;
		default:
			return <Chip variant='default' label={t('invoices.status.unknown')} />;
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
						<span className='text-gray-400 italic text-[13px]'>{t('invoices.list.toBeGenerated')}</span>
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
