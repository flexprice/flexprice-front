import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { CustomerPortalTimePeriod, TIME_PERIODS } from './constants';

interface TimePeriodSelectorProps {
	selectedPeriod: CustomerPortalTimePeriod;
	onPeriodChange: (period: CustomerPortalTimePeriod) => void;
}

/**
 * Reusable time period selector component for customer portal
 * Displays buttons for 1d, 7d, and 30d time periods
 */
const TimePeriodSelector = ({ selectedPeriod, onPeriodChange }: TimePeriodSelectorProps) => {
	const { t } = useTranslation('customer-portal');
	return (
		<div className='flex items-center gap-1 bg-zinc-50 rounded-lg p-1'>
			{TIME_PERIODS.map((period) => (
				<button
					key={period}
					onClick={() => onPeriodChange(period)}
					className={cn(
						'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
						selectedPeriod === period ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700',
					)}>
					{t(`timePeriod.${period}`)}
				</button>
			))}
		</div>
	);
};

export default TimePeriodSelector;
