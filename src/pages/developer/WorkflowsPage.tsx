import { Page, Chip } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules';
import { ColumnData, TooltipCell } from '@/components/molecules/Table';
import { QueryableDataArea } from '@/components/organisms';
import WorkflowApi from '@/api/WorkflowApi';
import { useMemo } from 'react';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
	FilterCondition,
} from '@/types/common/QueryBuilder';
import formatDate from '@/utils/common/format_date';
import { WORKFLOW_TYPE_DISPLAY_NAMES } from '@/constants/workflow';
import type { WorkflowExecutionDTO } from '@/types/dto';

/** Formats duration in milliseconds to a human-readable string with appropriate unit (ms, s, min, hr). */
function formatDuration(ms: number | null | undefined): string {
	if (ms == null || typeof ms !== 'number' || !Number.isFinite(ms)) return '—';
	if (ms < 1000) return `${Math.round(ms)}ms`;
	if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
	if (ms < 3_600_000) return `${(ms / 60_000).toFixed(1)}min`;
	return `${(ms / 3_600_000).toFixed(1)}hr`;
}

const sortingOptions: SortOption[] = [
	{ field: 'start_time', label: 'Start time', direction: SortDirection.DESC },
	{ field: 'close_time', label: 'End time', direction: SortDirection.DESC },
	{ field: 'created_at', label: 'Created at', direction: SortDirection.DESC },
];

const filterOptions: FilterField[] = [
	{
		field: 'workflow_id',
		label: 'Workflow ID',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'workflow_type',
		label: 'Workflow type',
		fieldType: FilterFieldType.SELECT,
		operators: [FilterOperator.EQUAL],
		dataType: DataType.STRING,
		options: Object.entries(WORKFLOW_TYPE_DISPLAY_NAMES).map(([value, label]) => ({ value, label })),
	},
	{
		field: 'task_queue',
		label: 'Task queue',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'workflow_status',
		label: 'Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN, FilterOperator.NOT_IN],
		dataType: DataType.ARRAY,
		options: [
			{ value: 'Running', label: 'Running' },
			{ value: 'Completed', label: 'Completed' },
			{ value: 'Failed', label: 'Failed' },
			{ value: 'Canceled', label: 'Canceled' },
			{ value: 'Terminated', label: 'Terminated' },
			{ value: 'ContinuedAsNew', label: 'Continued As New' },
			{ value: 'TimedOut', label: 'Timed Out' },
		],
	},
	{
		field: 'entity',
		label: 'Entity',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'entity_id',
		label: 'Entity ID',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
];

const initialFilters: FilterCondition[] = [];

const initialSorts: SortOption[] = [
	{
		field: 'start_time',
		label: 'Start time',
		direction: SortDirection.DESC,
	},
];

const WorkflowsPage = () => {
	const columns: ColumnData<WorkflowExecutionDTO>[] = useMemo(
		() => [
			{
				title: 'Workflow ID',
				width: 200,
				render: (row) => <TooltipCell tooltipContent={row.workflow_id} tooltipText={row.workflow_id} />,
			},
			{
				title: 'Run ID',
				width: 200,
				render: (row) => <TooltipCell tooltipContent={row.run_id} tooltipText={row.run_id} />,
			},
			{
				title: 'Workflow type',
				render: (row) => WORKFLOW_TYPE_DISPLAY_NAMES[row.workflow_type] ?? row.workflow_type,
			},
			{
				title: 'Status',
				render: (row) => {
					const status = row.status ?? '—';
					const label = status === 'Completed' ? 'Completed' : status === 'Failed' ? 'Failed' : status;
					return <Chip variant={status === 'Completed' ? 'success' : status === 'Failed' ? 'failed' : 'default'} label={label} />;
				},
			},
			{
				title: 'Start time',
				render: (row) => <TooltipCell tooltipContent={formatDate(row.start_time)} tooltipText={row.start_time || '—'} />,
			},
			{
				title: 'End time',
				render: (row) => (
					<TooltipCell tooltipContent={row.close_time ? formatDate(row.close_time) : '—'} tooltipText={row.close_time || '—'} />
				),
			},
			{
				title: 'Duration',
				render: (row) => {
					const formatted = formatDuration(row.duration_ms);
					return <TooltipCell tooltipContent={formatted} tooltipText={formatted} />;
				},
			},
		],
		[],
	);

	return (
		<Page heading='Workflows'>
			<ApiDocsContent tags={['Workflows']} />
			<QueryableDataArea<WorkflowExecutionDTO>
				queryConfig={{
					filterOptions,
					sortOptions: sortingOptions,
					initialFilters,
					initialSorts,
					debounceTime: 300,
				}}
				dataConfig={{
					queryKey: 'fetchWorkflows',
					fetchFn: async (params) => WorkflowApi.search(params),
					probeFetchFn: async (params) =>
						WorkflowApi.search({
							...params,
							limit: 1,
							offset: 0,
							filters: [],
							sort: [],
						}),
				}}
				tableConfig={{
					columns,
					// onRowClick: (row) => navigate(RouteNames.workflowDetails.replace(':workflowId', row.workflow_id).replace(':runId', row.run_id)),
					showEmptyRow: true,
				}}
				paginationConfig={{
					unit: 'Workflows',
				}}
				emptyStateConfig={{
					heading: 'Workflows',
					description: 'Temporal workflow executions will appear here when runs are recorded.',
					tags: ['Workflows'],
				}}
			/>
		</Page>
	);
};

export default WorkflowsPage;
