import { AddActionButton, Button, Chip, Dialog, Input, Page, Select, SelectOption, Textarea } from '@/components/atoms';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import InvoiceApi from '@/api/InvoiceApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditNote, CREDIT_NOTE_REASON, CREDIT_NOTE_TYPE } from '@/models/CreditNote';
import { CreateCreditNoteLineItemRequest, CreateCreditNoteParams } from '@/types/dto/CreditNote';
import CreditNoteApi from '@/api/CreditNoteApi';
import { PAYMENT_STATUS, formatCurrency, getCurrencySymbol, toSentenceCase } from '@/constants';
import toast from 'react-hot-toast';
import { RouteNames } from '@/core/routes/Routes';

interface LineItemForm {
	id: string;
	amount: number;
	max_amount: number;
	display_name: string;
	quantity: string;
	unit_price: number;
}

interface CreditNotePreview {
	type: CREDIT_NOTE_TYPE;
	totalAmount: number;
	effectDescription: string;
	settlementDescription: string;
}

const AddCreditNotePage = () => {
	const { invoice_id } = useParams<{ invoice_id: string }>();
	const { updateBreadcrumb, setSegmentLoading } = useBreadcrumbsStore();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: invoice, isLoading } = useQuery({
		queryKey: ['fetchInvoice', invoice_id],
		queryFn: async () => await InvoiceApi.getInvoiceById(invoice_id!),
		enabled: !!invoice_id,
	});

	// Form state
	const [selectedReason, setSelectedReason] = useState<CREDIT_NOTE_REASON | ''>('');
	const [memo, setMemo] = useState('');
	const [lineItems, setLineItems] = useState<LineItemForm[]>([]);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [showMemo, setShowMemo] = useState(false);

	// Business logic: Determine credit note type based on payment status
	const getCreditNoteType = (paymentStatus: string): CREDIT_NOTE_TYPE => {
		switch (paymentStatus.toUpperCase()) {
			case PAYMENT_STATUS.SUCCEEDED:
			case PAYMENT_STATUS.PARTIALLY_REFUNDED:
				return CREDIT_NOTE_TYPE.REFUND;
			case PAYMENT_STATUS.FAILED:
			case PAYMENT_STATUS.PENDING:
			case PAYMENT_STATUS.PROCESSING:
			case PAYMENT_STATUS.INITIATED:
				return CREDIT_NOTE_TYPE.ADJUSTMENT;
			default:
				return CREDIT_NOTE_TYPE.ADJUSTMENT;
		}
	};

	// Initialize line items when invoice data is loaded
	useEffect(() => {
		if (invoice?.line_items) {
			const initialLineItems: LineItemForm[] = invoice.line_items.map((item) => {
				const quantity = parseFloat(item.quantity) || 1;
				const unit_price = item.amount / quantity;

				return {
					id: item.id,
					amount: 0, // Initialize with 0 as requested
					max_amount: item.amount, // Use original line item amount as max
					display_name: item.display_name,
					quantity: item.quantity,
					unit_price: unit_price,
				};
			});
			setLineItems(initialLineItems);
		}
	}, [invoice]);

	// Update breadcrumbs when invoice data is loaded
	useEffect(() => {
		setSegmentLoading(2, true);

		if (invoice) {
			updateBreadcrumb(2, invoice.customer?.external_id || 'Customer');
			updateBreadcrumb(4, invoice.invoice_number);
			updateBreadcrumb(5, 'Issue Credit Note');
		}
	}, [invoice, updateBreadcrumb, setSegmentLoading]);

	const reasonOptions: SelectOption[] = [
		{ label: 'Duplicate', value: CREDIT_NOTE_REASON.DUPLICATE },
		{ label: 'Fraudulent', value: CREDIT_NOTE_REASON.FRAUDULENT },
		{ label: 'Order Change', value: CREDIT_NOTE_REASON.ORDER_CHANGE },
		{ label: 'Unsatisfactory', value: CREDIT_NOTE_REASON.UNSATISFACTORY },
		{ label: 'Service Issue', value: CREDIT_NOTE_REASON.SERVICE_ISSUE },
		{ label: 'Billing Error', value: CREDIT_NOTE_REASON.BILLING_ERROR },
		{ label: 'Subscription Cancellation', value: CREDIT_NOTE_REASON.SUBSCRIPTION_CANCELLATION },
	];

	// Create credit note mutation
	const createCreditNoteMutation = useMutation({
		mutationFn: (params: CreateCreditNoteParams) => CreditNoteApi.createCreditNote(params),
		onSuccess: (data: CreditNote) => {
			queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
			navigate(`${RouteNames.creditNotes}/${data.id}`);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to create credit note');
		},
	});

	// Calculate totals - only include line items with amount > 0
	const validLineItems = lineItems.filter((item) => item.amount > 0);
	const totalCreditAmount = validLineItems.reduce((sum, item) => sum + item.amount, 0);

	// Generate credit note preview
	const getCreditNotePreview = (): CreditNotePreview => {
		if (!invoice) {
			return {
				type: CREDIT_NOTE_TYPE.ADJUSTMENT,
				totalAmount: 0,
				effectDescription: '',
				settlementDescription: '',
			};
		}

		const creditNoteType = getCreditNoteType(invoice.payment_status);

		let effectDescription = '';
		let settlementDescription = '';

		if (creditNoteType === CREDIT_NOTE_TYPE.REFUND) {
			effectDescription = 'This credit note will process a refund for the paid amount.';
			settlementDescription = "The refunded amount will be credited to the customer's original payment method or wallet balance.";
		} else {
			effectDescription = 'This credit note will adjust the current invoice amount.';
			settlementDescription = 'The adjustment will be applied to the current billing period, reducing the amount due.';
		}

		return {
			type: creditNoteType,
			totalAmount: totalCreditAmount,
			effectDescription,
			settlementDescription,
		};
	};

	// Handle amount change
	const handleAmountChange = (itemId: string, value: string) => {
		const numericValue = parseFloat(value) || 0;
		setLineItems((prev) =>
			prev.map((item) => (item.id === itemId ? { ...item, amount: Math.min(Math.max(0, numericValue), item.max_amount) } : item)),
		);
	};

	// Handle form submission
	const handleSubmit = () => {
		if (!selectedReason || validLineItems.length === 0 || !invoice_id) {
			return;
		}

		const creditNoteLineItems: CreateCreditNoteLineItemRequest[] = validLineItems.map((item) => ({
			invoice_line_item_id: item.id,
			display_name: item.display_name,
			amount: item.amount,
		}));

		const params: CreateCreditNoteParams = {
			invoice_id: invoice_id,
			reason: selectedReason as CREDIT_NOTE_REASON,
			memo: memo || undefined,
			line_items: creditNoteLineItems,
			process_credit_note: true,
		};

		createCreditNoteMutation.mutate(params);
	};

	if (isLoading) {
		return (
			<div className='space-y-6'>
				<Skeleton className='h-32' />
				<Skeleton className='h-48' />
				<Skeleton className='h-32' />
			</div>
		);
	}

	const creditNotePreview = getCreditNotePreview();

	return (
		<Page>
			{/* Confirmation Dialog */}
			<Dialog isOpen={showConfirmModal} onOpenChange={setShowConfirmModal} title='Confirm Credit Note'>
				<div className='space-y-6 mt-6'>
					{/* Summary */}
					<div className='p-4 bg-gray-50 rounded-lg space-y-3'>
						<div className='flex justify-between items-center'>
							<span className='text-sm text-gray-600'>Credit Note Type</span>
							<Chip
								label={toSentenceCase(creditNotePreview.type)}
								variant={creditNotePreview.type === CREDIT_NOTE_TYPE.REFUND ? 'success' : 'info'}
							/>
						</div>
						<div className='flex justify-between items-center'>
							<span className='text-sm text-gray-600'>Total Amount</span>
							<span className='text-sm font-medium'>{formatCurrency(creditNotePreview.totalAmount, invoice?.currency || 'USD')}</span>
						</div>
					</div>
					<div className=' border border-blue-200 rounded-lg p-4'>
						<p className='text-sm text-blue-800'>{creditNotePreview.effectDescription}</p>
					</div>

					{/* Actions */}
					<div className='flex justify-end gap-3 pt-4'>
						<Button onClick={() => setShowConfirmModal(false)} variant='outline'>
							Cancel
						</Button>
						<Button
							onClick={() => {
								setShowConfirmModal(false);
								handleSubmit();
							}}
							disabled={createCreditNoteMutation.isPending}>
							{createCreditNoteMutation.isPending ? 'Creating...' : 'Create Credit Note'}
						</Button>
					</div>
				</div>
			</Dialog>

			{/* Page Content */}
			<div className='space-y-6'>
				{/* Header */}
				<div className='flex items-center gap-2'>
					<h1 className='text-xl font-medium'>Issue Credit Note</h1>
					<Chip
						label={toSentenceCase(creditNotePreview.type)}
						variant={creditNotePreview.type === CREDIT_NOTE_TYPE.REFUND ? 'success' : 'info'}
					/>
				</div>

				{/* Invoice Summary */}
				<div className='bg-white border rounded-lg p-6'>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						<div>
							<div className='text-sm font-medium'>{invoice?.invoice_number}</div>
							<div className='text-sm text-gray-500'>Invoice Number</div>
						</div>
						<div>
							<div className='text-sm font-medium'>{formatCurrency(invoice?.amount_paid || 0, invoice?.currency || 'USD')}</div>
							<div className='text-sm text-gray-500'>Amount Paid</div>
						</div>
						<div>
							<div className='text-sm font-medium'>{formatCurrency(Number(invoice?.amount_remaining), invoice?.currency || 'USD')}</div>
							<div className='text-sm text-gray-500'>Amount Remaining</div>
						</div>
					</div>
				</div>

				<div className='flex flex-col gap-4 bg-white border rounded-lg p-6'>
					{/* Reason */}
					<div className='flex flex-col gap-4'>
						<h3 className='text-sm font-semibold'>Reason for credit note</h3>
						<Select
							options={reasonOptions}
							value={selectedReason}
							onChange={(value) => setSelectedReason(value as CREDIT_NOTE_REASON)}
							placeholder='Select a reason'
							className='max-w-md'
						/>
					</div>

					{/* Memo */}
					<div className=''>
						{!showMemo && <AddActionButton onClick={() => setShowMemo(!showMemo)} label='Add Memo' />}
						{showMemo && (
							<Textarea
								label='Memo (optional)'
								value={memo}
								onChange={(value) => setMemo(value)}
								placeholder='This will appear on the credit note'
								rows={3}
								className='resize-none mt-4'
							/>
						)}
					</div>
				</div>

				{/* Form */}
				<div className='bg-white border rounded-lg divide-y'>
					{/* Line Items */}
					<div className='p-6'>
						<div className='flex justify-between items-center mb-4'>
							<h3 className='text-sm font-semibold'>Line items to credit</h3>
							<span className='text-sm text-gray-500'>Credit amount</span>
						</div>
						<div className='space-y-4'>
							{lineItems.map((item) => (
								<div key={item.id} className='flex items-center justify-between'>
									<div className='flex-1'>
										<div className='text-sm font-normal'>{item.display_name}</div>
										<div className='text-sm text-gray-500'>{formatCurrency(item.unit_price, invoice?.currency || 'USD')}</div>
									</div>
									<div className='ml-4'>
										<Input
											variant='formatted-number'
											value={item.amount.toString()}
											onChange={(value) => handleAmountChange(item.id, value)}
											min={0}
											inputPrefix={getCurrencySymbol(invoice?.currency || 'USD')}
											max={item.max_amount}
											step={0.01}
											className='max-w-40'
											placeholder='0.00'
										/>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Totals */}
					<div className='p-6'>
						<div className='flex justify-end'>
							<div className='w-80 space-y-2'>
								{/* Total amount to credit */}
								<div className='flex justify-between items-center py-1'>
									<span className='text-sm text-gray-600'>Total amount to credit</span>
									<span className='text-sm text-gray-900 font-medium'>{formatCurrency(totalCreditAmount, invoice?.currency || 'USD')}</span>
								</div>

								{/* Final total with different styling */}
								<div className='flex justify-between items-center py-3 border-t border-gray-200'>
									<span className='text-base font-medium text-gray-900'>
										{creditNotePreview.type === CREDIT_NOTE_TYPE.REFUND ? 'Amount to be refunded' : 'Amount to be adjusted'}
									</span>
									<span className='text-base font-semibold text-gray-900'>
										{formatCurrency(totalCreditAmount, invoice?.currency || 'USD')}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className='flex justify-end'>
					<Button
						isLoading={createCreditNoteMutation.isPending}
						onClick={() => setShowConfirmModal(true)}
						disabled={!selectedReason || validLineItems.length === 0 || createCreditNoteMutation.isPending}>
						Create Credit Note
					</Button>
				</div>
			</div>
		</Page>
	);
};

export default AddCreditNotePage;
