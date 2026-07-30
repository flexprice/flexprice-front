import { Button, CheckboxRadioGroupItem, FormHeader, Modal, Select, Spacer } from '@/components/atoms';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { Invoice, INVOICE_STATUS } from '@/models/Invoice';
import InvoiceApi from '@/api/InvoiceApi';
import { useMutation } from '@tanstack/react-query';
import { FC, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PAYMENT_STATUS } from '@/constants/payment';
import { useTranslation } from 'react-i18next';
interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	invoice?: Invoice;
}

/**
 * invoice status

	- for void
		- invoice_status = draft | finalize
		- payment_status = failed | pending 
	    
	- for finalize
		- invoice_status = draft
		- payment_status = pending

payment status
	- from pending -> sucess | failed | pending
	- from failed -> sucess | failed | pending
	- from success -> disabled


 * 
 */

const InvoicePaymentStatusModal: FC<Props> = ({ isOpen, onOpenChange, invoice }) => {
	const { t } = useTranslation(['billing', 'common']);

	const paymentOptions: CheckboxRadioGroupItem[] = useMemo(
		() => [
			{
				label: t('invoices.details.paymentStatusModal.succeededLabel'),
				value: 'SUCCEEDED',
				description: t('invoices.details.paymentStatusModal.succeededDescription'),
				disabled: invoice?.payment_status === PAYMENT_STATUS.SUCCEEDED || invoice?.invoice_status === INVOICE_STATUS.VOIDED,
			},
			{
				label: t('invoices.details.paymentStatusModal.failedLabel'),
				value: 'FAILED',
				description: t('invoices.details.paymentStatusModal.failedDescription'),
				disabled: invoice?.payment_status === PAYMENT_STATUS.SUCCEEDED || invoice?.invoice_status === INVOICE_STATUS.VOIDED,
			},
			{
				label: t('invoices.details.paymentStatusModal.pendingLabel'),
				value: 'PENDING',
				description: t('invoices.details.paymentStatusModal.pendingDescription'),
				disabled: invoice?.payment_status === PAYMENT_STATUS.SUCCEEDED || invoice?.invoice_status === INVOICE_STATUS.VOIDED,
			},
		],
		[invoice?.payment_status, invoice?.invoice_status, t],
	);

	const [status, setstatus] = useState(paymentOptions[0]);

	useEffect(() => {
		if (invoice) {
			setstatus(paymentOptions.find((option) => option.value === invoice?.payment_status) || paymentOptions[0]);
		}
	}, [invoice, invoice?.payment_status, paymentOptions, t]);

	const { mutate: updatePayment, isPending } = useMutation({
		mutationFn: async ({ invoiceId, status: nextStatus }: { invoiceId: string; status: string }) => {
			return await InvoiceApi.updateInvoicePaymentStatus(invoiceId, { payment_status: nextStatus });
		},
		async onSuccess() {
			toast.success(t('invoices.details.paymentStatusModal.toastSuccess'));
			await refetchQueries(['fetchInvoices']);
			await refetchQueries(['fetchInvoice']);
		},
		onError(error: Error) {
			toast.error(error.message || t('invoices.details.paymentStatusModal.toastError'));
		},
	});

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
			<div className='card bg-white max-w-lg'>
				<FormHeader
					title={t('invoices.details.updatePaymentStatus')}
					variant='sub-header'
					subtitle={t('invoices.details.paymentStatusModal.subtitle')}
				/>
				<Spacer className='!my-6' />
				<Select
					value={status.value}
					options={paymentOptions}
					isRadio={true}
					onChange={(e) => setstatus(paymentOptions.find((option) => option.value === e) || paymentOptions[0])}
				/>

				<Spacer className='!my-6' />
				<div className='flex justify-end gap-4'>
					<Button
						onClick={() => {
							onOpenChange(false);
						}}
						variant={'outline'}
						className='btn btn-primary'>
						{t('common:actions.cancel')}
					</Button>

					<Button
						disabled={isPending}
						onClick={() => {
							onOpenChange(false);
							updatePayment({ invoiceId: invoice?.id || '', status: status.value });
						}}
						className='btn btn-primary'>
						{t('common:actions.update')}
					</Button>
				</div>
			</div>
		</Modal>
	);
};

export default InvoicePaymentStatusModal;
