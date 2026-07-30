import { Card } from '@/components/atoms';
import { Invoice, INVOICE_STATUS } from '@/models/Invoice';
import { PAYMENT_STATUS } from '@/constants/payment';
import { formatAmount } from '@/components/atoms/Input/Input';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';

interface BillingOverviewCardProps {
	invoices: Invoice[];
	currency?: string;
}

const BillingOverviewCard = ({ invoices, currency = 'USD' }: BillingOverviewCardProps) => {
	const { t } = useTranslation('customer-portal');
	// Calculate totals
	const totalInvoiced = invoices
		.filter((inv) => inv.invoice_status === INVOICE_STATUS.FINALIZED)
		.reduce((sum, inv) => sum + (inv.total || 0), 0);

	const totalOverdue = invoices
		.filter(
			(inv) =>
				inv.invoice_status === INVOICE_STATUS.FINALIZED &&
				inv.payment_status !== PAYMENT_STATUS.SUCCEEDED &&
				new Date(inv.due_date) < new Date(),
		)
		.reduce((sum, inv) => sum + (inv.amount_remaining || 0), 0);

	const currencySymbol = getCurrencySymbol(currency);

	return (
		<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
			<h3 className='text-base font-medium text-zinc-950 mb-6'>{t('billingOverview.title')}</h3>
			<div className='grid grid-cols-2 gap-6'>
				{/* Total Invoiced */}
				<div>
					<div className='flex items-center gap-1.5 mb-2'>
						<span className='text-sm text-zinc-500'>{t('billingOverview.totalInvoiced')}</span>
					</div>
					<p className='text-2xl font-semibold text-zinc-950'>
						{currencySymbol}
						{formatAmount(String(totalInvoiced))}
					</p>
				</div>

				{/* Total Overdue */}
				<div>
					<div className='flex items-center gap-1.5 mb-2'>
						<span className='text-sm text-zinc-500'>{t('billingOverview.totalOverdue')}</span>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>
									<Info className='h-3.5 w-3.5 text-zinc-400' />
								</TooltipTrigger>
								<TooltipContent>
									<p>{t('billingOverview.overdueTooltip')}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
					<p className={`text-2xl font-semibold ${totalOverdue > 0 ? 'text-red-600' : 'text-zinc-950'}`}>
						{currencySymbol}
						{formatAmount(String(totalOverdue))}
					</p>
				</div>
			</div>
		</Card>
	);
};

export default BillingOverviewCard;
