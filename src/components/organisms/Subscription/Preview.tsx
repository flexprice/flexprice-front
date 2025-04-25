import { ChargesForBillingPeriodOne } from './PriceTable';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatBillingPeriodForDisplay, getTotalPayableText } from '@/utils/common/helper_functions';
import { BILLING_PERIOD } from '@/core/data/constants';
import { BILLING_CYCLE } from '@/models/Subscription';
import formatDate from '@/utils/common/format_date';
import { calculateAnniversaryBillingAnchor, calculateCalendarBillingAnchor } from '@/utils/helpers/subscription';
import { cn } from '@/lib/utils';
import { Calendar, Receipt } from 'lucide-react';

interface PreviewProps {
	data: ChargesForBillingPeriodOne[];
	startDate: Date;
	className?: string;
	billingCycle: BILLING_CYCLE;
	selectedPlan?: {
		charges: Record<string, Record<string, Array<ChargesForBillingPeriodOne & { invoice_cadence?: string }>>>;
		id: string;
		name: string;
	} | null;
}

const PERIOD_DURATION = {
	[BILLING_PERIOD.DAILY]: '1 day',
	[BILLING_PERIOD.WEEKLY]: '1 week',
	[BILLING_PERIOD.MONTHLY]: '1 month',
	[BILLING_PERIOD.QUARTERLY]: '3 months',
	[BILLING_PERIOD.HALF_YEARLY]: '6 months',
	[BILLING_PERIOD.ANNUAL]: '12 months',
} as const;

const getBillingDescription = (charges: ChargesForBillingPeriodOne[], billingPeriod: BILLING_PERIOD, date: Date) => {
	// Check if any fixed charge has ADVANCE invoice_cadence
	const hasAdvanceCharge = charges ? charges.some((charge) => charge.type === 'FIXED' && charge.invoice_cadence === 'ADVANCE') : false;

	console.log(hasAdvanceCharge, charges);
	const period = PERIOD_DURATION[billingPeriod] || formatBillingPeriodForDisplay(billingPeriod).toLowerCase();

	if (hasAdvanceCharge) {
		return `Bills immediately for ${period}`;
	}

	return `Bills on ${formatDate(date)} for ${period}`;
};

const Preview = ({ data, startDate, className, billingCycle, selectedPlan }: PreviewProps) => {
	const recurringCharges = useMemo(() => data.filter((charge) => charge.type === 'FIXED'), [data]);
	const usageCharges = useMemo(() => data.filter((charge) => charge.type === 'USAGE'), [data]);
	const recurringTotal = useMemo(() => recurringCharges.reduce((acc, charge) => acc + parseFloat(charge.amount), 0), [recurringCharges]);

	const firstInvoiceDate = useMemo(() => {
		const period = data[0]?.billing_period.toUpperCase() as BILLING_PERIOD;
		return billingCycle === BILLING_CYCLE.CALENDAR
			? calculateCalendarBillingAnchor(startDate, period)
			: calculateAnniversaryBillingAnchor(startDate, period);
	}, [billingCycle, data, startDate]);

	const billingDescription = useMemo(() => {
		return getBillingDescription(data, data[0]?.billing_period.toUpperCase() as BILLING_PERIOD, firstInvoiceDate);
	}, [data, firstInvoiceDate]);

	return (
		<div className={cn('w-full', className)}>
			<Card className='bg-white border border-gray-200'>
				<CardContent className='p-5'>
					<div className='space-y-6'>
						{/* Timeline container */}
						<div className='relative'>
							{/* Connecting line */}
							<div className='absolute left-[11px] top-[28px] h-[50px] border-l-2 border-dashed border-gray-200'></div>

							<div className='space-y-8'>
								{/* Subscription Start */}
								<div className='flex gap-3 items-start'>
									<Calendar className='h-[22px] w-[22px] text-gray-500 shrink-0' />
									<div className='space-y-1.5'>
										<p className='text-base font-medium text-gray-900'>{formatDate(startDate)}</p>
										<p className='text-sm text-gray-600'>Subscription starts</p>
									</div>
								</div>

								{/* First Invoice */}
								<div className='flex gap-3 items-start'>
									<Receipt className='h-[22px] w-[22px] text-gray-500 shrink-0' />
									<div className='space-y-1.5'>
										<p className='text-base font-medium text-gray-900'>{`First invoice: ${formatDate(firstInvoiceDate)}`}</p>
										<div>
											<p className='text-sm text-gray-600'>
												Amount due: {getTotalPayableText(recurringCharges, usageCharges, recurringTotal)}
											</p>
											<p className='text-sm text-gray-600'>{billingDescription}</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default Preview;
