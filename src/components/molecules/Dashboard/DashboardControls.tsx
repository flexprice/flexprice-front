'use client';

import { Select } from '@/components/atoms';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { WindowSize } from '@/models';
import { TIME_PERIOD } from '@/constants/constants';
import { getTypographyClass } from '@/lib/typography';

interface DashboardControlsProps {
	timePeriod: TIME_PERIOD;
	windowSize: WindowSize;
	onTimePeriodChange: (period: TIME_PERIOD) => void;
	onWindowSizeChange: (size: WindowSize) => void;
}

export const DashboardControls: React.FC<DashboardControlsProps> = ({ timePeriod, windowSize, onTimePeriodChange, onWindowSizeChange }) => {
	const { t } = useTranslation('common');

	const timePeriodOptions = useMemo(
		() => [
			{ value: TIME_PERIOD.LAST_HOUR, label: t('dashboardHome.timePeriodLastHour') },
			{ value: TIME_PERIOD.LAST_DAY, label: t('dashboardHome.timePeriodLastDay') },
			{ value: TIME_PERIOD.LAST_WEEK, label: t('dashboardHome.timePeriodLastWeek') },
			{ value: TIME_PERIOD.LAST_30_DAYS, label: t('dashboardHome.timePeriodLast30Days') },
		],
		[t],
	);

	const windowSizeOptions = useMemo(
		() => [
			{ value: WindowSize.MINUTE, label: t('dashboardHome.windowSizeMinute') },
			{ value: WindowSize.FIFTEEN_MIN, label: t('dashboardHome.windowSize15Min') },
			{ value: WindowSize.THIRTY_MIN, label: t('dashboardHome.windowSize30Min') },
			{ value: WindowSize.HOUR, label: t('dashboardHome.windowSizeHour') },
			{ value: WindowSize.THREE_HOUR, label: t('dashboardHome.windowSize3Hours') },
			{ value: WindowSize.SIX_HOUR, label: t('dashboardHome.windowSize6Hours') },
			{ value: WindowSize.TWELVE_HOUR, label: t('dashboardHome.windowSize12Hours') },
			{ value: WindowSize.DAY, label: t('dashboardHome.windowSizeDay') },
			{ value: WindowSize.WEEK, label: t('dashboardHome.windowSizeWeek') },
			{ value: WindowSize.MONTH, label: t('dashboardHome.windowSizeMonth') },
		],
		[t],
	);

	return (
		<div className='flex flex-col sm:flex-row gap-4 sm:justify-end mb-6'>
			<div className='flex flex-col sm:flex-row gap-4'>
				<div className='flex flex-col gap-2'>
					<label className={getTypographyClass('label-small', 'font-medium text-zinc-600')}>{t('labels.timePeriod')}</label>
					<Select
						value={timePeriod}
						options={timePeriodOptions}
						onChange={(value) => onTimePeriodChange(value as TIME_PERIOD)}
						className='min-w-[150px]'
					/>
				</div>
				<div className='flex flex-col gap-2'>
					<label className={getTypographyClass('label-small', 'font-medium text-zinc-600')}>{t('labels.windowSize')}</label>
					<Select
						value={windowSize}
						options={windowSizeOptions}
						onChange={(value) => onWindowSizeChange(value as WindowSize)}
						className='min-w-[150px]'
					/>
				</div>
			</div>
		</div>
	);
};

export default DashboardControls;
