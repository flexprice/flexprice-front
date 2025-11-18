import { Button, FormHeader, Toggle } from '@/components/atoms';
import { LineItem, INVOICE_TYPE } from '@/models/Invoice';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { FC, useState } from 'react';
import { RefreshCw, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
	data: LineItem[];
	currency?: string;
	amount_due?: number;
	total?: number;
	subtotal?: number;
	total_tax?: number;
	discount?: number;
	amount_paid?: number;
	amount_remaining?: number;
	title?: string;
	refetch?: () => void;
	subtitle?: string;
	invoiceType?: INVOICE_TYPE;
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

const InvoiceLineItemTable: FC<Props> = ({
	data,
	amount_due,
	currency,
	title,
	refetch,
	invoiceType,
	subtitle,
	discount,
	total_tax,
	amount_paid,
	amount_remaining,
	subtotal,
}) => {
	const [showZeroCharges, setShowZeroCharges] = useState(false);
	const filteredData = data.filter((item) => showZeroCharges || Number(item.amount) !== 0);

	return (
		<div className='bg-white'>
			<div className='w-full p-6'>
				<div className='flex justify-between items-center mb-6'>
					<FormHeader
						variant='sub-header'
						className='!mb-0'
						titleClassName='font-semibold text-gray-900'
						subtitleClassName='text-sm text-gray-500 !mb-0 !mt-1'
						title={title}
						subtitle={subtitle}
					/>
					<div className='flex items-center gap-4'>
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
								<RefreshCw className='refresh-icon h-4 w-4' />
							</Button>
						)}
						<Toggle checked={showZeroCharges} onChange={() => setShowZeroCharges(!showZeroCharges)} label='Show Zero Charges' />
					</div>
				</div>

				{/* Line Items Table */}
				<div className='overflow-x-auto mb-8'>
					<table className='w-full border-collapse'>
						<thead>
							<tr className='border-b border-gray-200'>
								<th className='py-3 px-0 text-left text-sm font-medium text-gray-900'>Subscription</th>
								{invoiceType === INVOICE_TYPE.SUBSCRIPTION && (
									<th className='py-3 px-4 text-right text-sm font-medium text-gray-900'>Description</th>
								)}
								{invoiceType === INVOICE_TYPE.SUBSCRIPTION && (
									<th className='py-3 px-4 text-right text-sm font-medium text-gray-900'>Interval</th>
								)}
								<th className='py-3 px-4 text-right text-sm font-medium text-gray-900'>Quantity</th>
								<th className='py-3 px-0 text-right text-sm w-36 font-medium text-gray-900'>Amount</th>
							</tr>
						</thead>
						<tbody>
							{filteredData?.map((item, index) => {
								return (
									<tr key={index} className='border-b border-gray-100'>
										<td className='py-4 px-0 text-sm  text-gray-900'>{item.display_name ?? '--'}</td>
										{invoiceType === INVOICE_TYPE.SUBSCRIPTION && (
											<td className='py-4 px-4 text-sm text-gray-600 text-right'>{formatPriceType(item.price_type)}</td>
										)}
										{invoiceType === INVOICE_TYPE.SUBSCRIPTION && (
											<td className='py-4 px-4 text-sm text-gray-600 text-right'>{`${formatToShortDate(item.period_start)} - ${formatToShortDate(item.period_end)}`}</td>
										)}
										<td className='py-4 px-4 text-right text-sm text-gray-600'>{item.quantity ? item.quantity : '--'}</td>
										<td className='py-4 px-0 text-right w-36  text-sm text-gray-600'>{formatAmount(item.amount ?? 0, item.currency)}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				{/* Stripe-style Summary Section */}
				<div className='flex justify-end'>
					<div className='w-80 space-y-2'>
						{/* Subtotal - always show if exists */}
						{subtotal !== undefined && subtotal !== null && Number(subtotal) !== 0 && (
							<div className='flex flex-row justify-end items-center py-1'>
								<div className='w-40 text-right text-base font-medium text-gray-900'>Subtotal</div>
								<div className='flex-1 text-right text-sm text-gray-900 font-medium'>{formatAmount(Number(subtotal), currency ?? '')}</div>
							</div>
						)}

						{/* Discount - only show if provided and > 0 */}
						{discount !== undefined && discount !== null && Number(discount) > 0 && (
							<div className='flex flex-row justify-end items-center py-1'>
								<div className='w-40 text-right text-base font-medium text-gray-900'>Discount</div>
								<div className='flex-1 text-right text-sm text-gray-900 font-medium'>−{formatAmount(Number(discount), currency ?? '')}</div>
							</div>
						)}

						{total_tax !== undefined && total_tax !== null && Number(total_tax) !== 0 && (
							<div className='flex flex-row justify-end items-center py-1'>
								<div className='w-40 text-right text-base font-medium text-gray-900'>Tax</div>
								<div className='flex-1 text-right text-sm text-gray-900 font-medium'>{formatAmount(Number(total_tax), currency ?? '')}</div>
							</div>
						)}

						{/* Net payable - always show, default to 0 if not provided */}
						<div className='flex flex-row justify-end border-t border-gray-200 items-center py-3'>
							<div className='w-40 flex items-center gap-2 justify-end'>
								<span className='text-sm text-gray-900 font-medium'>Net payable</span>
								<TooltipProvider delayDuration={0}>
									<Tooltip>
										<TooltipTrigger>
											<Info className='h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors' />
										</TooltipTrigger>
										<TooltipContent sideOffset={5} className='bg-gray-900 text-xs text-white px-3 py-1.5 rounded-lg max-w-[200px]'>
											Final amount due after applying credit notes
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
							<div className='flex-1 text-right text-sm text-gray-900 font-semibold'>
								{formatAmount(Number(amount_due ?? 0), currency ?? '')}
							</div>
						</div>

						{/* Amount paid - always show, default to 0 if not provided */}
						<div className='flex flex-row justify-end items-center py-1'>
							<div className='w-40 text-right text-base font-medium text-gray-900'>Amount paid</div>
							<div className='flex-1 text-right text-sm text-gray-900 font-medium'>
								{formatAmount(Number(amount_paid ?? 0), currency ?? '')}
							</div>
						</div>

						{/* Remaining balance - show the final outstanding amount */}
						{((amount_remaining !== undefined && amount_remaining !== null && Number(amount_remaining) > 0) ||
							(amount_due !== undefined && amount_due !== null && Number(amount_due) > 0)) && (
							<div className='flex flex-row justify-end items-center py-3 border-t border-gray-200'>
								<div className='w-40 text-right text-base font-medium text-gray-900'>Remaining balance</div>
								<div className='flex-1 text-right text-base font-semibold text-gray-900'>
									{formatAmount(Number(amount_remaining ?? amount_due ?? 0), currency ?? '')}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default InvoiceLineItemTable;
