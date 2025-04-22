import { getActualPriceForTotal, getPriceTableCharge } from '@/utils/models/transformed_plan';
import { ChargesForBillingPeriodOne } from './PriceTable';
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDownIcon, ChevronUpIcon, Info } from 'lucide-react';
import { getTotalPayableInfo, getTotalPayableText } from '@/utils/common/helper_functions';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { BILLING_PERIOD } from '@/core/data/constants';
import { BILLING_CYCLE } from '@/models/Subscription';
import formatDate from '@/utils/common/format_date';
import { calculateCalendarBillingAnchor } from '@/utils/helpers/subscription';

interface PreviewProps {
	data: ChargesForBillingPeriodOne[];
	startDate: Date;
	className?: string;
	billingCycle: BILLING_CYCLE;
}

const MAX_ROWS_TO_SHOW = 5;

const useChargeDisplay = (charges: ChargesForBillingPeriodOne[]) => {
	const [showAllRows, setShowAllRows] = useState(false);

	const displayedCharges = useMemo(() => (showAllRows ? charges : charges.slice(0, MAX_ROWS_TO_SHOW)), [charges, showAllRows]);

	return {
		displayedCharges,
		showAllRows,
		toggleShowAllRows: () => setShowAllRows((prev) => !prev),
		hasMoreRows: charges.length > MAX_ROWS_TO_SHOW,
	};
};

const formatNextBillingDate = (startDate: Date, billingPeriod: BILLING_PERIOD, billingCycle: BILLING_CYCLE): string => {
	const day = startDate.getDate();
	const weekday = startDate.toLocaleDateString('en-US', { weekday: 'long' });
	const month = startDate.toLocaleString('default', { month: 'short' });
	const ordinalDay = `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}`;
	const nextBillingDate = calculateCalendarBillingAnchor(startDate, billingPeriod);
	const formattedNextBillingDate = formatDate(nextBillingDate);

	const calendarBillingMessages: Record<BILLING_PERIOD, string> = {
		[BILLING_PERIOD.DAILY]: 'every day starting ' + formattedNextBillingDate,
		[BILLING_PERIOD.WEEKLY]: 'every week on monday starting ' + formattedNextBillingDate,
		[BILLING_PERIOD.MONTHLY]: 'on the 1st of every month starting ' + formattedNextBillingDate,
		[BILLING_PERIOD.QUARTERLY]: 'on the 1st of January, April, July, and October starting ' + formattedNextBillingDate,
		[BILLING_PERIOD.HALF_YEARLY]: 'on the 1st of January and July starting ' + formattedNextBillingDate,
		[BILLING_PERIOD.ANNUAL]: 'on the 1st of January every year starting ' + formattedNextBillingDate,
	};

	const anniversaryBillingMessages: Record<BILLING_PERIOD, string> = {
		[BILLING_PERIOD.DAILY]: `every day`,
		[BILLING_PERIOD.WEEKLY]: `every ${weekday}`,
		[BILLING_PERIOD.MONTHLY]: `on the ${ordinalDay} of every month`,
		[BILLING_PERIOD.QUARTERLY]: `every 3 months on the ${ordinalDay} (January, April, July, October)`,
		[BILLING_PERIOD.HALF_YEARLY]: `every 6 months on the ${ordinalDay} (January, July)`,
		[BILLING_PERIOD.ANNUAL]: `every year on ${month} ${day}`,
	};

	return billingCycle === BILLING_CYCLE.CALENDAR ? calendarBillingMessages[billingPeriod] : anniversaryBillingMessages[billingPeriod];
};

const Preview = ({ data, className, startDate, billingCycle }: PreviewProps) => {
	// Separate charges into recurring and usage
	const recurringCharges = useMemo(() => data.filter((charge) => charge.type === 'FIXED'), [data]);

	const usageCharges = useMemo(() => data.filter((charge) => charge.type === 'USAGE'), [data]);

	// Calculate totals for both types
	const recurringTotal = useMemo(
		() => recurringCharges.reduce((acc, charge) => acc + getActualPriceForTotal(charge), 0),
		[recurringCharges],
	);

	const {
		displayedCharges: displayedRecurring,
		showAllRows: showAllRecurringRows,
		toggleShowAllRows: toggleRecurringRows,
		hasMoreRows: hasMoreRecurringRows,
	} = useChargeDisplay(recurringCharges);

	const {
		displayedCharges: displayedUsage,
		showAllRows: showAllUsageRows,
		toggleShowAllRows: toggleUsageRows,
		hasMoreRows: hasMoreUsageRows,
	} = useChargeDisplay(usageCharges);

	const displayMessage = () => {
		if (recurringCharges.length === 0 && usageCharges.length === 0) {
			return 'No charges for this subscription';
		}

		const billingPeriod = data[0].billing_period.toUpperCase() as BILLING_PERIOD;
		const nextDateString = formatNextBillingDate(startDate, billingPeriod, billingCycle);
		const totalPayableInfo = getTotalPayableInfo(recurringCharges, usageCharges, recurringTotal);

		return `The customer will be charged ${totalPayableInfo} ${nextDateString}`;
	};

	const renderChargeSection = (
		title: string,
		charges: ChargesForBillingPeriodOne[],
		displayedCharges: ChargesForBillingPeriodOne[],
		showAllRows: boolean,
		toggleRows: () => void,
		hasMoreRows: boolean,
	) =>
		charges.length > 0 && (
			<div>
				<p className='text-sm text-black font-semibold mb-3'>{title}</p>
				<div className='space-y-2 border-b border-gray-300 pb-2'>
					<motion.div
						initial={{ height: 'auto' }}
						animate={{ height: 'auto' }}
						transition={{ duration: 0.3, ease: 'easeInOut' }}
						style={{ overflow: 'hidden' }}>
						{displayedCharges.map((charge, index) => (
							<div key={`${title.toLowerCase()}-${index}`} className='flex justify-between items-center py-2'>
								<span className='text-gray-700 font-normal text-sm'>
									{charge.meter_name ? `${charge.name}/${charge.meter_name}` : charge.name}
								</span>
								<span className='text-gray-700 font-normal text-sm'>{getPriceTableCharge(charge)}</span>
							</div>
						))}
					</motion.div>

					{hasMoreRows && (
						<div className='flex justify-center mt-4'>
							<span className='flex items-center' onClick={toggleRows}>
								{showAllRows ? <ChevronUpIcon className='w-4 h-4' /> : <ChevronDownIcon className='w-4 h-4' />}
							</span>
						</div>
					)}
				</div>
			</div>
		);

	return (
		<div>
			<div className={cn('bg-[#FAFAFA] border rounded-lg shadow-sm', className)}>
				<div className='flex justify-between py-3 px-6 items-center w-full'>
					<p className='font-semibold text-lg'>{'Subscription Preview'}</p>
				</div>
				<div className='bg-[#F4F4F5] p-6 space-y-6'>
					{renderChargeSection(
						'Recurring Charges',
						recurringCharges,
						displayedRecurring,
						showAllRecurringRows,
						toggleRecurringRows,
						hasMoreRecurringRows,
					)}

					{renderChargeSection('Usage Charges', usageCharges, displayedUsage, showAllUsageRows, toggleUsageRows, hasMoreUsageRows)}

					{/* Overall Total */}
					<div className='flex justify-between items-center mt-6'>
						<span className='text-gray-700 font-semibold text-sm'>Total Payable</span>
						<span className='text-gray-600 font-semibold text-sm'>
							{getTotalPayableText(recurringCharges, usageCharges, recurringTotal)}
						</span>
					</div>
				</div>
			</div>

			<Card className='max-w-md mx-auto mt-4 shadow-sm'>
				<CardContent className='flex items-center gap-2 p-5'>
					<div className='flex-shrink-0'>
						<Info className='w-5 h-5' />
					</div>

					<p className='text-gray-500 text-sm font-normal'>{displayMessage()}</p>
				</CardContent>
			</Card>
		</div>
	);
};

export default Preview;
