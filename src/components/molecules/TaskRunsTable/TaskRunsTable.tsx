import { FC, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FlexpriceTable, ColumnData } from '@/components/molecules';
import { Chip, Select, ShortPagination, Spacer, ActionButton } from '@/components/atoms';
import TaskRunApi, { TaskRun } from '@/api/TaskRunApi';
import { formatDistanceToNow } from 'date-fns';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import { Download } from 'lucide-react';
import { TaskApi } from '@/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface TaskRunsTableProps {
	scheduledTaskId: string;
	taskType?: 'IMPORT' | 'EXPORT';
}

const TASK_RUNS_PAGE_SIZE = 10;

const TaskRunsTable: FC<TaskRunsTableProps> = ({ scheduledTaskId, taskType = 'EXPORT' }) => {
	const { t } = useTranslation('common');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
	const { limit, offset, page, reset } = usePagination({ initialLimit: TASK_RUNS_PAGE_SIZE, prefix: PAGINATION_PREFIX.TASK_RUNS });

	// Download task file mutation
	const { mutate: downloadFile } = useMutation({
		mutationFn: (taskId: string) => TaskApi.downloadTaskFile(taskId),
		onSuccess: (data) => {
			window.open(data.download_url, '_blank', 'noopener,noreferrer');
			toast.success(t('taskRunsTable.downloadStarted'));
		},
		onError: (error: Error) => {
			toast.error(error.message || t('taskRunsTable.downloadFailed'));
		},
	});

	const handleDownload = useCallback(
		(taskId: string) => {
			downloadFile(taskId);
		},
		[downloadFile],
	);

	const resetRef = useRef(reset);
	resetRef.current = reset;
	useEffect(() => {
		resetRef.current();
	}, [statusFilter, dateRangeFilter]);

	const { data: runsResponse, isLoading } = useQuery({
		queryKey: ['task-runs', scheduledTaskId, taskType, statusFilter, page],
		queryFn: () => {
			const params: Record<string, string | number> = {
				scheduled_task_id: scheduledTaskId,
				task_type: taskType,
				limit,
				offset,
			};

			if (statusFilter !== 'all') {
				params.task_status = statusFilter;
			}

			return TaskRunApi.getAllTaskRuns(params);
		},
	});

	const runs = runsResponse?.items || [];

	const filteredRuns = runs.filter((run) => {
		if (dateRangeFilter === 'all') return true;

		const runDate = new Date(run.started_at || run.created_at);
		const now = new Date();

		switch (dateRangeFilter) {
			case 'today':
				return runDate.toDateString() === now.toDateString();
			case 'yesterday': {
				const yesterday = new Date(now);
				yesterday.setDate(yesterday.getDate() - 1);
				return runDate.toDateString() === yesterday.toDateString();
			}
			case 'last7days': {
				const sevenDaysAgo = new Date(now);
				sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
				return runDate >= sevenDaysAgo;
			}
			case 'last30days': {
				const thirtyDaysAgo = new Date(now);
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
				return runDate >= thirtyDaysAgo;
			}
			default:
				return true;
		}
	});

	const totalItems = dateRangeFilter === 'all' ? runsResponse?.pagination?.total || 0 : filteredRuns.length;

	const getStatusChip = useCallback(
		(status: string) => {
			const statusLower = status.toLowerCase();
			if (statusLower === 'completed') {
				return <Chip variant='success' label={t('status.completed')} />;
			} else if (statusLower === 'failed') {
				return <Chip variant='failed' label={t('status.failed')} />;
			} else if (statusLower === 'running') {
				return <Chip variant='info' label={t('status.running')} />;
			} else if (statusLower === 'pending') {
				return <Chip variant='warning' label={t('status.pending')} />;
			}
			return <Chip variant='default' label={status} />;
		},
		[t],
	);

	const formatDateTime = useCallback(
		(dateString?: string) => {
			if (!dateString) return '-';
			const date = new Date(dateString);

			const now = new Date();
			const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
			const yesterdayUTC = new Date(todayUTC);
			yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);

			const dateUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

			const hours = date.getUTCHours().toString().padStart(2, '0');
			const minutes = date.getUTCMinutes().toString().padStart(2, '0');
			const seconds = date.getUTCSeconds().toString().padStart(2, '0');
			const timeString = `${hours}:${minutes}:${seconds}`;

			if (dateUTC.getTime() === todayUTC.getTime()) {
				return t('taskRunsTable.todayWithTime', { time: timeString });
			} else if (dateUTC.getTime() === yesterdayUTC.getTime()) {
				return t('taskRunsTable.yesterdayWithTime', { time: timeString });
			} else {
				const datePart = date.toLocaleDateString(undefined, {
					month: 'short',
					day: 'numeric',
					year: 'numeric',
					timeZone: 'UTC',
				});
				return `${datePart} ${timeString}`;
			}
		},
		[t],
	);

	const formatRelativeTime = (dateString?: string) => {
		if (!dateString) return '-';
		try {
			return formatDistanceToNow(new Date(dateString), { addSuffix: true });
		} catch {
			return '-';
		}
	};

	const columns: ColumnData<TaskRun>[] = useMemo(
		() => [
			{
				title: t('taskRunsTable.statusLabel'),
				render: (row) => getStatusChip(row.task_status),
				width: 120,
			},
			{
				title: t('taskRunsTable.columnTaskId'),
				fieldName: 'id',
				width: 250,
			},
			{
				title: t('taskRunsTable.columnDataIntervalStart'),
				render: (row) => formatDateTime(row.metadata?.start_time),
				width: 180,
			},
			{
				title: t('taskRunsTable.columnDataIntervalEnd'),
				render: (row) => formatDateTime(row.metadata?.end_time),
				width: 180,
			},
			{
				title: t('taskRunsTable.columnRunStarted'),
				render: (row) => formatRelativeTime(row.started_at),
				width: 150,
			},
			{
				fieldVariant: 'interactive',
				width: '50px',
				render: (row) => {
					const hasFile = row.file_url && row.task_status.toLowerCase() === 'completed';

					if (!hasFile) {
						return null;
					}

					return (
						<ActionButton
							id={row.id}
							copyId={{ entityType: 'Task Run' }}
							deleteMutationFn={async () => {}}
							refetchQueryKey='task-runs'
							entityName={t('taskRunsTable.entityTask')}
							disableToast={true}
							edit={{ enabled: false }}
							archive={{ enabled: false }}
							customActions={[
								{
									text: t('taskRunsTable.downloadFile'),
									icon: <Download className='size-4' />,
									onClick: () => handleDownload(row.id),
									enabled: true,
								},
							]}
						/>
					);
				},
			},
		],
		[t, getStatusChip, formatDateTime, handleDownload],
	);

	const statusOptions = useMemo(
		() => [
			{ value: 'all', label: t('taskRunsTable.allStatuses') },
			{ value: 'COMPLETED', label: t('status.completed') },
			{ value: 'FAILED', label: t('status.failed') },
		],
		[t],
	);

	const timeRangeOptions = useMemo(
		() => [
			{ value: 'all', label: t('taskRunsTable.allTime') },
			{ value: 'today', label: t('taskRunsTable.today') },
			{ value: 'yesterday', label: t('taskRunsTable.yesterday') },
			{ value: 'last7days', label: t('taskRunsTable.last7Days') },
			{ value: 'last30days', label: t('taskRunsTable.last30Days') },
		],
		[t],
	);

	return (
		<div className='space-y-4'>
			<div className='flex gap-4 items-end'>
				<div className='w-64'>
					<label className='block text-sm font-medium text-content-secondary mb-2'>{t('taskRunsTable.statusLabel')}</label>
					<Select value={statusFilter} onChange={(value) => setStatusFilter(value)} options={statusOptions} />
				</div>

				<div className='w-64'>
					<label className='block text-sm font-medium text-content-secondary mb-2'>{t('taskRunsTable.timeRangeLabel')}</label>
					<Select value={dateRangeFilter} onChange={(value) => setDateRangeFilter(value)} options={timeRangeOptions} />
				</div>
			</div>

			<FlexpriceTable columns={columns} data={filteredRuns} showEmptyRow={filteredRuns.length === 0 && !isLoading} />

			{filteredRuns.length === 0 && !isLoading && (
				<div className='text-center py-8 text-content-muted'>{t('taskRunsTable.emptyFiltered')}</div>
			)}

			{totalItems > 0 && dateRangeFilter === 'all' && (
				<>
					<Spacer className='!h-4' />
					<ShortPagination
						unit={t('taskRunsTable.paginationUnit')}
						totalItems={totalItems}
						pageSize={limit}
						prefix={PAGINATION_PREFIX.TASK_RUNS}
					/>
				</>
			)}
		</div>
	);
};

export default TaskRunsTable;
