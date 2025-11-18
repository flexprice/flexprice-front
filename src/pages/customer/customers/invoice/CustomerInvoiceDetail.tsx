import { FormHeader, Spacer, Button, Divider, Loader, Card, CardHeader } from '@/components/atoms';
import {
	InvoiceTableMenu,
	InvoicePaymentStatusModal,
	InvoiceStatusModal,
	InvoiceLineItemTable,
	AppliedTaxesTable,
} from '@/components/molecules';
import useUser from '@/hooks/useUser';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import InvoiceApi from '@/api/InvoiceApi';
import formatDate from '@/utils/common/format_date';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { FC, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { RouteNames } from '@/core/routes/Routes';
import { cn } from '@/lib/utils';
import { getPaymentStatusChip } from '@/components/molecules/InvoiceTable/InvoiceTable';
import { INVOICE_TYPE } from '@/models/Invoice';
import { getTypographyClass } from '@/lib/typography';
import RedirectCell from '@/components/molecules/Table/RedirectCell';
interface Props {
	invoice_id: string;
	breadcrumb_index: number;
}

const CustomerInvoiceDetail: FC<Props> = ({ invoice_id, breadcrumb_index }) => {
	// const { invoice_id } = useParams<{ invoice_id: string }>();
	const [state, setState] = useState({
		isPaymentModalOpen: false,
		isStatusModalOpen: false,
	});
	const [metadata, setMetadata] = useState<Record<string, string>>({});
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

	// Process metadata from invoice data
	useEffect(() => {
		if (data && 'metadata' in data && data.metadata) {
			const invoiceMetadata = data.metadata as Record<string, unknown>;
			// Filter to only string values for display
			const filteredMetadata = Object.entries(invoiceMetadata)
				.filter(([_, value]) => typeof value === 'string')
				.reduce((acc, [key, value]) => ({ ...acc, [key]: value as string }), {});
			setMetadata(filteredMetadata);
		}
	}, [data]);

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
		InvoiceApi.downloadInvoicePdf(invoice_id);
	};

	if (isLoading) return <Loader />;

	if (isError) {
		toast.error('Something went wrong');
	}

	const invoiceType = data?.invoice_type as INVOICE_TYPE;

	return (
		<div className='space-y-6'>
			{/* invoice details */}
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
							<p className={cn(getTypographyClass('section-title'), 'text-xl mb-0')}>Invoice Details</p>
							<div className='flex gap-4 items-center'>
								<Button data-html2canvas-ignore='true' onClick={handleDownlaod}>
									<Download />
									<span>Download</span>
								</Button>
								<InvoiceTableMenu data={data!} />
							</div>
						</div>
						<Spacer className='!my-10' />
						<div className='w-full grid grid-cols-4 gap-4 text-[#09090B] text-sm font-medium'>
							<p>Invoice Number</p>
							<p>Date of Issue</p>
							<p>Date Due</p>
							<p>Payment Status</p>
						</div>
						<div className='w-full grid grid-cols-4 gap-4 text-[#71717A] text-sm'>
							<p>{data?.invoice_number}</p>
							<p>{formatDate(data?.created_at ?? '')}</p>
							<p>{data?.due_date ? formatDate(data?.due_date ?? '') : '--'}</p>
							<p>{getPaymentStatusChip(data?.payment_status ?? '')}</p>
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
							<RedirectCell redirectUrl={`${RouteNames.customers}/${data?.customer?.id}`}>
								<p className={customerInfoClass}>{data?.customer?.name || '--'}</p>
							</RedirectCell>
							<p className={customerInfoClass}>{data?.customer?.email || '--'}</p>
							<p className={customerInfoClass}>{customerAddress || '--'}</p>
						</div>
					</div>
					<InvoiceLineItemTable
						title='Order Details'
						subtotal={data?.subtotal}
						total={data?.total}
						discount={data?.total_discount}
						total_tax={data?.total_tax}
						amount_paid={data?.amount_paid}
						amount_remaining={Number(data?.amount_remaining)}
						data={data?.line_items ?? []}
						amount_due={data?.amount_due}
						currency={data?.currency}
						invoiceType={invoiceType as INVOICE_TYPE}
					/>
				</div>
			</div>

			{/* applied taxes if exists */}
			{data?.taxes?.length && data?.taxes?.length > 0 && (
				<Card>
					<CardHeader title='Applied Taxes' />
					<div className='p-4'>
						<AppliedTaxesTable data={data.taxes} />
					</div>
				</Card>
			)}

			{/* metadata section - only show if metadata exists */}
			{metadata && Object.keys(metadata).length > 0 && (
				<Card>
					<CardHeader title='Metadata' />
					<div className='p-4'>
						<table className='w-full table-fixed'>
							<thead>
								<tr className='border-b border-gray-200'>
									<th className='text-left py-3 px-4 text-sm font-large text-[#09090B] w-1/3'>Key</th>
									<th className='text-left py-3 px-4 text-sm font-large text-[#09090B] w-2/3'>Value</th>
								</tr>
							</thead>
							<tbody>
								{Object.entries(metadata).map(([key, value], index) => (
									<tr key={index} className='border-b border-gray-100 last:border-b-0'>
										<td className='py-3 px-4 text-sm font-medium text-[#09090B] break-words align-top' title={key}>
											{key}
										</td>
										<td className='py-3 px-4 text-sm text-[#71717A] break-words align-top' title={value}>
											{value || '--'}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card>
			)}
		</div>
	);
};
export default CustomerInvoiceDetail;
