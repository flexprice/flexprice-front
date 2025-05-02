import { Button, CheckboxRadioGroupItem, FormHeader, Modal, Select, Spacer } from '@/components/atoms';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { Invoice } from '@/models/Invoice';
import InvoiceApi from '@/api/InvoiceApi';
import { useMutation } from '@tanstack/react-query';
import { FC, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface InvoiceStatusProps {
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

	
 * 
 */

const InvoiceStatusModal: FC<InvoiceStatusProps> = ({ isOpen, onOpenChange, invoice }) => {
	const statusOptions: CheckboxRadioGroupItem[] = [
		{
			label: 'Void',
			value: 'VOIDED',
			description: 'Cancels the invoice and prevents further changes.',
			disabled: !(
				(invoice?.invoice_status === 'DRAFT' || invoice?.invoice_status === 'FINALIZED') &&
				(invoice?.payment_status === 'FAILED' || invoice?.payment_status === 'PENDING')
			),
		},
		{
			label: 'Finalize',
			value: 'FINALIZED',
			description: 'Marks the invoice as final and ready for processing.',
			disabled: !(invoice?.invoice_status === 'DRAFT' && invoice?.payment_status === 'FAILED'),
		},
		{
			label: 'Draft',
			value: 'DRAFT',
			description: 'Keeps the invoice in draft mode, allowing further edits.',
			disabled: true,
		},
	];

	const { isPending, mutate: updateStatus } = useMutation({
		mutationFn: async (status: string) => {
			if (status === 'VOIDED') {
				return await InvoiceApi.voidInvoice(invoice?.id as string);
			} else if (status === 'FINALIZED') {
				return await InvoiceApi.finalizeInvoice(invoice?.id as string);
				// update invoice status to draft
				// update payment status to pending
			} else if (status === 'DRAFT') {
				toast.error('Draft status is yet to be implemented');
				// return await InvoiceApi.voidInvoice(invoice?.id as string);
				// update invoice status to draft
				// update payment status to pending
			}
		},
		async onSuccess() {
			toast.success('Invoice status updated successfully');
			await refetchQueries(['fetchInvoices']);
			await refetchQueries(['fetchInvoice']);
		},
		onError: (error: ServerError) => {
			toast.error(error?.error.message || 'Failed to update invoice status');
		},
	});

	const [status, setStatus] = useState(
		invoice ? statusOptions.find((option) => option.value === invoice.invoice_status) || statusOptions[0] : statusOptions[0],
	);

	useEffect(() => {
		if (invoice) {
			setStatus(statusOptions.find((option) => option.value === invoice.invoice_status) || statusOptions[0]);
		}
	}, [invoice]);

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
			<div className='card bg-white max-w-lg'>
				<FormHeader
					title='Update Invoice Status'
					variant='sub-header'
					subtitle='Updating the invoice status will not impact the payment status.'
				/>
				<Spacer className='!my-6' />
				<Select
					value={status.value}
					options={statusOptions}
					onChange={(e) => setStatus(statusOptions.find((option) => option.value === e) || statusOptions[0])}
					isRadio={true}
				/>

				<Spacer className='!my-6' />
				<div className='flex justify-end gap-4'>
					<Button onClick={() => onOpenChange(false)} variant={'outline'} className='btn btn-primary'>
						Cancel
					</Button>
					<Button
						disabled={isPending}
						onClick={() => {
							onOpenChange(false);
							updateStatus(status.value);
						}}
						className='btn btn-primary'>
						Update
					</Button>
				</div>
			</div>
		</Modal>
	);
};

export default InvoiceStatusModal;
