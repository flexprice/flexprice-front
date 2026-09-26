import { Invoice, INVOICE_STATUS, INVOICE_TYPE } from '@/models/Invoice';
import { InvoiceListItem } from '@/types/dto';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownMenu, RecordPaymentTopup } from '..';
import InvoiceDownloadFormatDialog from '../InvoiceDownloadFormatDialog/InvoiceDownloadFormatDialog';
import { Button, Dialog } from '@/components/atoms';
import { DropdownMenuOption, getCopyIdOption } from '../DropdownMenu/DropdownMenu';
import { useMutation } from '@tanstack/react-query';
import InvoiceApi from '@/api/InvoiceApi';
import toast from 'react-hot-toast';
import InvoiceStatusModal from './InvoiceStatusModal';
import InvoicePaymentStatusModal from './InvoicePaymentStatusModal';
import { useNavigate } from 'react-router';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { refetchInvoiceQueries } from '@/core/services/tanstack/queryKeys';
import { PAYMENT_DESTINATION_TYPE } from '@/models/Payment';
import { PAYMENT_STATUS } from '@/constants';
import { RouteNames } from '@/core/routes/Routes';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';

interface Props {
	data: InvoiceListItem;
}

const InvoiceTableMenu: FC<Props> = ({ data }) => {
	const navigate = useNavigate();
	const { t } = useTranslation('billing');
	const { t: tc } = useTranslation('common');
	const { can } = useCurrentUserPermissions();
	const canWrite = can('invoice', 'write');
	const writeDeniedReason = canWrite ? undefined : t('invoices.writeDenied');
	// /compute accepts DRAFT and SKIPPED only (anything else is a 400); /recalculate takes it
	// from there for a FINALIZED invoice. A voided invoice is the end of the line for both, and
	// one already replaced must not be replaced again.
	const computesInPlace = data.invoice_status === INVOICE_STATUS.DRAFT || data.invoice_status === INVOICE_STATUS.SKIPPED;
	const isRecalculable = (computesInPlace || data.invoice_status === INVOICE_STATUS.FINALIZED) && !data.recalculated_invoice_id;
	// PUT /invoices/:id only accepts DRAFT and FINALIZED invoices.
	const isEditableStatus = data.invoice_status === INVOICE_STATUS.DRAFT || data.invoice_status === INVOICE_STATUS.FINALIZED;

	const { mutate: triggerCommunication } = useMutation({
		mutationFn: async (invoice_id: string) => {
			return await InvoiceApi.triggerCommunication(invoice_id);
		},
		onSuccess: () => {
			toast.success('Communication triggered');
			void refetchInvoiceQueries();
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Unable to trigger communication');
		},
	});

	const { mutateAsync: downloadInvoicePdfAsync, isPending: isPdfDownloadPending } = useMutation({
		mutationFn: async (invoice_id: string) => {
			return await InvoiceApi.downloadInvoicePdf(invoice_id);
		},
		onSuccess: () => {
			toast.success('Invoice downloaded');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Unable to download invoice');
		},
	});

	const { mutateAsync: downloadInvoiceCsvAsync, isPending: isCsvDownloadPending } = useMutation({
		mutationFn: async (invoice: InvoiceListItem) => {
			const fullInvoice: Invoice = invoice.line_items?.length ? (invoice as Invoice) : await InvoiceApi.getInvoiceById(invoice.id);
			return InvoiceApi.downloadInvoiceCsv(fullInvoice);
		},
		onSuccess: (rows) => {
			if (rows === 0) {
				toast.error('No billable line items to export');
			} else {
				toast.success('Invoice CSV downloaded');
			}
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Unable to download invoice CSV');
		},
	});

	const { mutate: recalculateInvoice, isPending: isRecalculating } = useMutation({
		mutationFn: async (invoice_id: string) => {
			return await InvoiceApi.recalculateInvoice(invoice_id);
		},
		onSuccess: () => {
			toast.success(t('invoices.recompute.replacementQueued'));
			setIsRecomputeOpen(false);
			void refetchInvoiceQueries();
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Unable to recalculate invoice');
		},
	});

	// Recomputes a DRAFT in place from current pricing and usage. Separate from the recalculate
	// above, which replaces a FINALIZED invoice with a new one.
	const { mutate: computeInvoice, isPending: isComputing } = useMutation({
		mutationFn: async (invoice_id: string) => {
			return await InvoiceApi.computeInvoice(invoice_id);
		},
		onSuccess: () => {
			toast.success(t('invoices.recompute.success'));
			setIsRecomputeOpen(false);
			void refetchInvoiceQueries();
		},
		onError: (error: Error) => {
			// A hand-edited invoice is refused by the backend and there is no flag to pre-empt it,
			// so the server's reason is the only thing that explains the refusal.
			toast.error(error.message || t('invoices.recompute.failed'));
		},
	});

	const [isRecomputeOpen, setIsRecomputeOpen] = useState(false);
	const isRecalculationPending = isComputing || isRecalculating;
	const [isDownloadFormatOpen, setIsDownloadFormatOpen] = useState(false);

	const [state, setState] = useState<{
		isPaymentModalOpen: boolean;
		isStatusModalOpen: boolean;
		isRecordPaymentDrawerOpen: boolean;
		activeInvoice?: InvoiceListItem;
	}>({
		isPaymentModalOpen: false,
		isStatusModalOpen: false,
		isRecordPaymentDrawerOpen: false,
	});

	const menuOptions: DropdownMenuOption[] = [
		getCopyIdOption(data.id, tc, { entityType: 'Invoice' }),
		{
			label: t('invoices.edit.menuLabel'),
			group: 'Actions',
			onSelect: () => {
				navigate(`${RouteNames.invoices}/${data.id}/edit`);
			},
			disabled: !canWrite || !isEditableStatus,
			disabledReason: writeDeniedReason ?? (!isEditableStatus ? t('invoices.edit.menuDisabledStatus') : undefined),
		},
		{
			label: 'Download Invoice',
			group: 'Actions',
			onSelect: () => {
				setIsDownloadFormatOpen(true);
			},
		},
		{
			label: 'Send Communication',
			group: 'Actions',
			onSelect: () => {
				triggerCommunication(data.id);
			},
			disabled: !canWrite,
			disabledReason: writeDeniedReason,
		},
		{
			label: 'Record Payment',
			group: 'Actions',
			onSelect: () => {
				setState({
					...state,
					isRecordPaymentDrawerOpen: true,
					activeInvoice: data,
				});
			},
			disabled:
				!canWrite ||
				data?.payment_status === PAYMENT_STATUS.SUCCEEDED ||
				data?.invoice_status === INVOICE_STATUS.VOIDED ||
				(data?.amount_remaining ?? 0) === 0,
			disabledReason: writeDeniedReason,
		},
		{
			label: 'Update Invoice Status',
			group: 'Actions',
			onSelect: () => {
				setState({
					...state,
					isStatusModalOpen: true,
					activeInvoice: data,
				});
			},
			disabled: !canWrite,
			disabledReason: writeDeniedReason,
		},
		{
			label: 'Update Payment Status',
			group: 'Actions',
			onSelect: () => {
				setState({
					...state,
					isPaymentModalOpen: true,
					activeInvoice: data,
				});
			},
			disabled: !canWrite,
			disabledReason: writeDeniedReason,
		},
		{
			label: 'Issue a Credit Note',
			group: 'Actions',
			disabled: !canWrite || data?.invoice_status !== 'FINALIZED' || data?.payment_status === 'REFUNDED',
			disabledReason: writeDeniedReason,
			onSelect: () => {
				navigate(`${RouteNames.customers}/${data?.customer_id}/invoice/${data?.id}/credit-note`);
			},
		},
		{
			label: t('invoices.recompute.menuLabel'),
			group: 'Actions',
			// One action, two endpoints. A draft (or skipped) invoice is rewritten in place by
			// /compute; a finalized one cannot be, so it is voided and reissued by /recalculate.
			// Both are "recalculate this invoice" to the person clicking — the split is ours.
			disabled: !canWrite || !isRecalculable || data?.invoice_type !== INVOICE_TYPE.SUBSCRIPTION || isRecalculationPending,
			// Every disabled path needs its own reason: a greyed item with no tooltip on an
			// invoice that plainly *is* a draft reads as a broken button.
			disabledReason:
				writeDeniedReason ??
				(data?.invoice_type !== INVOICE_TYPE.SUBSCRIPTION
					? t('invoices.recompute.menuDisabledType')
					: data?.recalculated_invoice_id
						? t('invoices.recompute.menuDisabledAlready')
						: !isRecalculable
							? t('invoices.recompute.menuDisabledStatus')
							: undefined),
			onSelect: () => {
				setIsRecomputeOpen(true);
			},
		},
		{
			label: 'View Customer',
			group: 'Connections',
			onSelect: () => {
				navigate(`${RouteNames.customers}/${data.customer_id}`);
			},
		},
		{
			label: 'View Subscription',
			group: 'Connections',
			onSelect() {
				navigate(`${RouteNames.customers}/${data.customer_id}/subscription/${data.subscription_id}`);
			},
		},
	];
	const handlePaymentSuccess = () => {
		void refetchInvoiceQueries();
		void refetchQueries(['payments', data.id]);
	};
	return (
		<div>
			<Dialog
				isOpen={isRecomputeOpen}
				onOpenChange={setIsRecomputeOpen}
				// Rendered inside clickable table rows, which would otherwise navigate on any click.
				interactiveContent
				title={t('invoices.recompute.confirmTitle')}
				description={
					// The two paths differ in a way the user must know before confirming: one edits
					// this invoice, the other voids it and issues a replacement with a new number.
					computesInPlace ? t('invoices.recompute.confirmDescription') : t('invoices.recompute.confirmDescriptionFinalized')
				}>
				<div className='flex justify-end gap-2 pt-4'>
					<Button variant='outline' disabled={isRecalculationPending} onClick={() => setIsRecomputeOpen(false)}>
						{tc('actions.cancel')}
					</Button>
					<Button
						isLoading={isRecalculationPending}
						disabled={isRecalculationPending}
						onClick={() => (computesInPlace ? computeInvoice(data.id) : recalculateInvoice(data.id))}>
						{t('invoices.recompute.confirmAction')}
					</Button>
				</div>
			</Dialog>
			<InvoiceDownloadFormatDialog
				open={isDownloadFormatOpen}
				onOpenChange={setIsDownloadFormatOpen}
				isPdfPending={isPdfDownloadPending}
				onSelectPdf={() => downloadInvoicePdfAsync(data.id)}
				onSelectCsv={() => {
					void downloadInvoiceCsvAsync(data).catch(() => undefined);
				}}
				isCsvPending={isCsvDownloadPending}
			/>
			<InvoiceStatusModal
				invoice={state.activeInvoice}
				isOpen={state.isStatusModalOpen}
				onOpenChange={(open) => {
					setState({
						...state,
						isStatusModalOpen: open,
					});
				}}
			/>
			<InvoicePaymentStatusModal
				invoice={state.activeInvoice}
				isOpen={state.isPaymentModalOpen}
				onOpenChange={(open) => {
					setState({
						...state,
						isPaymentModalOpen: open,
					});
				}}
			/>
			<RecordPaymentTopup
				isOpen={state.isRecordPaymentDrawerOpen}
				onOpenChange={(open: boolean) => {
					setState({
						...state,
						isRecordPaymentDrawerOpen: open,
					});
				}}
				destination_id={data.id}
				destination_type={PAYMENT_DESTINATION_TYPE.INVOICE}
				customer_id={data.customer_id}
				max_amount={Number(data?.amount_remaining ?? 0)}
				currency={data.currency}
				onSuccess={handlePaymentSuccess}
			/>
			<DropdownMenu options={menuOptions} />
		</div>
	);
};

export default InvoiceTableMenu;
