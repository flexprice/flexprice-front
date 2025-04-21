import { getActualPriceForTotal, getPriceTableCharge } from '@/utils/models/transformed_plan';
import { ChargesForBillingPeriodOne } from './PriceTable';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card'; // Adjust import path if necessary
import { ChevronDownIcon, ChevronUpIcon, Info } from 'lucide-react';
import { getTotalPayableInfo, getTotalPayableText } from '@/utils/common/helper_functions';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { calculateCalendarBillingAnchor } from '@/utils/helpers/subscription';
import { BILLING_PERIOD } from '@/core/data/constants';
import formatDate from '@/utils/common/format_date';

interface PreviewProps {
	data: ChargesForBillingPeriodOne[];
	startDate: Date;
	className?: string;
}

const Preview = ({ data, className, startDate }: PreviewProps) => {
	// Separate charges into recurring and usage
	const recurringCharges = data.filter((charge) => charge.type === 'FIXED');
	const usageCharges = data.filter((charge) => charge.type === 'USAGE');

	// Calculate totals for both types
	const recurringTotal = recurringCharges.reduce((acc, charge) => acc + getActualPriceForTotal(charge), 0);

	const [showAllRecurringRows, setShowAllRecurringRows] = useState(false);
	const [showAllUsageRows, setShowAllUsageRows] = useState(false);

	const displayedRecurring = showAllRecurringRows ? recurringCharges : recurringCharges.slice(0, 5);
	const displayedUsage = showAllUsageRows ? usageCharges : usageCharges.slice(0, 5);

	const displayMessage = () => {
		if (recurringCharges.length === 0 && usageCharges.length === 0) {
			return 'No charges for this subscription';
		}

		const billingPeriod = data[0].billing_period.toUpperCase() as BILLING_PERIOD;

		const nextDate = calculateCalendarBillingAnchor(startDate, billingPeriod);
		let nextDateString = formatDate(nextDate);

		if (billingPeriod === BILLING_PERIOD.WEEKLY) {
			const weekday = nextDate.toLocaleDateString('en-US', { weekday: 'long' });
			nextDateString = `every week on ${weekday}`;
		} else if (billingPeriod === BILLING_PERIOD.MONTHLY) {
			const day = nextDate.getDate();
			nextDateString = `every month on ${day}st`;
		} else if (billingPeriod === BILLING_PERIOD.QUARTERLY) {
			const day = nextDate.getDate();
			nextDateString = `every quarter on ${day}st`;
		} else if (billingPeriod === BILLING_PERIOD.HALF_YEARLY) {
			const day = nextDate.getDate();
			nextDateString = `every half year on ${day}st`;
		} else if (billingPeriod === BILLING_PERIOD.ANNUAL) {
			const month = nextDate.toLocaleString('default', { month: 'short' });
			const day = nextDate.getDate();
			nextDateString = `every year on ${month} ${day}`;
		}

		return `The customer will be charged ${getTotalPayableInfo(recurringCharges, usageCharges, recurringTotal)} for this subscription ${nextDateString}`;
	};

	return (
		<div>
			<div className={cn('bg-[#FAFAFA]  border rounded-lg shadow-sm', className)}>
				<div className='flex justify-between py-3 px-6 items-center w-full'>
					<p className='font-semibold text-lg'>{'Subscription Preview'}</p>
				</div>
				<div className='bg-[#F4F4F5] p-6 space-y-6'>
					{/* Recurring Charges Section */}
					{recurringCharges.length > 0 && (
						<div>
							<p className='text-sm text-black font-semibold mb-3'>Recurring Charges</p>
							<div className='space-y-2 border-b border-gray-300 pb-2'>
								<motion.div
									initial={{ height: 'auto' }}
									animate={{ height: showAllRecurringRows ? 'auto' : 'auto' }}
									transition={{ duration: 0.3, ease: 'easeInOut' }}
									style={{ overflow: 'hidden' }}>
									{displayedRecurring.map((charge, index) => (
										<div key={`recurring-${index}`} className='flex justify-between items-center py-2'>
											<span className='text-gray-700 font-normal text-sm'>
												{charge.meter_name ? `${charge.name}/${charge.meter_name}` : charge.name}
											</span>
											<span className='text-gray-700 font-normal text-sm'>{getPriceTableCharge(charge)}</span>
										</div>
									))}
								</motion.div>

								{recurringCharges.length > 5 && (
									<div className='flex justify-center mt-4'>
										<span className='flex items-center ' onClick={() => setShowAllRecurringRows((prev) => !prev)}>
											{showAllRecurringRows ? (
												<>
													<ChevronUpIcon className='w-4 h-4' />
												</>
											) : (
												<>
													<ChevronDownIcon className='w-4 h-4' />
												</>
											)}
										</span>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Usage Charges Section */}
					{usageCharges.length > 0 && (
						<div>
							<p className='text-sm text-black font-semibold mb-3 mt-6'>Usage Charges</p>
							<div className='space-y-2 border-b border-gray-300 pb-2 transition-all duration-300 ease-in-out'>
								<motion.div
									initial={{ height: 'auto' }}
									animate={{ height: showAllUsageRows ? 'auto' : 'auto' }}
									transition={{ duration: 0.3, ease: 'easeInOut' }}
									style={{ overflow: 'hidden' }}>
									{displayedUsage.map((charge, index) => (
										<div key={`usage-${index}`} className='flex justify-between items-center py-2'>
											<span className='text-gray-700 font-normal text-sm'>{charge.meter_name ? `${charge.meter_name}` : charge.name}</span>
											<span className='text-gray-700 font-normal text-sm text-end'>{getPriceTableCharge(charge)}</span>
										</div>
									))}
								</motion.div>

								{usageCharges.length > 5 && (
									<div className='flex justify-center mt-4'>
										<span
											className='flex items-center gap-1 text-xs duration-300 transition-all'
											onClick={() => setShowAllUsageRows((prev) => !prev)}>
											{showAllUsageRows ? (
												<>
													<ChevronUpIcon className='w-4 h-4' />
												</>
											) : (
												<>
													<ChevronDownIcon className='w-4 h-4' />
												</>
											)}
										</span>
									</div>
								)}
							</div>
						</div>
					)}

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
						<Info className='w-5 h-5 ' />
					</div>

					<p className='text-gray-500 text-sm font-normal'>{displayMessage()}</p>
				</CardContent>
			</Card>
		</div>
	);
};

export default Preview;
