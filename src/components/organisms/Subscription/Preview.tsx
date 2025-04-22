import { getActualPriceForTotal, getPriceTableCharge } from '@/utils/models/transformed_plan';
import { ChargesForBillingPeriodOne } from './PriceTable';
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, ChevronDownIcon, ChevronUpIcon, Info } from 'lucide-react';
import { formatBillingPeriodForDisplay, getTotalPayableInfo, getTotalPayableText } from '@/utils/common/helper_functions';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { BILLING_PERIOD } from '@/core/data/constants';
import { BILLING_CYCLE } from '@/models/Subscription';
import formatDate from '@/utils/common/format_date';
import { calculateAnniversaryBillingAnchor, calculateCalendarBillingAnchor } from '@/utils/helpers/subscription';
import { Spacer } from '@/components/atoms';

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
			<Spacer className='mt-4' />

			<Card className=''>
				<CardContent className='p-6 space-y-4'>
					<div className='space-y-4'>
						<div className='flex items-center gap-4'>
							<CalendarIcon className='size-4 text-gray-500' />
							<div className='flex-1 flex justify-between items-center'>
								<span className=''>Starts</span>
								<span className='text-gray-600'>{formatDate(startDate)}</span>
							</div>
						</div>

						<div className='flex items-center gap-4'>
							<svg
								width='24'
								height='24'
								viewBox='0 0 24 24'
								fill='none'
								xmlns='http://www.w3.org/2000/svg'
								className='size-4 text-gray-500'>
								<path
									d='M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
								/>
							</svg>
							<div className='flex-1 flex justify-between items-center'>
								<span className=''>First Invoice</span>
								<span className='text-gray-600'>
									{billingCycle.toUpperCase() === BILLING_CYCLE.CALENDAR
										? formatDate(calculateCalendarBillingAnchor(startDate, data[0].billing_period.toUpperCase() as BILLING_PERIOD))
										: formatDate(calculateAnniversaryBillingAnchor(startDate, data[0].billing_period.toUpperCase() as BILLING_PERIOD))}
								</span>
							</div>
						</div>

						<div className='bg-gray-50 p-3 rounded-lg flex items-center gap-3'>
							<Info className='size-4 flex-shrink-0' />
							<p className='text-sm'>
								Charged {getTotalPayableInfo(recurringCharges, usageCharges, recurringTotal)}{' '}
								{formatBillingPeriodForDisplay(data[0].billing_period.toUpperCase() as BILLING_PERIOD).toLowerCase()}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default Preview;
