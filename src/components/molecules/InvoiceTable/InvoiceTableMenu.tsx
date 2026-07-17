import { Invoice, INVOICE_STATUS, INVOICE_TYPE } from '@/models/Invoice';
import { FC, useState, useMemo } from 'react';
import { DropdownMenu, RecordPaymentTopup } from '..';
import InvoiceDownloadFormatDialog from '../InvoiceDownloadFormatDialog/InvoiceDownloadFormatDialog';
import { DropdownMenuOption, getCopyIdOption } from '../DropdownMenu/DropdownMenu';
import { useMutation } from '@tanstack/react-query';
import InvoiceApi from '@/api/InvoiceApi';
import toast from 'react-hot-toast';
import InvoiceStatusModal from './InvoiceStatusModal';
import InvoicePaymentStatusModal from './InvoicePaymentStatusModal';
import { useNavigate } from 'react-router';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { PAYMENT_DESTINATION_TYPE } from '@/models/Payment';
import { PAYMENT_STATUS } from '@/constants';
import { RouteNames } from '@/core/routes/Routes';
import { useTranslation } from 'react-i18next';

interface Props {
	data: Invoice;
}

const InvoiceTableMenu: FC<Props> = ({ data }) => {
	const navigate = useNavigate();
	const { t } = useTranslation(['billing', 'common']);
	const { t: tc } = useTranslation('common');

	const { mutate: triggerCommunication } = useMutation({
		mutationFn: async (invoice_id: string) => {
			return await InvoiceApi.triggerCommunication(invoice_id);
		},
		onSuccess: () => {
			toast.success(t('billing:invoices.list.tableMenu.toast.communicationTriggered'));
			refetchQueries(['fetchInvoice', data.id]);
			refetchQueries(['fetchInvoices']);
			refetchQueries(['invoice', data.customer_id]);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('billing:invoices.list.tableMenu.toast.communicationFailed'));
		},
	});

	const { mutateAsync: downloadInvoicePdfAsync, isPending: isPdfDownloadPending } = useMutation({
		mutationFn: async (invoice_id: string) => {
			return await InvoiceApi.downloadInvoicePdf(invoice_id);
		},
		onSuccess: () => {
			toast.success(t('billing:invoices.list.tableMenu.toast.invoiceDownloaded'));
		},
		onError: (error: Error) => {
			toast.error(error.message || t('billing:invoices.list.tableMenu.toast.downloadFailed'));
		},
	});

	const { mutate: recalculateInvoice, isPending: isRecalculating } = useMutation({
		mutationFn: async (invoice_id: string) => {
			return await InvoiceApi.recalculateInvoice(invoice_id);
		},
		onSuccess: () => {
			toast.success(t('billing:invoices.list.tableMenu.toast.recalculateTriggered'));
			refetchQueries(['fetchInvoice', data.id]);
			refetchQueries(['fetchInvoices']);
			refetchQueries(['invoice', data.customer_id]);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('billing:invoices.list.tableMenu.toast.recalculateFailed'));
		},
	});

	const [isDownloadFormatOpen, setIsDownloadFormatOpen] = useState(false);

	const [state, setState] = useState<{
		isPaymentModalOpen: boolean;
		isStatusModalOpen: boolean;
		isRecordPaymentDrawerOpen: boolean;
		activeInvoice?: Invoice;
	}>({
		isPaymentModalOpen: false,
		isStatusModalOpen: false,
		isRecordPaymentDrawerOpen: false,
	});

	const actionsGroup = t('common:tableMenu.groups.actions');
	const connectionsGroup = t('common:tableMenu.groups.connections');

	const menuOptions: DropdownMenuOption[] = useMemo(
		() => [
			getCopyIdOption(data.id, tc, { entityType: 'Invoice' }),
			{
				label: t('billing:invoices.list.tableMenu.downloadInvoice'),
				group: actionsGroup,
				onSelect: () => {
					setIsDownloadFormatOpen(true);
				},
			},
			{
				label: t('billing:invoices.list.tableMenu.sendCommunication'),
				group: actionsGroup,
				onSelect: () => {
					triggerCommunication(data.id);
				},
			},
			{
				label: t('billing:invoices.list.tableMenu.recordPayment'),
				group: actionsGroup,
				onSelect: () => {
					setState((prev) => ({
						...prev,
						isRecordPaymentDrawerOpen: true,
						activeInvoice: data,
					}));
				},
				disabled:
					data?.payment_status === PAYMENT_STATUS.SUCCEEDED ||
					data?.invoice_status === INVOICE_STATUS.VOIDED ||
					(data?.amount_remaining ?? 0) === 0,
			},
			{
				label: t('billing:invoices.list.tableMenu.updateInvoiceStatus'),
				group: actionsGroup,
				onSelect: () => {
					setState((prev) => ({
						...prev,
						isStatusModalOpen: true,
						activeInvoice: data,
					}));
				},
			},
			{
				label: t('billing:invoices.list.tableMenu.updatePaymentStatus'),
				group: actionsGroup,
				onSelect: () => {
					setState((prev) => ({
						...prev,
						isPaymentModalOpen: true,
						activeInvoice: data,
					}));
				},
			},
			{
				label: t('billing:invoices.list.tableMenu.issueCreditNote'),
				group: actionsGroup,
				disabled: data?.invoice_status !== 'FINALIZED' || data?.payment_status === 'REFUNDED',
				onSelect: () => {
					navigate(`${RouteNames.customers}/${data?.customer_id}/invoice/${data?.id}/credit-note`);
				},
			},
			{
				label: t('billing:invoices.list.tableMenu.recalculateInvoice'),
				group: actionsGroup,
				disabled:
					data?.invoice_status !== INVOICE_STATUS.VOIDED ||
					data?.invoice_type !== INVOICE_TYPE.SUBSCRIPTION ||
					!!data?.recalculated_invoice_id ||
					isRecalculating,
				onSelect: () => {
					recalculateInvoice(data.id);
				},
			},
			{
				label: t('billing:invoices.list.tableMenu.viewCustomer'),
				group: connectionsGroup,
				onSelect: () => {
					navigate(`${RouteNames.customers}/${data.customer_id}`);
				},
			},
			{
				label: t('billing:invoices.list.tableMenu.viewSubscription'),
				group: connectionsGroup,
				onSelect() {
					navigate(`${RouteNames.customers}/${data.customer_id}/subscription/${data.subscription_id}`);
				},
			},
		],
		[actionsGroup, connectionsGroup, data, isRecalculating, navigate, recalculateInvoice, t, tc, triggerCommunication],
	);

	const handlePaymentSuccess = () => {
		refetchQueries(['fetchInvoice', data.id]);
		refetchQueries(['payments', data.id]);
		refetchQueries(['fetchInvoices']);
		refetchQueries(['invoice', data.customer_id]);
	};

	return (
		<div>
			<InvoiceDownloadFormatDialog
				open={isDownloadFormatOpen}
				onOpenChange={setIsDownloadFormatOpen}
				isPdfPending={isPdfDownloadPending}
				onSelectPdf={() => downloadInvoicePdfAsync(data.id)}
				onSelectCsv={() => {
					const rows = InvoiceApi.downloadInvoiceCsv(data);
					if (rows === 0) {
						toast.error(t('billing:invoices.list.tableMenu.toast.noLineItemsToExport'));
					} else {
						toast.success(t('billing:invoices.list.tableMenu.toast.csvDownloaded'));
					}
				}}
			/>
			<InvoiceStatusModal
				invoice={state.activeInvoice}
				isOpen={state.isStatusModalOpen}
				onOpenChange={(open) => {
					setState((prev) => ({
						...prev,
						isStatusModalOpen: open,
					}));
				}}
			/>
			<InvoicePaymentStatusModal
				invoice={state.activeInvoice}
				isOpen={state.isPaymentModalOpen}
				onOpenChange={(open) => {
					setState((prev) => ({
						...prev,
						isPaymentModalOpen: open,
					}));
				}}
			/>
			<RecordPaymentTopup
				isOpen={state.isRecordPaymentDrawerOpen}
				onOpenChange={(open: boolean) => {
					setState((prev) => ({
						...prev,
						isRecordPaymentDrawerOpen: open,
					}));
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
