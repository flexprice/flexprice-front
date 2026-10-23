import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import LoadingElapsed from './LoadingElapsed';

export interface PanelProps {
	title: string;
	definition?: string;
	pointInTime?: boolean;
	onViewReport?: () => void;
	actions?: ReactNode;
	onDownloadCsv?: () => void;
	csvDisabled?: boolean;
	loading?: boolean;
	error?: boolean;
	empty?: boolean;
	emptyMessage?: string;
	className?: string;
	children: ReactNode;
}

const Panel = ({
	title,
	definition,
	pointInTime,
	onViewReport,
	actions,
	onDownloadCsv,
	csvDisabled,
	loading,
	error,
	empty,
	emptyMessage,
	className,
	children,
}: PanelProps) => {
	const { t } = useTranslation('settings');
	return (
		<section aria-label={title} className={cn('flex flex-col gap-4 rounded-lg border border-line bg-surface p-5', className)}>
			<div className='flex flex-wrap items-start justify-between gap-3'>
				<div className='flex flex-col gap-1'>
					<div className='flex items-center gap-2'>
						<h3 className='text-sm font-semibold text-content-zinc-bold'>{title}</h3>
						{pointInTime && (
							<span className='text-xs text-content-zinc-tertiary'>{t('insightsTools.revenue.dashboard.kpi.pointInTime')}</span>
						)}
					</div>
					{definition && <p className='text-xs text-content-zinc-tertiary'>{definition}</p>}
				</div>
				<div className='flex flex-wrap items-center gap-2'>
					{actions}
					{onDownloadCsv && (
						<Button type='button' variant='outline' size='sm' disabled={csvDisabled} onClick={onDownloadCsv}>
							<Download className='h-4 w-4' />
							{t('insightsTools.revenue.reports.downloadCsv')}
						</Button>
					)}
					{onViewReport && (
						<Button type='button' variant='ghost' size='sm' onClick={onViewReport}>
							{t('insightsTools.revenue.dashboard.viewReport')}
							<ArrowRight className='h-4 w-4 rtl:rotate-180' />
						</Button>
					)}
				</div>
			</div>
			{loading ? (
				<div className='flex flex-col gap-2'>
					<Skeleton className='h-48 w-full' />
					<LoadingElapsed />
				</div>
			) : error ? (
				<p role='alert' className='py-10 text-center text-sm text-content-zinc-tertiary'>
					{t('insightsTools.revenue.reports.errorTitle')}
				</p>
			) : empty ? (
				<p className='py-10 text-center text-sm text-content-zinc-tertiary'>{emptyMessage ?? t('insightsTools.revenue.reports.noData')}</p>
			) : (
				children
			)}
		</section>
	);
};

export default Panel;
