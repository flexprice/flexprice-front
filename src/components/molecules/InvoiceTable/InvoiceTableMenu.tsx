import { Invoice, INVOICE_STATUS, INVOICE_TYPE } from '@/models/Invoice';
import { FC, useState } from 'react';
import { DropdownMenu, RecordPaymentTopup } from '..';
import InvoiceDownloadFormatDialog from '../InvoiceDownloadFormatDialog/InvoiceDownloadFormatDialog';
import { DropdownMenuOption } from '../DropdownMenu/DropdownMenu';
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

interface Props {
	data: Invoice;
}

const InvoiceTableMenu: FC<Props> = ({ data }) => {
	const navigate = useNavigate();

	const { mutate: triggerCommunication } = useMutation({
		mutationFn: async (invoice_id: string) => {
			return await InvoiceApi.triggerCommunication(invoice_id);
		},
		onSuccess: () => {
			toast.success('Communication triggered');
			refetchQueries(['fetchInvoice', data.id]);
			refetchQueries(['fetchInvoices']);
			refetchQueries(['invoice', data.customer_id]);
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

	const { mutate: recalculateInvoice, isPending: isRecalculating } = useMutation({
		mutationFn: async (invoice_id: string) => {
			return await InvoiceApi.recalculateInvoice(invoice_id);
		},
		onSuccess: () => {
			toast.success('Invoice recalculation has been triggered. The replacement invoice will be available once the process completes.');
			refetchQueries(['fetchInvoice', data.id]);
			refetchQueries(['fetchInvoices']);
			refetchQueries(['invoice', data.customer_id]);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Unable to recalculate invoice');
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

	const menuOptions: DropdownMenuOption[] = [
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
				data?.payment_status === PAYMENT_STATUS.SUCCEEDED ||
				data?.invoice_status === INVOICE_STATUS.VOIDED ||
				(data?.amount_remaining ?? 0) === 0,
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
		},
		{
			label: 'Issue a Credit Note',
			group: 'Actions',
			disabled: data?.invoice_status !== 'FINALIZED' || data?.payment_status === 'REFUNDED',
			onSelect: () => {
				navigate(`${RouteNames.customers}/${data?.customer_id}/invoice/${data?.id}/credit-note`);
			},
		},
		{
			label: 'Recalculate Invoice',
			group: 'Actions',
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
						toast.error('No billable line items to export');
					} else {
						toast.success('Invoice CSV downloaded');
					}
				}}
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
