import { Button, FormHeader, Toggle } from '@/components/atoms';
import { LineItem, INVOICE_TYPE, InvoiceTaxSummary } from '@/models/Invoice';
import { formatBillingPeriod } from '@/utils/common/format_date';
import { getCurrencySymbol, getPriceTypeLabel } from '@/utils/common/helper_functions';
import { FC } from 'react';
import { RefreshCw, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
interface Props {
	data: LineItem[];
	currency?: string;
	total?: number;
	subtotal?: number;
	tax?: number;
	tax_summary?: InvoiceTaxSummary;
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
	tax_summary,
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
		<div className='bg-transparent'>
			<div className='flex justify-between items-center mb-6'>
				<FormHeader
					variant='sub-header'
					className='!mb-0'
					titleClassName='font-semibold text-content'
					subtitleClassName='text-sm text-content-muted !mb-0 !mt-1'
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
						<tr className='border-b border-line'>
							<th className='py-3 px-0 text-start text-sm font-medium text-content'>{t(`${li}.subscription`)}</th>
							{invoiceType === INVOICE_TYPE.SUBSCRIPTION && (
								<th className='py-3 px-4 text-start text-sm font-medium text-content'>{t(`${li}.description`)}</th>
							)}
							{invoiceType === INVOICE_TYPE.SUBSCRIPTION && (
								<th className='py-3 px-4 text-start text-sm font-medium text-content'>{t(`${li}.interval`)}</th>
							)}
							<th className='py-3 px-4 text-center text-sm font-medium text-content'>{t(`${li}.quantity`)}</th>
							<th className='py-3 px-0 text-end text-sm font-medium text-content'>{t(`${li}.amount`)}</th>
						</tr>
					</thead>
					<tbody>
						{displayData?.map((item, index) => {
							return (
								<tr key={index} className='border-b border-line-subtle'>
									<td className='py-4 px-0 text-sm text-content'>{item.display_name ?? t('common:labels.na')}</td>
									{invoiceType === INVOICE_TYPE.SUBSCRIPTION && (
										<td className='py-4 px-4 text-sm text-content-tertiary'>
											{item.price_type ? getPriceTypeLabel(item.price_type) : t('common:labels.na')}
										</td>
									)}
									{invoiceType === INVOICE_TYPE.SUBSCRIPTION && (
										<td className='py-4 px-4 text-sm text-content-tertiary'>
											{item.period_start && item.period_end
												? formatBillingPeriod(item.period_start, item.period_end)
												: t('common:labels.na')}
										</td>
									)}
									<td className='py-4 px-4 text-center text-sm text-content-tertiary'>
										{item.quantity ? item.quantity : t('common:labels.na')}
									</td>
									<td className='py-4 px-0 text-end text-sm text-content '>{formatAmount(item.amount ?? 0, item.currency)}</td>
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
							<div className='w-40 text-end text-base font-medium text-content'>{t(`${li}.subtotal`)}</div>
							<div className='flex-1 text-end text-sm text-content font-medium'>{formatAmount(Number(subtotal), currency ?? '')}</div>
						</div>
					)}

					{/* Discount - only show if provided and > 0 */}
					{discount && Number(discount) > 0 && (
						<div className='flex flex-row justify-end items-center py-1'>
							<div className='w-40 text-end text-base font-medium text-content'>{t(`${li}.discount`)}</div>
							<div className='flex-1 text-end text-sm text-content font-medium'>−{formatAmount(Number(discount), currency ?? '')}</div>
						</div>
					)}
					{/* Tax - only show if provided and > 0, or the customer is exempt */}
					{(Number(tax ?? 0) !== 0 || tax_summary?.exemption) && (
						<div className='flex flex-row justify-end items-center py-1'>
							<div className='w-40 flex items-center justify-end gap-1.5 text-base font-medium text-content'>
								<span>{t(`${li}.tax`)}</span>
								{tax_summary && (
									<TooltipProvider delayDuration={0}>
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type='button'
													aria-label={t('invoices.details.lineItemsTable.taxBreakdownAria')}
													className='inline-flex items-center'>
													<Info className='h-3.5 w-3.5 text-content-subtle hover:text-content-tertiary transition-colors cursor-help' />
												</button>
											</TooltipTrigger>
											<TooltipContent
												sideOffset={5}
												className='bg-surface-inverse text-xs text-content-inverse px-2.5 py-1.5 rounded-[6px] max-w-[280px]'>
												{tax_summary.exemption ? (
													tax_summary.exemption.reason
												) : (
													<div className='space-y-1'>
														<div className='flex justify-between gap-6'>
															<span>{t(`${li}.taxInclusiveTotal`)}</span>
															<span>{formatAmount(Number(tax_summary.inclusive_tax), currency ?? '')}</span>
														</div>
														<div className='flex justify-between gap-6'>
															<span>{t(`${li}.taxExclusiveTotal`)}</span>
															<span>{formatAmount(Number(tax_summary.exclusive_tax), currency ?? '')}</span>
														</div>
														<div className='flex justify-between gap-6 pt-1 border-t border-white/20 font-medium'>
															<span>{t(`${li}.taxTotal`)}</span>
															<span>{formatAmount(Number(tax_summary.total_tax), currency ?? '')}</span>
														</div>
													</div>
												)}
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								)}
							</div>
							<div className='flex-1 text-end text-sm text-content font-medium'>{formatAmount(Number(tax ?? 0), currency ?? '')}</div>
						</div>
					)}

					{/* Net payable - always show, default to 0 if not provided */}
					<div className='flex flex-row justify-end border-t border-line items-center py-3'>
						<div className='w-40 flex items-center gap-2 justify-end text-sm text-content font-medium'>{t(`${li}.netPayable`)}</div>
						<div className='flex-1 text-end text-sm text-content font-semibold'>
							{formatAmount(Number(amount_due ?? 0), currency ?? '')}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SubscriptionPreviewLineItemTable;
