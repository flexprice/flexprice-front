import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Download, Loader2 } from 'lucide-react';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Button, Chip, Sheet } from '@/components/atoms';
import { formatMoney } from '@/utils/common/formatBalance';
import { Invoice, INVOICE_STATUS } from '@/models/Invoice';
import { PAYMENT_STATUS } from '@/constants/payment';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { portalInvoiceQueryKey } from '../queryKeys';
import { isPayable } from '../invoiceStatus';
import { cn } from '@/lib/utils';

interface InvoiceDetailDrawerProps {
	/** Row the drawer was opened from; used for an instant header before the full fetch lands. */
	invoice: Invoice | null;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onDownload: (invoice: Invoice) => void;
	isDownloading?: boolean;
	onPay: (invoice: Invoice) => void;
	payPendingId: string | null;
}

const StatusChip = ({ invoice }: { invoice: Invoice }) => {
	const { t } = useTranslation('customer-portal');
	if (invoice.payment_status === PAYMENT_STATUS.SUCCEEDED) return <Chip label={t('invoiceChip.paid')} variant='success' />;
	if (invoice.invoice_status === INVOICE_STATUS.VOIDED) return <Chip label={t('invoiceChip.voided')} variant='default' />;
	if (invoice.invoice_status === INVOICE_STATUS.DRAFT) return <Chip label={t('invoiceChip.draft')} variant='default' />;
	if (new Date(invoice.due_date) < new Date()) return <Chip label={t('invoiceChip.overdue')} variant='failed' />;
	return <Chip label={t('invoiceChip.pending')} variant='warning' />;
};

/**
 * Label/value pair. The rule between every fact is gone — a divider per row made
 * two dates look like two sections, so the group is separated as a whole instead.
 */
const MetaRow = ({ label, value }: { label: string; value: string }) => (
	<div className='flex items-baseline justify-between gap-4'>
		<span className='text-sm text-content-secondary'>{label}</span>
		<span className='text-end text-sm text-content'>{value}</span>
	</div>
);

const TotalRow = ({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) => (
	<div className='flex items-baseline justify-between gap-4 py-1.5'>
		<span className={cn('text-sm', emphasis ? 'font-medium text-content' : 'text-content-secondary')}>{label}</span>
		<span className={cn('text-sm text-content', emphasis && 'font-semibold')}>{value}</span>
	</div>
);

/**
 * Invoice detail as a right-hand drawer.
 *
 * Reads the full invoice (line items, taxes, totals) from the portal's existing
 * GET /invoices/:id, which returns the breakdown the list response omits.
 */
const InvoiceDetailDrawer = ({
	invoice,
	isOpen,
	onOpenChange,
	onDownload,
	isDownloading,
	onPay,
	payPendingId,
}: InvoiceDetailDrawerProps) => {
	const { t } = useTranslation('customer-portal');

	const { data, isLoading } = useQuery({
		queryKey: portalInvoiceQueryKey(invoice?.id),
		queryFn: () => CustomerPortalApi.getInvoice(invoice!.id),
		enabled: isOpen && !!invoice?.id,
	});

	// Fall back to the list row so the drawer has a header while the detail loads.
	const detail = data ?? invoice;
	// No 'USD' default: fabricating a symbol for a missing currency renders a
	// wrong one, which is worse than rendering none. getCurrencySymbol('') is ''.
	const symbol = getCurrencySymbol(detail?.currency ?? '');
	// formatMoney, not formatAmount: the latter leaves ₹2 where every other portal
	// surface shows ₹2.00.
	const money = (value?: number) => `${symbol}${formatMoney(value ?? 0)}`;

	const invoiceNumber = detail
		? detail.invoice_number || t('invoices.numberPrefix', { id: detail.id.slice(0, 8) })
		: t('invoiceDetail.title');

	// The status belongs beside the number it describes, not stacked under it where
	// it read as the first item of the body rather than part of the heading.
	const title = (
		<span className='flex flex-wrap items-center gap-3'>
			{invoiceNumber}
			{detail && <StatusChip invoice={detail} />}
		</span>
	);

	return (
		<Sheet isOpen={isOpen} onOpenChange={onOpenChange} title={title} size='md'>
			{!detail ? null : (
				// Header → rule → section → rule → section → sticky footer, matching the
				// wallet card. The drawer used to run header, arbitrary spacing, content,
				// per-row separators, and a button adrift in the empty half of the panel.
				<div className='flex min-h-full flex-col'>
					{/* Amount leads — the customer's first question is what they owe. */}
					<div className='pb-5'>
						<p className='text-3xl font-semibold text-content'>
							{money(detail.amount_remaining > 0 ? detail.amount_remaining : detail.total)}
						</p>
						<p className='mt-1 text-xs text-content-tertiary'>
							{detail.amount_remaining > 0 ? t('invoiceDetail.amountDue') : t('invoiceDetail.amountTotal')}
						</p>
					</div>

					<div className='space-y-2 border-t border-line py-5'>
						{detail.period_start && detail.period_end && (
							<MetaRow
								label={t('invoiceDetail.billingPeriod')}
								value={`${formatDateShort(detail.period_start)} – ${formatDateShort(detail.period_end)}`}
							/>
						)}
						<MetaRow label={t('invoiceDetail.issued')} value={formatDateShort(detail.finalized_at || detail.created_at)} />
						{detail.due_date && <MetaRow label={t('invoiceDetail.dueDate')} value={formatDateShort(detail.due_date)} />}
					</div>

					<div className='border-t border-line py-5'>
						<h4 className='mb-3 text-sm font-medium text-content'>{t('invoiceDetail.lineItems')}</h4>
						{isLoading && !data ? (
							<div className='animate-pulse space-y-2'>
								{[1, 2, 3].map((i) => (
									<div key={i} className='h-8 rounded bg-surface-subtle'></div>
								))}
							</div>
						) : detail.line_items?.length ? (
							<div className='space-y-3'>
								{detail.line_items.map((item) => (
									<div key={item.id} className='flex items-baseline justify-between gap-4'>
										<div className='min-w-0'>
											<p className='truncate text-sm text-content'>{item.display_name || item.id}</p>
											{/* Clearly secondary, so it reads as a detail of the line above
											    rather than a second, unrelated item. */}
											{item.quantity && (
												<p className='mt-0.5 text-xs text-content-tertiary'>{t('invoiceDetail.quantity', { quantity: item.quantity })}</p>
											)}
										</div>
										<span className='shrink-0 text-sm text-content'>{money(item.amount)}</span>
									</div>
								))}
							</div>
						) : (
							<p className='text-sm text-content-secondary'>{t('invoiceDetail.noLineItems')}</p>
						)}
					</div>

					<div className='border-t border-line py-5'>
						<div className='space-y-1.5'>
							<TotalRow label={t('invoiceDetail.subtotal')} value={money(detail.subtotal)} />
							{!!detail.total_discount && <TotalRow label={t('invoiceDetail.discount')} value={`−${money(detail.total_discount)}`} />}
							{!!detail.total_tax && <TotalRow label={t('invoiceDetail.tax')} value={money(detail.total_tax)} />}
						</div>
						{/* The figure that matters is separated from its inputs, not listed as
						    one more line among them. */}
						<div className='mt-3 space-y-1.5 border-t border-line pt-3'>
							<TotalRow label={t('invoiceDetail.total')} value={money(detail.total)} emphasis />
							{!!detail.amount_paid && <TotalRow label={t('invoiceDetail.amountPaid')} value={money(detail.amount_paid)} />}
							{detail.amount_remaining > 0 && (
								<TotalRow label={t('invoiceDetail.amountDue')} value={money(detail.amount_remaining)} emphasis />
							)}
						</div>
					</div>

					{/* Pinned to the bottom of the panel: floating mid-drawer above a screen
					    of empty space read as unfinished. -mx-6 spans the sheet's own padding. */}
					<div className='sticky bottom-0 -mx-6 mt-auto flex items-center justify-end gap-2 border-t border-line bg-surface px-6 pb-1 pt-4'>
						{isPayable(detail) && (
							<Button onClick={() => onPay(detail)} isLoading={payPendingId === detail.id} disabled={payPendingId !== null}>
								{t('invoices.pay')}
							</Button>
						)}
						{detail.invoice_status === INVOICE_STATUS.FINALIZED && (
							<Button variant='outline' onClick={() => onDownload(detail)} disabled={isDownloading}>
								{isDownloading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Download className='h-4 w-4' />}
								{t('invoiceDetail.download')}
							</Button>
						)}
					</div>
				</div>
			)}
		</Sheet>
	);
};

export default InvoiceDetailDrawer;
