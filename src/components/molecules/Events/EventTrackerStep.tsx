import { FC } from 'react';
import { CheckCircle2, XCircle, Circle } from 'lucide-react';
import { DebugTrackerStatus } from '@/types/dto';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface EventTrackerStepProps {
	title: string;
	status?: DebugTrackerStatus;
	stepKey: string;
	timestamp?: string;
	isIngested?: boolean;
}

const EventTrackerStep: FC<EventTrackerStepProps> = ({ title, status, timestamp, isIngested = false }) => {
	const { t } = useTranslation(['developers', 'common']);

	const renderStepIcon = () => {
		if (isIngested) {
			return <CheckCircle2 className='h-5 w-5 text-accent-emerald' />;
		}

		switch (status) {
			case 'attributed':
			case 'found':
				return <CheckCircle2 className='h-5 w-5 text-accent-emerald' />;
			case 'processing':
				return <Circle className='h-5 w-5 text-info-bright' />;
			case 'not_found':
				return <XCircle className='h-5 w-5 text-warning-bright' />;
			case 'error':
				return <XCircle className='h-5 w-5 text-danger-bright' />;
			default:
				// unprocessed — step not yet reached
				return <Circle className='h-5 w-5 text-content-slate-disabled' />;
		}
	};

	const renderStepStatusText = () => {
		if (isIngested) return null;

		switch (status) {
			case 'attributed':
			case 'found':
				return t('events.tracker.stepStatus.successful');
			case 'processing':
				return t('events.tracker.stepStatus.processing');
			case 'not_found':
			case 'error':
				return t('events.tracker.stepStatus.failed');
			default:
				return t('events.tracker.stepStatus.skipped');
		}
	};

	const statusText = renderStepStatusText();
	const statusColorClass =
		status === 'found' || status === 'attributed'
			? 'text-accent-emerald-strong'
			: status === 'processing'
				? 'text-info'
				: status === 'not_found'
					? 'text-warning'
					: status === 'error'
						? 'text-danger'
						: 'text-content-slate-muted';

	const formatTimestamp = (ts?: string) => {
		if (!ts) return null;
		try {
			const date = new Date(ts);
			if (isNaN(date.getTime())) return ts;

			const options: Intl.DateTimeFormatOptions = {
				year: 'numeric',
				month: 'short',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				timeZoneName: 'short',
				hour12: true,
			};

			return date.toLocaleString(undefined, options);
		} catch {
			return ts;
		}
	};

	const formattedTimestamp = timestamp ? formatTimestamp(timestamp) : null;

	return (
		<div className='grid grid-cols-[24px_1fr] gap-x-4'>
			<div className='relative z-10 flex justify-center pt-0.5'>
				<div className='bg-surface rounded-full p-0.5'>{renderStepIcon()}</div>
			</div>
			<div className='min-w-0'>
				<p className='text-sm font-medium text-foreground'>{title}</p>
				{formattedTimestamp && <p className='text-xs text-content-slate-muted mt-1'>{formattedTimestamp}</p>}
				{statusText && <p className={cn('text-xs mt-1', statusColorClass)}>{statusText}</p>}
			</div>
		</div>
	);
};

export default EventTrackerStep;
