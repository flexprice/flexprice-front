import { Button, FormHeader } from '@/components/atoms';
import { LineItem, InvoiceType } from '@/models/Invoice';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { FC } from 'react';
import { RefreshCw } from 'lucide-react';
interface Props {
	data: LineItem[];
	currency?: string;
	amount_due?: number;
	title?: string;
	refetch?: () => void;
	invoiceType?: InvoiceType;
}

const formatToShortDate = (dateString: string): string => {
	const date = new Date(dateString);
	const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
	return date.toLocaleDateString('en-US', options);
};

const formatAmount = (amount: number, currency: string): string => {
	return `${getCurrencySymbol(currency)}${amount}`;
};

const formatPriceType = (value: string): string => {
	switch (value) {
		case 'FIXED':
			return 'Recurring';
		case 'USAGE':
			return 'Usage Based';
		default:
			return 'Unknown';
	}
};

const InvoiceLineItemTable: FC<Props> = ({ data, amount_due, currency, title, refetch, invoiceType }) => {
	return (
		<div>
			<div className='w-full  p-4'>
				<div className='flex justify-between items-center'>
					<FormHeader className='!mb-0' title={title} variant='sub-header' titleClassName='font-semibold' />
					{refetch && (
						<Button
							onClick={() => {
								const icon = document.querySelector('.refresh-icon');
								icon?.classList.add('animate-spin');
								refetch();
								icon?.classList.remove('animate-spin');
							}}
							variant='outline'
							size='sm'>
							<RefreshCw className='refresh-icon' />
						</Button>
					)}
				</div>

				<div className='overflow-x-auto'>
					<table className='table-auto w-full border-collapse text-left text-sm text-gray-800 my-4 px-4'>
						<thead className='border-b border-gray-200'>
							<tr>
								<th className='py-2 px-2 text-gray-600'>Subscription</th>
								{invoiceType === InvoiceType.SUBSCRIPTION && <th className='py-2 px-2 text-gray-600'>Description</th>}
								{invoiceType === InvoiceType.SUBSCRIPTION && <th className='py-2 px-2 text-center text-gray-600'>Interval</th>}
								<th className='py-2 px-2 text-gray-600 text-center'>Quantity</th>
								{/* <th className='py-2 px-2 text-gray-600 text-center'>Unit Price</th> */}
								<th className='py-2 px-2 text-gray-600 text-right'>Amount</th>
							</tr>
						</thead>
						<tbody>
							{data?.map((item, index) => {
								return (
									<tr key={index} className='border-b border-gray-200'>
										<td className='py-3 px-2 text-gray-800'>{item.display_name ?? '--'}</td>

										{invoiceType === InvoiceType.SUBSCRIPTION && (
											<td className='py-3 px-2 text-gray-800'>{formatPriceType(item.price_type)}</td>
										)}
										{invoiceType === InvoiceType.SUBSCRIPTION && (
											<td className='py-3 px-2 text-center text-gray-800'>{`${formatToShortDate(item.period_start)} - ${formatToShortDate(item.period_end)}`}</td>
										)}
										<td className='py-3 px-2 text-center text-gray-800'>{item.quantity ? item.quantity : '--'}</td>
										{/* <td className='py-3 px-2 text-center text-gray-800'>{}</td> */}
										<td className='py-3 px-2 text-right text-gray-800'>{formatAmount(item.amount ?? '--', item.currency)}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				<div className='flex justify-end '>
					<div className='text-sm text-gray-800 space-y-4 w-1/3  px-2'>
						<div className='flex justify-between  '>
							<span>Subtotal</span>
							<span>{`${getCurrencySymbol(currency ?? '')}${amount_due}`}</span>
						</div>
						<div className='flex justify-between  '>
							<span>Tax</span>
							<span>-</span>
						</div>
						<div className=' border-t  '></div>
						<div className='flex justify-between font-bold   '>
							<span>Total Amount</span>
							<span>{formatAmount(amount_due ?? 0, currency ?? '')}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default InvoiceLineItemTable;
