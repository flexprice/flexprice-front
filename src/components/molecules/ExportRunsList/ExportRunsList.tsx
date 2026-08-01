import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import ExportRunApi, { ExportRun } from '@/api/ExportRunApi';
import { FormHeader, Loader } from '@/components/atoms';
import { CheckCircle, XCircle, Clock, Play, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportRunsListProps {
	taskId: string;
	limit?: number;
}

const ExportRunsList: FC<ExportRunsListProps> = ({ taskId, limit = 10 }) => {
	const { t } = useTranslation(['settings', 'common']);
	const { data: runsResponse, isLoading } = useQuery({
		queryKey: ['export-runs', taskId, limit],
		queryFn: () => ExportRunApi.getExportRunsByTaskId(taskId, { limit }),
	});

	const runs = runsResponse?.items || [];

	if (isLoading) {
		return <Loader />;
	}

	if (runs.length === 0) {
		return (
			<div className='card text-center py-8'>
				<Clock className='w-12 h-12 mx-auto mb-4 text-content-disabled' />
				<h3 className='text-lg font-medium text-content mb-2'>{t('exportRuns.emptyTitle')}</h3>
				<p className='text-content-muted'>{t('exportRuns.emptyDescription')}</p>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			<FormHeader variant='form-component-title' title={t('exportRuns.recentTitle')} />
			<div className='card'>
				{runs.map((run) => (
					<ExportRunItem key={run.id} run={run} />
				))}
			</div>
		</div>
	);
};

interface ExportRunItemProps {
	run: ExportRun;
}

const ExportRunItem: FC<ExportRunItemProps> = ({ run }) => {
	const { t } = useTranslation(['settings', 'common']);

	const getStatusIcon = (status: ExportRun['status']) => {
		switch (status) {
			case 'completed':
				return <CheckCircle className='w-4 h-4 text-success-bright' />;
			case 'failed':
				return <XCircle className='w-4 h-4 text-danger-bright' />;
			case 'running':
				return <Play className='w-4 h-4 text-info-bright' />;
			case 'pending':
				return <Clock className='w-4 h-4 text-accent-yellow' />;
			case 'cancelled':
				return <AlertCircle className='w-4 h-4 text-content-muted' />;
			default:
				return <Clock className='w-4 h-4 text-content-muted' />;
		}
	};

	const getStatusColor = (status: ExportRun['status']) => {
		switch (status) {
			case 'completed':
				return 'text-success-strong bg-success-muted';
			case 'failed':
				return 'text-danger-strong bg-danger-muted';
			case 'running':
				return 'text-info-strong bg-info-muted';
			case 'pending':
				return 'text-accent-yellow-strong bg-accent-yellow-bg';
			case 'cancelled':
				return 'text-content-secondary bg-surface-subtle';
			default:
				return 'text-content-secondary bg-surface-subtle';
		}
	};

	const formatFileSize = (bytes?: number) => {
		if (!bytes) return t('exportRuns.notAvailable');
		const sizes = [
			t('exportRuns.sizeUnits.bytes'),
			t('exportRuns.sizeUnits.kb'),
			t('exportRuns.sizeUnits.mb'),
			t('exportRuns.sizeUnits.gb'),
		];
		const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
		return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return t('exportRuns.notAvailable');
		return new Date(dateString).toLocaleString();
	};

	const statusLabel = t(`exportRuns.runStatus.${run.status}`, { defaultValue: run.status });

	return (
		<div className='flex items-center justify-between text-sm p-4 border-b last:border-b-0'>
			<div className='flex-1'>
				<div className='flex items-center gap-3'>
					{getStatusIcon(run.status)}
					<div>
						<div className='flex items-center gap-2'>
							<span className='font-medium capitalize'>{statusLabel}</span>
							<span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(run.status))}>{statusLabel}</span>
						</div>
						<div className='text-xs text-content-muted mt-1'>
							{run.started_at ? t('exportRuns.started', { time: formatDate(run.started_at) }) : t('exportRuns.notStarted')}
							{run.completed_at && ` • ${t('exportRuns.completed', { time: formatDate(run.completed_at) })}`}
						</div>
						{run.error_message && (
							<div className='text-xs text-danger mt-1'>
								{t('exportRuns.errorPrefix')} {run.error_message}
							</div>
						)}
					</div>
				</div>
			</div>
			<div className='flex items-center gap-4 text-xs text-content-muted'>
				{run.records_processed !== undefined && (
					<div>
						<span className='font-medium'>{run.records_processed}</span> {t('exportRuns.processed')}
					</div>
				)}
				{run.records_exported !== undefined && (
					<div>
						<span className='font-medium'>{run.records_exported}</span> {t('exportRuns.exported')}
					</div>
				)}
				{run.file_size_bytes && (
					<div>
						<span className='font-medium'>{formatFileSize(run.file_size_bytes)}</span>
					</div>
				)}
			</div>
		</div>
	);
};

export default ExportRunsList;
