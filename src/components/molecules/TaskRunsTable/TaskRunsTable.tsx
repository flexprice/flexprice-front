import { FC, useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FlexpriceTable, ColumnData } from '@/components/molecules';
import { Chip, Select, ShortPagination, Spacer, ActionButton } from '@/components/atoms';
import TaskRunApi, { TaskRun } from '@/api/TaskRunApi';
import { formatDistanceToNow } from 'date-fns';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import { Download } from 'lucide-react';
import { TaskApi } from '@/api';
import toast from 'react-hot-toast';

interface TaskRunsTableProps {
	scheduledTaskId: string;
	taskType?: 'IMPORT' | 'EXPORT';
}

const TASK_RUNS_PAGE_SIZE = 10;

const TaskRunsTable: FC<TaskRunsTableProps> = ({ scheduledTaskId, taskType = 'EXPORT' }) => {
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
	const { limit, offset, page, reset } = usePagination({ initialLimit: TASK_RUNS_PAGE_SIZE, prefix: PAGINATION_PREFIX.TASK_RUNS });

	// Download task file mutation
	const { mutate: downloadFile } = useMutation({
		mutationFn: (taskId: string) => TaskApi.downloadTaskFile(taskId),
		onSuccess: (data) => {
			// Open the presigned URL in a new window with security flags
			window.open(data.download_url, '_blank', 'noopener,noreferrer');
			toast.success('Download started');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to download file');
		},
	});

	const handleDownload = (taskId: string) => {
		downloadFile(taskId);
	};

	// Stable ref so we only reset page when filter values change,
	// not when reset's identity changes after a page navigation (e.g. after setPage(2))
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

	// Filter by date range on client side
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

	// Use filtered data total when date filtering is active, otherwise use server total
	const totalItems = dateRangeFilter === 'all' ? runsResponse?.pagination?.total || 0 : filteredRuns.length;

	const getStatusChip = (status: string) => {
		const statusLower = status.toLowerCase();
		if (statusLower === 'completed') {
			return <Chip variant='success' label='Completed' />;
		} else if (statusLower === 'failed') {
			return <Chip variant='failed' label='Failed' />;
		} else if (statusLower === 'running') {
			return <Chip variant='info' label='Running' />;
		} else if (statusLower === 'pending') {
			return <Chip variant='warning' label='Pending' />;
		}
		return <Chip variant='default' label={status} />;
	};

	const formatDateTime = (dateString?: string) => {
		if (!dateString) return '-';
		const date = new Date(dateString);

		// Get UTC date components
		const now = new Date();
		const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
		const yesterdayUTC = new Date(todayUTC);
		yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);

		const dateUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

		// Format time in UTC
		const hours = date.getUTCHours().toString().padStart(2, '0');
		const minutes = date.getUTCMinutes().toString().padStart(2, '0');
		const seconds = date.getUTCSeconds().toString().padStart(2, '0');
		const timeString = `${hours}:${minutes}:${seconds}`;

		if (dateUTC.getTime() === todayUTC.getTime()) {
			return `Today ${timeString}`;
		} else if (dateUTC.getTime() === yesterdayUTC.getTime()) {
			return `Yesterday ${timeString}`;
		} else {
			const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
			const month = monthNames[date.getUTCMonth()];
			const day = date.getUTCDate();
			const year = date.getUTCFullYear();
			return `${month} ${day}, ${year} ${timeString}`;
		}
	};

	const formatRelativeTime = (dateString?: string) => {
		if (!dateString) return '-';
		try {
			return formatDistanceToNow(new Date(dateString), { addSuffix: true });
		} catch {
			return '-';
		}
	};

	const columns: ColumnData<TaskRun>[] = [
		{
			title: 'Status',
			render: (row) => getStatusChip(row.task_status),
			width: 120,
		},
		{
			title: 'Task ID',
			fieldName: 'id',
			width: 250,
		},
		{
			title: 'Data Interval Start',
			render: (row) => formatDateTime(row.metadata?.start_time),
			width: 180,
		},
		{
			title: 'Data Interval End',
			render: (row) => formatDateTime(row.metadata?.end_time),
			width: 180,
		},
		{
			title: 'Run Started',
			render: (row) => formatRelativeTime(row.started_at),
			width: 150,
		},
		{
			fieldVariant: 'interactive',
			width: '50px',
			render: (row) => {
				// Only show download action for completed export tasks with file_url
				const hasFile = row.file_url && row.task_status.toLowerCase() === 'completed';

				if (!hasFile) {
					return null;
				}

				return (
					<ActionButton
						id={row.id}
						deleteMutationFn={async () => {}} // No delete action
						refetchQueryKey='task-runs'
						entityName='Task'
						disableToast={true}
						edit={{ enabled: false }}
						archive={{ enabled: false }}
						customActions={[
							{
								text: 'Download File',
								icon: <Download className='size-4' />,
								onClick: () => handleDownload(row.id),
								enabled: true,
							},
						]}
					/>
				);
			},
		},
	];

	return (
		<div className='space-y-4'>
			{/* Filters */}
			<div className='flex gap-4 items-end'>
				<div className='w-64'>
					<label className='block text-sm font-medium text-gray-700 mb-2'>Status</label>
					<Select
						value={statusFilter}
						onChange={(value) => setStatusFilter(value)}
						options={[
							{ value: 'all', label: 'All Statuses' },
							{ value: 'COMPLETED', label: 'Completed' },
							{ value: 'FAILED', label: 'Failed' },
						]}
					/>
				</div>

				<div className='w-64'>
					<label className='block text-sm font-medium text-gray-700 mb-2'>Time Range</label>
					<Select
						value={dateRangeFilter}
						onChange={(value) => setDateRangeFilter(value)}
						options={[
							{ value: 'all', label: 'All Time' },
							{ value: 'today', label: 'Today' },
							{ value: 'yesterday', label: 'Yesterday' },
							{ value: 'last7days', label: 'Last 7 Days' },
							{ value: 'last30days', label: 'Last 30 Days' },
						]}
					/>
				</div>
			</div>

			{/* Table */}
			<FlexpriceTable columns={columns} data={filteredRuns} showEmptyRow={filteredRuns.length === 0 && !isLoading} />

			{filteredRuns.length === 0 && !isLoading && (
				<div className='text-center py-8 text-gray-500'>No task runs found for the selected filters.</div>
			)}

			{/* Pagination - only show when not using date filtering */}
			{totalItems > 0 && dateRangeFilter === 'all' && (
				<>
					<Spacer className='!h-4' />
					<ShortPagination unit='Task Runs' totalItems={totalItems} pageSize={limit} prefix={PAGINATION_PREFIX.TASK_RUNS} />
				</>
			)}
		</div>
	);
};

export default TaskRunsTable;
