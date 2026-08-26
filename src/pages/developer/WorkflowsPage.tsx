import { StatusChip, Button, Page } from '@/components/atoms';
import type { StatusChipTone } from '@/components/atoms/StatusChip';
import { ApiDocsContent } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { ColumnData, TooltipCell } from '@/components/molecules/Table';
import { QueryableDataArea } from '@/components/organisms';
import WorkflowApi from '@/api/WorkflowApi';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { RefreshCw } from 'lucide-react';
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
import { formatDateWithMilliseconds } from '@/utils/common/format_date';
import { WORKFLOW_TYPE_DISPLAY_NAMES } from '@/constants/workflow';
import type { WorkflowExecutionDTO } from '@/types/dto';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

/** Maps API workflow status values to `developers.workflows.filters.*` key suffixes */
const WORKFLOW_STATUS_TO_FILTER_KEY: Record<string, string> = {
	Running: 'running',
	Completed: 'completed',
	Failed: 'failed',
	Canceled: 'canceled',
	Terminated: 'terminated',
	ContinuedAsNew: 'continuedAsNew',
	TimedOut: 'timedOut',
};

function getWorkflowStatusTone(status: string): StatusChipTone {
	if (status === 'Completed') return 'success';
	if (status === 'Running' || status === 'ContinuedAsNew') return 'warning';
	if (status === 'Failed' || status === 'TimedOut') return 'danger';
	return 'neutral';
}

function translateWorkflowStatus(status: string, t: TFunction<'developers'>): string {
	const suffix = WORKFLOW_STATUS_TO_FILTER_KEY[status];
	return suffix ? t(`workflows.filters.${suffix}`) : status;
}

function formatWorkflowDuration(ms: number | null | undefined, t: TFunction<'developers'>): string {
	const dash = t('labels.missingValue');
	if (ms == null || typeof ms !== 'number' || !Number.isFinite(ms)) return dash;
	if (ms < 1000) return `${Math.round(ms)}${t('workflows.durationUnits.ms')}`;
	if (ms < 60_000) return `${(ms / 1000).toFixed(1)}${t('workflows.durationUnits.s')}`;
	if (ms < 3_600_000) return `${(ms / 60_000).toFixed(1)}${t('workflows.durationUnits.min')}`;
	return `${(ms / 3_600_000).toFixed(1)}${t('workflows.durationUnits.hr')}`;
}

const initialFilters: FilterCondition[] = [];

const WorkflowsPage = () => {
	const { t } = useTranslation(['developers', 'common']);

	const sortingOptions: SortOption[] = useMemo(
		() => [
			{ field: 'start_time', label: t('workflows.sort.startTime'), direction: SortDirection.DESC },
			{ field: 'close_time', label: t('workflows.sort.endTime'), direction: SortDirection.DESC },
			{ field: 'created_at', label: t('workflows.sort.createdAt'), direction: SortDirection.DESC },
		],
		[t],
	);

	const filterOptions: FilterField[] = useMemo(
		() => [
			{
				field: 'workflow_id',
				label: t('workflows.filters.workflowId'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'workflow_type',
				label: t('workflows.filters.workflowType'),
				fieldType: FilterFieldType.SELECT,
				operators: [FilterOperator.EQUAL],
				dataType: DataType.STRING,
				options: Object.entries(WORKFLOW_TYPE_DISPLAY_NAMES).map(([value, label]) => ({ value, label })),
			},
			{
				field: 'task_queue',
				label: t('workflows.filters.taskQueue'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'workflow_status',
				label: t('workflows.filters.status'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: 'Running', label: t('workflows.filters.running') },
					{ value: 'Completed', label: t('workflows.filters.completed') },
					{ value: 'Failed', label: t('workflows.filters.failed') },
					{ value: 'Canceled', label: t('workflows.filters.canceled') },
					{ value: 'Terminated', label: t('workflows.filters.terminated') },
					{ value: 'ContinuedAsNew', label: t('workflows.filters.continuedAsNew') },
					{ value: 'TimedOut', label: t('workflows.filters.timedOut') },
				],
			},
			{
				field: 'entity',
				label: t('workflows.filters.entity'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'entity_id',
				label: t('workflows.filters.entityId'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
		],
		[t],
	);

	const initialSorts: SortOption[] = useMemo(
		() => [
			{
				field: 'start_time',
				label: t('workflows.sort.startTime'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const columns: ColumnData<WorkflowExecutionDTO>[] = useMemo(
		() => [
			{
				title: t('workflows.columns.workflowId'),
				width: '15%',
				fieldVariant: 'title',
				render: (row) => <TooltipCell tooltipContent={row.workflow_id} tooltipText={row.workflow_id} />,
			},
			{
				title: t('workflows.columns.runId'),
				width: '15%',
				render: (row) => <TooltipCell tooltipContent={row.run_id} tooltipText={row.run_id} />,
			},
			{
				title: t('workflows.columns.workflowType'),
				width: '16%',
				render: (row) => {
					const label = WORKFLOW_TYPE_DISPLAY_NAMES[row.workflow_type] ?? row.workflow_type;
					return (
						<span className='block truncate' title={label}>
							{label}
						</span>
					);
				},
			},
			{
				title: t('workflows.columns.startTime'),
				width: '16%',
				render: (row) => (
					<span className='block truncate'>{row.start_time ? formatDateWithMilliseconds(row.start_time) : t('labels.missingValue')}</span>
				),
			},
			{
				title: t('workflows.columns.endTime'),
				width: '16%',
				render: (row) => (
					<span className='block truncate'>{row.close_time ? formatDateWithMilliseconds(row.close_time) : t('labels.missingValue')}</span>
				),
			},
			{
				title: t('workflows.columns.duration'),
				width: '10%',
				render: (row) => {
					const formatted = formatWorkflowDuration(row.duration_ms, t);
					return <TooltipCell tooltipContent={formatted} tooltipText={formatted} />;
				},
			},
			{
				title: t('workflows.columns.status'),
				width: '12%',
				render: (row) => {
					const status = row.status ?? t('labels.missingValue');
					const label =
						status === 'Completed'
							? t('workflows.statusChip.completed')
							: status === 'Failed'
								? t('workflows.statusChip.failed')
								: translateWorkflowStatus(status, t);
					return <StatusChip tone={getWorkflowStatusTone(status)} label={label} />;
				},
			},
		],
		[t],
	);

	return (
		<Page className='max-w-none' heading={t('common:nav.workflows')}>
			<ApiDocsContent tags={API_DOCS_TAGS.Workflows} />
			<QueryableDataArea<WorkflowExecutionDTO>
				queryConfig={{
					filterOptions,
					sortOptions: sortingOptions,
					initialFilters,
					initialSorts,
					debounceTime: 300,
					toolbarTrailing: (
						<Button variant='outline' onClick={() => refetchQueries('fetchWorkflows')} aria-label={t('common:actions.refresh')}>
							<RefreshCw />
						</Button>
					),
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
					variant: 'card',
					tableClassName: 'table-fixed',
					showEmptyRow: true,
				}}
				paginationConfig={{
					unit: t('workflows.paginationUnit'),
				}}
				emptyStateConfig={{
					heading: t('common:nav.workflows'),
					description: t('workflows.empty.description'),
					tags: API_DOCS_TAGS.Workflows,
				}}
			/>
		</Page>
	);
};

export default WorkflowsPage;
