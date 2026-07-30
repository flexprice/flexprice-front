import { Button, FormHeader, Toggle } from '@/components/atoms';
import { LineItem, INVOICE_TYPE } from '@/models/Invoice';
import { formatBillingPeriod } from '@/utils/common/format_date';
import { getCurrencySymbol, getPriceTypeLabel } from '@/utils/common/helper_functions';
import { FC } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
interface Props {
	data: LineItem[];
	currency?: string;
	total?: number;
	subtotal?: number;
	tax?: number;
	discount?: number;
	amount_due?: number;
	title?: string;
	refetch?: () => void;
	subtitle?: string;
	invoiceType?: INVOICE_TYPE;
	/** When true, zero-amount line items are included (backend returns them). When false, backend hides them. */
	showZeroCharges?: boolean;
	onShowZeroChargesChange?: (show: boolean) => void;
}

const formatAmount = (amount: number, currency: string): string => {
	return `${getCurrencySymbol(currency)}${amount}`;
};

const SubscriptionPreviewLineItemTable: FC<Props> = ({
	data,
	currency,
	title,
	refetch,
	invoiceType,
	subtitle,
	tax,
	discount,
	amount_due,
	subtotal,
	showZeroCharges = false,
	onShowZeroChargesChange,
}) => {
	const { t } = useTranslation(['billing', 'common']);
	const displayData = data;
	const li = 'invoices.details.lineItemsTable';

	return (
		<div className='bg-white'>
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
				</div>
			</div>
			{onShowZeroChargesChange && (
				<div className='flex items-center gap-4 mb-4'>
					<Toggle
						checked={showZeroCharges ?? false}
						onChange={() => onShowZeroChargesChange(!showZeroCharges)}
						label={t('invoices.details.showZeroCharges')}
					/>
				</div>
			)}

			{/* Line Items Table */}
			<div className='overflow-x-auto mb-8'>
				<table className='w-full border-collapse'>
					<thead>
						<tr className='border-b border-gray-200'>
							<th className='py-3 px-0 text-start text-sm font-medium text-gray-900'>{t(`${li}.subscription`)}</th>
							{invoiceType === INVOICE_TYPE.SUBSCRIPTION && (
								<th className='py-3 px-4 text-start text-sm font-medium text-gray-900'>{t(`${li}.description`)}</th>
							)}
							{invoiceType === INVOICE_TYPE.SUBSCRIPTION && (
								<th className='py-3 px-4 text-start text-sm font-medium text-gray-900'>{t(`${li}.interval`)}</th>
							)}
							<th className='py-3 px-4 text-center text-sm font-medium text-gray-900'>{t(`${li}.quantity`)}</th>
							<th className='py-3 px-0 text-end text-sm font-medium text-gray-900'>{t(`${li}.amount`)}</th>
						</tr>
					</thead>
					<tbody>
						{displayData?.map((item, index) => {
							return (
								<tr key={index} className='border-b border-gray-100'>
									<td className='py-4 px-0 text-sm text-gray-900'>{item.display_name ?? t('common:labels.na')}</td>
									{invoiceType === INVOICE_TYPE.SUBSCRIPTION && (
										<td className='py-4 px-4 text-sm text-gray-600'>
											{item.price_type ? getPriceTypeLabel(item.price_type) : t('common:labels.na')}
										</td>
									)}
									{invoiceType === INVOICE_TYPE.SUBSCRIPTION && (
										<td className='py-4 px-4 text-sm text-gray-600'>
											{item.period_start && item.period_end
												? formatBillingPeriod(item.period_start, item.period_end)
												: t('common:labels.na')}
										</td>
									)}
									<td className='py-4 px-4 text-center text-sm text-gray-600'>{item.quantity ? item.quantity : t('common:labels.na')}</td>
									<td className='py-4 px-0 text-end text-sm text-gray-900 '>{formatAmount(item.amount ?? 0, item.currency)}</td>
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
							<div className='w-40 text-end text-base font-medium text-gray-900'>{t(`${li}.subtotal`)}</div>
							<div className='flex-1 text-end text-sm text-gray-900 font-medium'>{formatAmount(Number(subtotal), currency ?? '')}</div>
						</div>
					)}

					{/* Discount - only show if provided and > 0 */}
					{discount && Number(discount) > 0 && (
						<div className='flex flex-row justify-end items-center py-1'>
							<div className='w-40 text-end text-base font-medium text-gray-900'>{t(`${li}.discount`)}</div>
							<div className='flex-1 text-end text-sm text-gray-900 font-medium'>−{formatAmount(Number(discount), currency ?? '')}</div>
						</div>
					)}
					{/* Tax - only show if provided and > 0 */}
					{tax !== undefined && tax !== null && Number(tax) !== 0 && (
						<div className='flex flex-row justify-end items-center py-1'>
							<div className='w-40 text-end text-base font-medium text-gray-900'>{t(`${li}.tax`)}</div>
							<div className='flex-1 text-end text-sm text-gray-900 font-medium'>{formatAmount(Number(tax), currency ?? '')}</div>
						</div>
					)}

					{/* Net payable - always show, default to 0 if not provided */}
					<div className='flex flex-row justify-end border-t border-gray-200 items-center py-3'>
						<div className='w-40 flex items-center gap-2 justify-end text-sm text-gray-900 font-medium'>{t(`${li}.netPayable`)}</div>
						<div className='flex-1 text-end text-sm text-gray-900 font-semibold'>
							{formatAmount(Number(amount_due ?? 0), currency ?? '')}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SubscriptionPreviewLineItemTable;
