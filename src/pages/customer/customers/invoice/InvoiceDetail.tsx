import { FormHeader, Spacer, Button, Divider, Loader } from '@/components/atoms';
import { InvoiceTableMenu, InvoicePaymentStatusModal, InvoiceStatusModal, InvoiceLineItemTable } from '@/components/molecules';
import useUser from '@/hooks/useUser';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import InvoiceApi from '@/api/InvoiceApi';
import formatDate from '@/utils/common/format_date';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { FC, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { RouteNames } from '@/core/routes/Routes';
import { cn } from '@/lib/utils';
import { getPaymentStatusChip } from '@/components/molecules/InvoiceTable/InvoiceTable';
import { InvoiceType } from '@/models/Invoice';
interface Props {
	invoice_id: string;
	breadcrumb_index: number;
}

const InvoiceDetails: FC<Props> = ({ invoice_id, breadcrumb_index }) => {
	// const { invoice_id } = useParams<{ invoice_id: string }>();
	const [state, setState] = useState({
		isPaymentModalOpen: false,
		isStatusModalOpen: false,
	});
	const { updateBreadcrumb } = useBreadcrumbsStore();
	const { data, isLoading, isError } = useQuery({
		queryKey: ['fetchInvoice', invoice_id],
		queryFn: async () => {
			return await InvoiceApi.getInvoiceById(invoice_id!);
		},
		enabled: !!invoice_id,
	});

	const { user } = useUser();

	useEffect(() => {
		updateBreadcrumb(breadcrumb_index, data?.invoice_number ?? invoice_id);
	}, [invoice_id, data?.invoice_number, breadcrumb_index, updateBreadcrumb]);

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

	const handleDownlaod = () => {
		InvoiceApi.getInvoicePdf(invoice_id);
	};

	if (isLoading) return <Loader />;

	if (isError) {
		toast.error('Something went wrong');
	}

	const invoiceType = data?.invoice_type as InvoiceType;

	return (
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
			<div ref={invoiceref} className=' rounded-xl border border-gray-300 p-6'>
				<div className='p-4'>
					<div className='w-full flex justify-between items-center'>
						<FormHeader
							title={<span className='flex items-center gap-2'>Invoice Details</span>}
							variant='sub-header'
							titleClassName='font-semibold'
						/>
						<div className='flex gap-4 items-center'>
							<Button data-html2canvas-ignore='true' onClick={handleDownlaod}>
								<Download />
								<span>Download</span>
							</Button>
							<InvoiceTableMenu data={data!} />
						</div>
					</div>
					<Spacer className='!my-6' />
					<div className='w-full grid grid-cols-4 gap-4'>
						<p className='text-[#71717A] text-sm'>Invoice Number</p>
						<p className='text-[#71717A] text-sm'>Date of Issue</p>
						<p className='text-[#71717A] text-sm'>Date Due</p>
						<p className='text-[#71717A] text-sm'>Payment Status</p>
					</div>
					<div className='w-full grid grid-cols-4 gap-4'>
						<p className='text-[#09090B] text-sm'>{data?.invoice_number}</p>
						<p className='text-[#09090B] text-sm'>{formatDate(data?.created_at ?? '')}</p>
						<p className='text-[#09090B] text-sm'>{data?.due_date ? formatDate(data?.due_date ?? '') : '--'}</p>
						<p className='text-[#09090B] text-sm'>{getPaymentStatusChip(data?.payment_status ?? '')}</p>
					</div>
				</div>
				<div className='my-3 mx-3'>
					<Divider />
				</div>

				<div className='grid grid-cols-2  p-4 border-b border-gray-200'>
					<div className='text-left'>
						<FormHeader className='!mb-2' title={user?.tenant.name} variant='sub-header' titleClassName='font-semibold' />
						<p className={customerInfoClass}>{user?.tenant.name}</p>
						<p className={customerInfoClass}>{user?.email}</p>
						<p className={customerInfoClass}>{tenantAddress || '--'}</p>
					</div>

					<div>
						<FormHeader className='!mb-2' title='Bill to' variant='sub-header' titleClassName='font-semibold' />
						<Link to={`${RouteNames.customers}/${data?.customer?.id}`} className={cn(customerInfoClass, 'hover:underline')}>
							{data?.customer?.name || '--'}
						</Link>
						<p className={customerInfoClass}>{data?.customer?.email || '--'}</p>
						<p className={customerInfoClass}>{customerAddress || '--'}</p>
					</div>
				</div>
				<InvoiceLineItemTable
					title='Order Details'
					data={data?.line_items ?? []}
					amount_due={data?.amount_due}
					currency={data?.currency}
					invoiceType={invoiceType as InvoiceType}
				/>
			</div>
		</div>
	);
};
export default InvoiceDetails;
