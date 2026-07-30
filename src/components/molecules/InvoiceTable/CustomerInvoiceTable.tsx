import { FC, useMemo } from 'react';
import FlexpriceTable, { ColumnData, RedirectCell } from '../Table';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { formatBillingPeriod } from '@/utils/common/format_date';
import { Invoice, INVOICE_STATUS, INVOICE_TYPE } from '@/models/Invoice';
import { getPaymentStatusChip, getStatusChip } from './InvoiceTable';
import Customer from '@/models/Customer';
import { RouteNames } from '@/core/routes/Routes';
import { useTranslation } from 'react-i18next';

const getPlanDisplayName = (invoice: Invoice): string => {
	if (invoice.invoice_type !== INVOICE_TYPE.SUBSCRIPTION) return '--';
	return invoice.line_items?.find((item) => item.plan_display_name)?.plan_display_name ?? '--';
};

import InvoiceTableMenu from './InvoiceTableMenu';

/** Invoice enriched with subscription customer data */
export type EnrichedInvoice = Invoice & { subscription_customer?: Customer };

interface Props {
	data: EnrichedInvoice[];
	customerId?: string;
	onRowClick?: (row: Invoice) => void;
}

const CustomerInvoiceTable: FC<Props> = ({ data, onRowClick }) => {
	const { t } = useTranslation(['billing', 'common']);
	const naLabel = t('common:labels.na');
	// Only show Subscription Customer column if at least one invoice has a different subscription_customer_id
	const hasSubscriptionCustomer = useMemo(
		() => data.some((inv) => inv.subscription_customer_id && inv.subscription_customer_id !== inv.customer_id),
		[data],
	);

	const columnData: ColumnData<EnrichedInvoice>[] = useMemo(() => {
		const cols: ColumnData<EnrichedInvoice>[] = [
			{
				title: t('invoices.list.sort.invoiceNumber'),
				render: (row) =>
					row.invoice_status?.toUpperCase() === INVOICE_STATUS.DRAFT ? (
						<span className='text-gray-400 italic text-[13px]'>{t('invoices.list.toBeGenerated')}</span>
					) : (
						<>{row.invoice_number || naLabel}</>
					),
			},
			{
				title: t('invoices.customerTable.plan'),
				render: (row) => <>{getPlanDisplayName(row)}</>,
			},
			{
				title: t('invoices.columns.status'),
				render: (row: EnrichedInvoice) => getStatusChip(row.invoice_status, t),
			},
			{
				title: t('invoices.list.columns.paymentStatus'),
				render: (row: EnrichedInvoice) => getPaymentStatusChip(row.payment_status, t),
			},
		];

		if (hasSubscriptionCustomer) {
			cols.push({
				title: t('invoices.list.columns.subscriptionCustomer'),
				render: (row: EnrichedInvoice) => {
					if (!row.subscription_customer_id || row.subscription_customer_id === row.customer_id) {
						return <>{naLabel}</>;
					}
					const subCust = row.subscription_customer;
					if (!subCust?.name || !subCust?.id) {
						return <>{naLabel}</>;
					}
					return <RedirectCell redirectUrl={`${RouteNames.customers}/${subCust.id}`}>{subCust.name}</RedirectCell>;
				},
			});
		}

		cols.push(
			{
				title: t('invoices.customerTable.billingPeriod'),
				render: (row) => <>{row.period_start && row.period_end ? formatBillingPeriod(row.period_start, row.period_end) : naLabel}</>,
			},
			{
				title: t('invoices.customerTable.total'),
				render: (row) => <>{`${getCurrencySymbol(row.currency)} ${row.total}`}</>,
			},
			{
				title: t('invoices.list.sort.amountDue'),
				render: (row) => <>{`${getCurrencySymbol(row.currency)} ${row.amount_due}`}</>,
			},
			{
				fieldVariant: 'interactive',
				hideOnEmpty: true,
				render: (row) => <InvoiceTableMenu data={row} />,
			},
		);

		return cols;
	}, [hasSubscriptionCustomer, t, naLabel]);

	return (
		<div>
			<FlexpriceTable showEmptyRow onRowClick={onRowClick} columns={columnData} data={data ?? []} />
		</div>
	);
};

export default CustomerInvoiceTable;
