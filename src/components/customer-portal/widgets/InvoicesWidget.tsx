import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { portalInvoicesQueryKey } from '@/components/customer-portal/queryKeys';
import { Card, Chip } from '@/components/atoms';
import { DropdownMenu } from '@/components/molecules';
import { InvoiceDownloadFormatDialog } from '@/components/molecules';
import { Invoice, INVOICE_STATUS } from '@/models/Invoice';
import { PAYMENT_STATUS } from '@/constants/payment';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { formatMoney } from '@/utils/common/formatBalance';
import { CreditCard, Download, Eye, MoreHorizontal, Receipt, Search, SearchX } from 'lucide-react';
import EmptyState from '../EmptyState';
import PortalSection from '../PortalSection';
import {
	PortalTable,
	PortalTableBody,
	PortalTableCell,
	PortalTableEmpty,
	PortalTableHead,
	PortalTableHeader,
	PortalTableRow,
} from '@/components/atoms/PortalTable/PortalTable';
import { downloadInvoiceLineItemsCsv } from '@/utils/invoices/downloadInvoiceLineItemsCsv';
import InvoiceDetailDrawer from './InvoiceDetailDrawer';
import CheckoutLinkDialog from './CheckoutLinkDialog';
import usePayInvoice from './usePayInvoice';
import { isPayable, isCustomerVisible } from '../invoiceStatus';

interface InvoicesTableProps {
	invoices: Invoice[];
	onOpenDownloadFormat: (invoice: Invoice) => void;
	downloadPendingId: string | null;
	onView: (invoice: Invoice) => void;
	onPay: (invoice: Invoice) => void;
	payPendingId: string | null;
}

const InvoicesTable = ({ invoices, onOpenDownloadFormat, downloadPendingId, onView, onPay, payPendingId }: InvoicesTableProps) => {
	const { t } = useTranslation('customer-portal');

	const getStatusChip = (invoice: Invoice) => {
		if (invoice.payment_status === PAYMENT_STATUS.SUCCEEDED) return <Chip label={t('invoiceChip.paid')} variant='success' />;
		if (invoice.invoice_status === INVOICE_STATUS.VOIDED) return <Chip label={t('invoiceChip.voided')} variant='default' />;
		if (invoice.invoice_status === INVOICE_STATUS.DRAFT) return <Chip label={t('invoiceChip.draft')} variant='default' />;
		const isOverdue = new Date(invoice.due_date) < new Date();
		if (isOverdue) return <Chip label={t('invoiceChip.overdue')} variant='failed' />;
		return <Chip label={t('invoiceChip.pending')} variant='warning' />;
	};

	return (
		<PortalTable>
			<PortalTableHeader>
				<tr>
					<PortalTableHead>{t('invoices.columnDate')}</PortalTableHead>
					<PortalTableHead>{t('invoices.columnInvoice')}</PortalTableHead>
					<PortalTableHead>{t('invoices.columnStatus')}</PortalTableHead>
					<PortalTableHead align='end'>{t('invoices.columnAmount')}</PortalTableHead>
					<PortalTableHead align='end'>{t('invoices.columnAction')}</PortalTableHead>
				</tr>
			</PortalTableHeader>
			<PortalTableBody>
				{invoices.map((invoice) => (
					<PortalTableRow key={invoice.id}>
						<PortalTableCell className='text-content-secondary'>
							{invoice.finalized_at ? formatDateShort(invoice.finalized_at) : formatDateShort(invoice.created_at)}
						</PortalTableCell>
						<PortalTableCell className='font-medium'>
							<button type='button' onClick={() => onView(invoice)} className='text-start text-content hover:underline'>
								{invoice.invoice_number || t('invoices.numberPrefix', { id: invoice.id.slice(0, 8) })}
							</button>
						</PortalTableCell>
						<PortalTableCell>{getStatusChip(invoice)}</PortalTableCell>
						<PortalTableCell align='end' className='font-medium'>
							{/* Resolved per row: the list previously took invoices[0].currency and
								    applied it to every row, so an invoice in another currency was
								    rendered with the wrong symbol — ₹100 in the list against $100 in
								    the drawer for the same invoice. */}
							{getCurrencySymbol(invoice.currency ?? '')}
							{formatMoney(invoice.total ?? 0)}
						</PortalTableCell>
						<PortalTableCell align='end'>
							<div className='flex items-center justify-end'>
								<DropdownMenu
									align='end'
									// The shared default trigger is a bare icon with no accessible
									// name, which leaves the only action on the row unreachable by
									// screen reader and unnameable in tests.
									trigger={
										<button
											type='button'
											aria-label={t('invoices.rowActions', { invoice: invoice.invoice_number || invoice.id })}
											className='p-1.5 rounded-md transition-colors text-content-secondary'>
											<MoreHorizontal className='h-4 w-4' />
										</button>
									}
									options={[
										{
											label: t('invoices.payNow'),
											icon: <CreditCard className='w-4 h-4' />,
											disabled: !isPayable(invoice) || payPendingId !== null,
											disabledReason: isPayable(invoice) ? undefined : t('invoices.notPayable'),
											onSelect: () => onPay(invoice),
										},
										{
											label: t('invoices.viewInvoice'),
											icon: <Eye className='w-4 h-4' />,
											onSelect: () => onView(invoice),
										},
										{
											label: t('invoices.downloadInvoice'),
											icon: <Download className='w-4 h-4' />,
											disabled: invoice.invoice_status !== INVOICE_STATUS.FINALIZED || downloadPendingId !== null,
											disabledReason: invoice.invoice_status === INVOICE_STATUS.FINALIZED ? undefined : t('invoices.notDownloadable'),
											onSelect: () => onOpenDownloadFormat(invoice),
										},
									]}
								/>
							</div>
						</PortalTableCell>
					</PortalTableRow>
				))}
				{invoices.length === 0 && (
					<PortalTableEmpty colSpan={5}>
						<EmptyState icon={<SearchX />} title={t('invoices.noMatchTitle')} description={t('invoices.noMatchDescription')} />
					</PortalTableEmpty>
				)}
			</PortalTableBody>
		</PortalTable>
	);
};

const InvoicesWidget = () => {
	const { t } = useTranslation('customer-portal');
	const [searchQuery, setSearchQuery] = useState('');
	const [downloadTarget, setDownloadTarget] = useState<Invoice | null>(null);
	const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
	const [isCsvExportPending, setIsCsvExportPending] = useState(false);
	const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
	const { payInvoice, payingInvoiceId, checkoutUrl, clearCheckoutUrl } = usePayInvoice();

	const {
		data: invoicesData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: portalInvoicesQueryKey,
		queryFn: () => CustomerPortalApi.getInvoices({ limit: 100, offset: 0 }),
	});

	const { mutateAsync: downloadPdfAsync, isPending: isDownloading } = useMutation({
		mutationFn: (invoiceId: string) => CustomerPortalApi.downloadInvoicePdf(invoiceId),
		onSuccess: () => toast.success(t('toast.invoiceDownloaded')),
		onError: () => toast.error(t('errors.downloadInvoice')),
	});

	useEffect(() => {
		if (isError) toast.error(t('errors.loadInvoices'));
	}, [isError, t]);

	const invoices = useMemo(() => (invoicesData?.items ?? []).filter(isCustomerVisible), [invoicesData?.items]);
	const filteredInvoices = useMemo(() => {
		if (!searchQuery) return invoices;
		const query = searchQuery.toLowerCase();
		return invoices.filter(
			(invoice) =>
				invoice.invoice_number?.toLowerCase().includes(query) ||
				invoice.invoice_status?.toLowerCase().includes(query) ||
				invoice.payment_status?.toLowerCase().includes(query),
		);
	}, [invoices, searchQuery]);

	const openInvoiceDownload = (invoice: Invoice) => {
		setDownloadTarget(invoice);
		setIsDownloadDialogOpen(true);
	};

	const busyDownloadInvoiceId = isDownloading || isCsvExportPending ? (downloadTarget?.id ?? null) : null;

	if (isLoading) {
		return (
			<div className='space-y-6'>
				<div className='h-10 bg-zinc-100 animate-pulse rounded-md'></div>
				<Card className='rounded-xl p-4 bg-surface border border-line'>
					<div className='animate-pulse space-y-3'>
						{[1, 2, 3, 4].map((i) => (
							<div key={i} className='h-12 bg-zinc-100 rounded'></div>
						))}
					</div>
				</Card>
			</div>
		);
	}

	if (invoices.length === 0) {
		return (
			<Card className='rounded-xl p-6 bg-surface border border-line'>
				<EmptyState icon={<Receipt />} title={t('invoices.emptyTitle')} description={t('invoices.emptyDescription')} />
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			<CheckoutLinkDialog url={checkoutUrl} onOpenChange={(open) => !open && clearCheckoutUrl()} />
			<InvoiceDetailDrawer
				invoice={detailInvoice}
				isOpen={detailInvoice !== null}
				onOpenChange={(open) => {
					if (!open) setDetailInvoice(null);
				}}
				onDownload={openInvoiceDownload}
				isDownloading={busyDownloadInvoiceId !== null}
				onPay={(invoice) => payInvoice(invoice.id)}
				payPendingId={payingInvoiceId}
			/>
			<InvoiceDownloadFormatDialog
				open={isDownloadDialogOpen}
				onOpenChange={(open) => {
					setIsDownloadDialogOpen(open);
					if (!open) {
						setDownloadTarget(null);
					}
				}}
				isPdfPending={isDownloading}
				isCsvPending={isCsvExportPending}
				onSelectPdf={async () => {
					if (!downloadTarget) return;
					await downloadPdfAsync(downloadTarget.id);
				}}
				onSelectCsv={async () => {
					if (!downloadTarget) return;
					setIsCsvExportPending(true);
					try {
						const full = downloadTarget.line_items?.length ? downloadTarget : await CustomerPortalApi.getInvoice(downloadTarget.id);
						const rows = downloadInvoiceLineItemsCsv(full);
						if (rows === 0) {
							toast.error(t('toast.noBillableLineItems'));
						} else {
							toast.success(t('toast.invoiceCsvDownloaded'));
						}
					} catch {
						toast.error(t('errors.exportInvoice'));
					} finally {
						setIsCsvExportPending(false);
					}
				}}
			/>
			<div className='relative'>
				<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-content-tertiary' />
				<input
					type='text'
					placeholder={t('invoices.searchPlaceholder')}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className='w-full ps-10 pe-4 py-2.5 text-sm rounded-lg outline-none focus:ring-1 transition-colors'
					style={{
						backgroundColor: 'var(--portal-surface, white)',
						border: '1px solid var(--portal-border, #E9E9E9)',
						color: 'var(--portal-text-primary, #09090b)',
					}}
				/>
			</div>

			<PortalSection flush icon={<Receipt />} title={t('invoices.title')}>
				<InvoicesTable
					invoices={filteredInvoices}
					onOpenDownloadFormat={openInvoiceDownload}
					downloadPendingId={busyDownloadInvoiceId}
					onView={setDetailInvoice}
					onPay={(invoice) => payInvoice(invoice.id)}
					payPendingId={payingInvoiceId}
				/>
			</PortalSection>
		</div>
	);
};

export default InvoicesWidget;
