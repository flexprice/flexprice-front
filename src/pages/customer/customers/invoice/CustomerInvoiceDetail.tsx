import { FormHeader, Spacer, Button, Divider, Loader, Card, CardHeader } from '@/components/atoms';
import {
	InvoiceTableMenu,
	InvoicePaymentStatusModal,
	InvoiceStatusModal,
	InvoiceLineItemTable,
	AppliedTaxesTable,
	InvoiceDownloadFormatDialog,
	IntegrationMappingCard,
} from '@/components/molecules';
import useUser from '@/hooks/useUser';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import InvoiceApi from '@/api/InvoiceApi';
import CustomerApi from '@/api/CustomerApi';
import formatDate from '@/utils/common/format_date';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { FC, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { RouteNames } from '@/core/routes/Routes';
import { cn } from '@/lib/utils';
import { getPaymentStatusChip } from '@/components/molecules/InvoiceTable/InvoiceTable';
import { INVOICE_STATUS, INVOICE_TYPE } from '@/models/Invoice';
import { getTypographyClass } from '@/lib/typography';
import RedirectCell from '@/components/molecules/Table/RedirectCell';
import { useTranslation } from 'react-i18next';

interface Props {
	invoice_id: string;
	breadcrumb_index: number;
}

const CustomerInvoiceDetail: FC<Props> = ({ invoice_id, breadcrumb_index }) => {
	const { t } = useTranslation(['billing', 'common']);
	const na = t('common:labels.na');
	// const { invoice_id } = useParams<{ invoice_id: string }>();
	const [state, setState] = useState({
		isPaymentModalOpen: false,
		isStatusModalOpen: false,
	});
	const [isDownloadFormatOpen, setIsDownloadFormatOpen] = useState(false);
	const [metadata, setMetadata] = useState<Record<string, string>>({});
	const { updateBreadcrumb } = useBreadcrumbsStore();
	const { data, isLoading, isError } = useQuery({
		queryKey: ['fetchInvoice', invoice_id],
		queryFn: async () => {
			const response = await InvoiceApi.listInvoices({
				invoice_ids: [invoice_id!],
				invoice_status: Object.values(INVOICE_STATUS),
			});
			const invoice = response.items[0];
			if (!invoice) throw new Error('Invoice not found');
			return invoice;
		},
		enabled: !!invoice_id,
	});

	const { user } = useUser();

	// Fetch subscription customer when it differs from billing customer
	const hasSubscriptionCustomer = !!data?.subscription_customer_id && data.subscription_customer_id !== data.customer_id;

	const { data: subscriptionCustomer } = useQuery({
		queryKey: ['subscriptionCustomer', data?.subscription_customer_id],
		queryFn: async () => {
			const res = await CustomerApi.getCustomerById(data!.subscription_customer_id!);
			return res;
		},
		enabled: hasSubscriptionCustomer,
	});

	const { mutateAsync: downloadInvoicePdfAsync, isPending: isPdfDownloadPending } = useMutation({
		mutationFn: async () => InvoiceApi.downloadInvoicePdf(invoice_id),
		onSuccess: () => {
			toast.success('Invoice downloaded');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Unable to download invoice');
		},
	});

	useEffect(() => {
		updateBreadcrumb(breadcrumb_index, data?.invoice_number ?? invoice_id);
	}, [invoice_id, data?.invoice_number, breadcrumb_index, updateBreadcrumb]);

	// Process metadata from invoice data
	useEffect(() => {
		if (data && 'metadata' in data && data.metadata) {
			const invoiceMetadata = data.metadata as Record<string, unknown>;
			// Filter to only string values for display
			const filteredMetadata = Object.entries(invoiceMetadata)
				.filter(([_, value]) => typeof value === 'string')
				.reduce((acc, [key, value]) => ({ ...acc, [key]: value as string }), {});
			setMetadata(filteredMetadata);
		}
	}, [data]);

	const customerInfoClass = 'text-sm text-[#71717A] mb-[2px]';
	const invoiceref = useRef<HTMLDivElement>(null);

	const customerAddress =
		data?.customer?.address_line1 +
		' ' +
		data?.customer?.address_line2 +
		' ' +
		data?.customer?.address_city +
		' ' +
		data?.customer?.address_state +
		' ' +
		data?.customer?.address_postal_code +
		' ' +
		data?.customer?.address_country;

	const tenantAddress =
		user?.tenant.billing_details.address.address_line1 +
		' ' +
		user?.tenant.billing_details.address.address_line2 +
		' ' +
		user?.tenant.billing_details.address.address_city +
		' ' +
		user?.tenant.billing_details.address.address_state +
		' ' +
		user?.tenant.billing_details.address.address_postal_code +
		' ' +
		user?.tenant.billing_details.address.address_country;

	if (isLoading) return <Loader />;

	if (isError) {
		toast.error('Something went wrong');
		return null;
	}

	if (!data) return null;

	const invoiceType = data?.invoice_type as INVOICE_TYPE;

	return (
		<div className='space-y-6'>
			{/* invoice details */}
			<div className='space-y-6'>
				<InvoiceStatusModal
					invoice={data}
					isOpen={state.isStatusModalOpen}
					onOpenChange={(open) => {
						setState({
							...state,
							isStatusModalOpen: open,
						});
					}}
				/>
				<InvoicePaymentStatusModal
					invoice={data}
					isOpen={state.isPaymentModalOpen}
					onOpenChange={(open) => {
						setState({
							...state,
							isPaymentModalOpen: open,
						});
					}}
				/>
				<InvoiceDownloadFormatDialog
					open={isDownloadFormatOpen}
					onOpenChange={setIsDownloadFormatOpen}
					isPdfPending={isPdfDownloadPending}
					onSelectPdf={() => downloadInvoicePdfAsync()}
					onSelectCsv={() => {
						const rows = InvoiceApi.downloadInvoiceCsv(data);
						if (rows === 0) {
							toast.error('No billable line items to export');
						} else {
							toast.success('Invoice CSV downloaded');
						}
					}}
				/>
				<div ref={invoiceref} className=' rounded-xl border border-gray-300 p-6'>
					<div className='p-4'>
						<div className='w-full flex justify-between items-center'>
							<p className={cn(getTypographyClass('section-title'), 'text-xl mb-0')}>{t('createInvoice.invoiceDetails')}</p>
							<div className='flex gap-4 items-center'>
								<Button data-html2canvas-ignore='true' onClick={() => setIsDownloadFormatOpen(true)}>
									<Download />
									<span>{t('common:actions.download')}</span>
								</Button>
								<InvoiceTableMenu data={data} />
							</div>
						</div>
						<Spacer className='!my-10' />
						<div className='w-full grid grid-cols-4 gap-4 text-[#09090B] text-sm font-medium'>
							<p>{t('creditNotes.detailPage.invoiceNumber')}</p>
							<p>{t('invoices.detailLabels.dateOfIssue')}</p>
							<p>{t('invoices.detailLabels.dateDue')}</p>
							<p>{t('invoices.detailLabels.paymentStatus')}</p>
						</div>
						<div className='w-full grid grid-cols-4 gap-4 text-[#71717A] text-sm'>
							<p>{data?.invoice_number}</p>
							<p>{formatDate(data?.issue_date ?? data?.created_at ?? '')}</p>
							<p>{data?.due_date ? formatDate(data?.due_date ?? '') : na}</p>
							<p>{getPaymentStatusChip(data?.payment_status ?? '', t)}</p>
						</div>
					</div>
					<div className='my-3 mx-3'>
						<Divider />
					</div>

					<div className={cn('grid p-4 border-b border-gray-200', hasSubscriptionCustomer ? 'grid-cols-3' : 'grid-cols-2')}>
						<div className='text-left'>
							<FormHeader className='!mb-2' title={user?.tenant.name} variant='sub-header' titleClassName='font-semibold' />
							<p className={customerInfoClass}>{user?.tenant.name}</p>
							<p className={customerInfoClass}>{user?.email}</p>
							<p className={cn(customerInfoClass, 'max-w-xs')}>{tenantAddress || na}</p>
						</div>

						<div>
							<FormHeader
								className='!mb-2'
								title={hasSubscriptionCustomer ? t('invoices.detailLabels.billingEntity') : t('createInvoice.billTo')}
								variant='sub-header'
								titleClassName='font-semibold'
							/>
							<RedirectCell redirectUrl={`${RouteNames.customers}/${data?.customer?.id}`}>
								<p className={customerInfoClass}>{data?.customer?.name || na}</p>
							</RedirectCell>
							<p className={customerInfoClass}>{data?.customer?.email || na}</p>
							<p className={customerInfoClass}>{customerAddress || na}</p>
						</div>

						{hasSubscriptionCustomer && (
							<div>
								<FormHeader
									className='!mb-2'
									title={t('invoices.detailLabels.subscriptionCustomer')}
									variant='sub-header'
									titleClassName='font-semibold'
								/>
								<RedirectCell redirectUrl={`${RouteNames.customers}/${subscriptionCustomer?.id ?? data?.subscription_customer_id}`}>
									<p className={customerInfoClass}>{subscriptionCustomer?.name || na}</p>
								</RedirectCell>
								<p className={customerInfoClass}>{subscriptionCustomer?.email || na}</p>
								<p className={customerInfoClass}>
									{subscriptionCustomer
										? [
												subscriptionCustomer.address_line1,
												subscriptionCustomer.address_line2,
												subscriptionCustomer.address_city,
												subscriptionCustomer.address_state,
												subscriptionCustomer.address_postal_code,
												subscriptionCustomer.address_country,
											]
												.filter(Boolean)
												.join(' ') || na
										: na}
								</p>
							</div>
						)}
					</div>
					<InvoiceLineItemTable
						title={t('createInvoice.orderDetails')}
						subtotal={data?.subtotal}
						total={data?.total}
						total_prepaid_credits_applied={data?.total_prepaid_credits_applied}
						discount={data?.total_discount}
						total_tax={data?.total_tax}
						amount_paid={data?.amount_paid}
						overpaid_amount={data?.overpaid_amount}
						amount_remaining={Number(data?.amount_remaining)}
						data={data?.line_items ?? []}
						amount_due={data?.amount_due}
						currency={data?.currency}
						invoiceType={invoiceType as INVOICE_TYPE}
					/>
				</div>
			</div>

			{/* applied taxes if exists */}
			{data?.taxes?.length && data?.taxes?.length > 0 && (
				<Card>
					<CardHeader title={t('invoices.detailLabels.appliedTaxes')} />
					<div className='p-4'>
						<AppliedTaxesTable data={data.taxes} />
					</div>
				</Card>
			)}

			<IntegrationMappingCard
				entityType='invoice'
				entityId={invoice_id}
				isActionDisabled={data?.invoice_status !== INVOICE_STATUS.FINALIZED}
			/>

			{/* metadata section - only show if metadata exists */}
			{metadata && Object.keys(metadata).length > 0 && (
				<Card>
					<CardHeader title={t('taxes.metadata')} />
					<div className='p-4'>
						<table className='w-full table-fixed'>
							<thead>
								<tr className='border-b border-gray-200'>
									<th className='text-left py-3 px-4 text-sm font-large text-[#09090B] w-1/3'>{t('common:form.key')}</th>
									<th className='text-left py-3 px-4 text-sm font-large text-[#09090B] w-2/3'>{t('common:form.value')}</th>
								</tr>
							</thead>
							<tbody>
								{Object.entries(metadata).map(([key, value], index) => (
									<tr key={index} className='border-b border-gray-100 last:border-b-0'>
										<td className='py-3 px-4 text-sm font-medium text-[#09090B] break-words align-top' title={key}>
											{key}
										</td>
										<td className='py-3 px-4 text-sm text-[#71717A] break-words align-top' title={value}>
											{value || na}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card>
			)}
		</div>
	);
};
export default CustomerInvoiceDetail;
