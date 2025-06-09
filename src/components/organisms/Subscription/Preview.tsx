import { ChargesForBillingPeriodOne } from './PriceTable';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatBillingPeriodForDisplay, getTotalPayableText } from '@/utils/common/helper_functions';
import { BILLING_PERIOD } from '@/constants/constants';
import { BILLING_CYCLE } from '@/models/Subscription';
import formatDate from '@/utils/common/format_date';
import { calculateAnniversaryBillingAnchor, calculateCalendarBillingAnchor } from '@/utils/helpers/subscription';
import { cn } from '@/lib/utils';
import { Calendar, Receipt } from 'lucide-react';

// daily billing period

//     - calendar : Bills immediately for 1 day
//     - anniversary:  on Jun 1 for 1 day

// weekly billing period

//     - calendar : Bills on june 11 for 1 week
//     - anniversary:  Bills immediately for 1 week

// monthly billing period

//     - calendar : Bills on Jun 1 for 1 month
//     - anniversary:  Bills immediately for 1 month

// quarterly billing period

//     - calendar : Bills on Jun 1 for 3 months
//     - anniversary:  Bills immediately for 3 months

// half yearly billing period

//     - calendar : Bills on Jun 1 for 6 months
//     - anniversary:  Bills immediately for 6 months

// yearly billing period

//     - calendar : Bills on Jun 1 for 1 year
//     - anniversary:  Bills immediately for 12 year

// Constants for billing period durations
const PERIOD_DURATION: Record<BILLING_PERIOD, string> = {
	[BILLING_PERIOD.DAILY]: '1 day',
	[BILLING_PERIOD.WEEKLY]: '1 week',
	[BILLING_PERIOD.MONTHLY]: '1 month',
	[BILLING_PERIOD.QUARTERLY]: '3 months',
	[BILLING_PERIOD.HALF_YEARLY]: '6 months',
	[BILLING_PERIOD.ANNUAL]: '1 year',
} as const;

interface PreviewProps {
	data: ChargesForBillingPeriodOne[];
	startDate?: Date;
	className?: string;
	billingCycle: BILLING_CYCLE;
	selectedPlan?: {
		charges: Record<string, Record<string, Array<ChargesForBillingPeriodOne & { invoice_cadence?: string }>>>;
		id: string;
		name: string;
	} | null;
}

/**
 * Determines if any charge has ADVANCE invoice cadence
 */
// TODO: This is a temporary function to check if any charge has ADVANCE invoice cadence
// TODO: This should be removed once the invoice cadence is implemented
const hasAdvanceCharge = (charges: ChargesForBillingPeriodOne[]): boolean => {
	return charges?.some((charge) => charge.invoice_cadence === 'ADVANCE') ?? false;
};

/**
 * Generates billing description based on charges and billing period
 */
const getBillingDescription = (charges: ChargesForBillingPeriodOne[], billingPeriod: BILLING_PERIOD, date: Date): string => {
	const period = PERIOD_DURATION[billingPeriod] || formatBillingPeriodForDisplay(billingPeriod).toLowerCase();
	return hasAdvanceCharge(charges) ? `Bills immediately for ${period}` : `Bills on ${formatDate(date)} for ${period}`;
};

/**
 * Calculates the first invoice date based on billing cycle and period
 */
const calculateFirstInvoiceDate = (startDate: Date, billingPeriod: BILLING_PERIOD, billingCycle: BILLING_CYCLE): Date => {
	return billingCycle === BILLING_CYCLE.CALENDAR
		? calculateCalendarBillingAnchor(startDate, billingPeriod)
		: calculateAnniversaryBillingAnchor(startDate, billingPeriod);
};

/**
 * Component that displays subscription preview information including start date and first invoice details
 */
const Preview = ({ data, startDate, className, billingCycle }: PreviewProps) => {
	const recurringCharges = useMemo(() => data.filter((charge) => charge.type === 'FIXED'), [data]);

	const usageCharges = useMemo(() => data.filter((charge) => charge.type === 'USAGE'), [data]);

	const recurringTotal = useMemo(() => recurringCharges.reduce((acc, charge) => acc + parseFloat(charge.amount), 0), [recurringCharges]);

	const firstInvoiceDate = useMemo(() => {
		const billingPeriod = data[0]?.billing_period.toUpperCase() as BILLING_PERIOD;
		return startDate ? calculateFirstInvoiceDate(startDate, billingPeriod, billingCycle) : undefined;
	}, [billingCycle, data, startDate]);

	const billingDescription = useMemo(() => {
		const billingPeriod = data[0]?.billing_period.toUpperCase() as BILLING_PERIOD;
		return firstInvoiceDate ? getBillingDescription(data, billingPeriod, firstInvoiceDate) : '';
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
										<p className='text-base font-medium text-gray-900'>{startDate ? formatDate(startDate) : ''}</p>
										<p className='text-sm text-gray-600'>Subscription starts</p>
									</div>
								</div>

								{/* First Invoice */}
								<div className='flex gap-3 items-start'>
									<Receipt className='h-[22px] w-[22px] text-gray-500 shrink-0' />
									<div className='space-y-1.5'>
										<p className='text-base font-medium text-gray-900'>{`First invoice: ${firstInvoiceDate ? formatDate(firstInvoiceDate) : ''}`}</p>
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
