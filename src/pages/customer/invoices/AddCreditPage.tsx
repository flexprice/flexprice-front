import { Button, Chip, DatePicker, Dialog, FormHeader, Page, Select, SelectOption, Spacer } from '@/components/atoms';
import { InvoiceCreditLineItemTable } from '@/components/molecules';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import InvoiceApi from '@/api/InvoiceApi';
import formatDate from '@/utils/common/format_date';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const getStatusChip = (status: string) => {
	switch (status.toUpperCase()) {
		case 'VOIDED':
			return <Chip variant='default' label='Void' />;
		case 'FINALIZED':
			return <Chip variant='success' label='Paid' />;
		case 'DRAFT':
			return <Chip variant='default' label='Draft' />;
		default:
			return <Chip variant='default' label='Draft' />;
	}
};

const AddCreditPage = () => {
	const { invoice_id } = useParams<{ invoice_id: string }>();
	const { updateBreadcrumb, setSegmentLoading } = useBreadcrumbsStore();

	const { data, isLoading } = useQuery({
		queryKey: ['fetchInvoice', invoice_id],
		queryFn: async () => await InvoiceApi.getInvoiceById(invoice_id!),
		enabled: !!invoice_id,
	});

	const [showModal, setshowModal] = useState(false);

	// Update breadcrumbs when invoice data is loaded
	useEffect(() => {
		// Set loading states when starting to fetch
		setSegmentLoading(2, true); // Customer segment
		setSegmentLoading(3, true); // Invoice segment

		if (data) {
			// Update customer name (3rd segment)
			updateBreadcrumb(2, data.customer?.external_id || 'Customer');

			// Update invoice number (4th segment)
			updateBreadcrumb(3, `Invoice ${data.invoice_number}`);
		}
	}, [data, updateBreadcrumb, setSegmentLoading]);

	const reasonOptions: SelectOption[] = [
		{ label: 'Duplicate Charge', value: 'wrong_invoice' },
		{ label: 'Product Unsatisfactory', value: '2' },
		{ label: 'Order Change', value: '3' },
		{ label: 'Fraudulent Charge', value: '4' },
		{ label: 'Other', value: '5' },
	];

	const [payload, setPayload] = useState<{ reason?: string; description?: string; issueDate?: Date }>({});

	if (isLoading) {
		return (
			<div>
				<Skeleton className='h-48 mb-4' />
				<Skeleton className='h-48 mb-4' />
				<Skeleton className='h-48 mb-4' />
			</div>
		);
	}

	return (
		<Page>
			{/* confirmation dialog */}
			<Dialog
				isOpen={showModal}
				onOpenChange={(open) => setshowModal(open)}
				title={'Are you sure?'}
				description={`${getCurrencySymbol(data?.currency || '')}${data?.amount_paid} will be credited to ${data?.customer?.name} wallet. Do you want to proceed?`}>
				<div className='w-full flex justify-end gap-4'>
					<Button
						onClick={() => {
							setshowModal(false);
						}}
						variant={'outline'}
						className='btn btn-primary'>
						Cancel
					</Button>
					<Button
						onClick={() => {
							setshowModal(false);
						}}
						className='btn btn-primary'>
						Continue
					</Button>
				</div>
			</Dialog>

			{/* Page Header */}
			<div>
				<FormHeader title='Credit Notes' variant='form-title' />
				<p className='text-[#64748B] text-sm font-normal'>{data?.invoice_number}</p>
			</div>

			<Spacer className='!my-4' />

			{/* Selectors */}
			<div className='w-full flex items-center gap-6'>
				<div className='min-w-[65%]'>
					<Select label='Reason' options={reasonOptions} value={payload?.reason} onChange={(e) => setPayload({ ...payload, reason: e })} />
				</div>
				<div className='flex-grow w-full'>
					<DatePicker label='Issue Date' date={payload?.issueDate} setDate={(e) => setPayload({ ...payload, issueDate: e })} />
				</div>
			</div>

			<Spacer className='!my-10' />
			<div>
				<FormHeader title='Invoice Details' variant='form-component-title' />
				<div className='w-full grid grid-cols-2 gap-x-9 gap-y-2'>
					<div className='w-full grid grid-cols-2'>
						<div className='text-sm font-light text-gray-600'>Name</div>
						<div className='text-sm font-normal text-gray-800'>{data?.customer?.name || '--'}</div>
					</div>
					<div className='w-full grid grid-cols-2'>
						<div className='text-sm font-light text-gray-600'>Invoice Status</div>
						<div className='text-sm font-normal text-gray-800'>{data?.invoice_status ? getStatusChip(data.invoice_status) : '--'}</div>
					</div>
					{/* <div className='w-full grid grid-cols-2'>
						<div className='text-sm font-light text-gray-600'>Credits Available</div>
						<div className='text-sm font-normal text-gray-800'>{'--'}</div>
					</div> */}
					<div className='w-full grid grid-cols-2'>
						<div className='text-sm font-light text-gray-600'>Invoice Number</div>
						<div className='text-sm font-normal text-gray-800'>{data?.invoice_number || '--'}</div>
					</div>

					<div className='w-full grid grid-cols-2'>
						<div className='text-sm font-light text-gray-600'>Issue Date</div>
						<div className='text-sm font-normal text-gray-800'>{formatDate(data?.created_at || '')}</div>
					</div>
				</div>
			</div>
			<Spacer className='!my-10' />
			{/* Invoice Table */}
			<InvoiceCreditLineItemTable
				title='Items to Credit'
				currency={data?.currency}
				total_amount={data?.amount_due}
				data={data?.line_items || []}
				sub_total={data?.amount_paid}
			/>

			<Button className='mt-8' onClick={() => setshowModal(true)}>
				Issue Credit Note
			</Button>
		</Page>
	);
};

export default AddCreditPage;
