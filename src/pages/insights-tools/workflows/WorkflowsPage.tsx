import { useEffect, useMemo, useState } from 'react';
import { Button, Page, FormHeader, Loader, ShortPagination, Chip } from '@/components/atoms';
import { ApiDocsContent, QueryBuilder } from '@/components/molecules';
import TooltipCell from '@/components/molecules/Table/TooltipCell';
import { WorkflowsApi } from '@/api';
import type { ListWorkflowsParams, WorkflowItem } from '@/types/dto';
import { formatDateTimeWithSeconds } from '@/utils/common/format_date';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
} from '@/types/common/QueryBuilder';
import type { TypedBackendFilter } from '@/types/formatters/QueryBuilder';
import { useQuery } from '@tanstack/react-query';
import useFilterSorting from '@/hooks/useFilterSorting';
import { RefreshCw } from 'lucide-react';

const PAGE_SIZE = 10;

/** Format time from API (milliseconds or ISO string); no timezone suffix (no GMT) */
function formatTime(value: string | number | undefined): string {
	if (value == null || value === '') return '—';
	const ms = typeof value === 'string' ? Number(value) : value;
	if (!Number.isFinite(ms)) {
		try {
			return formatDateTimeWithSeconds(value as string);
		} catch {
			return String(value);
		}
	}
	return formatDateTimeWithSeconds(new Date(ms));
}

/** Format duration_ms as ms, sec, min, hours (only non-zero parts) */
function formatDurationMs(value: number | undefined): string {
	if (value == null || typeof value !== 'number' || !Number.isFinite(value)) return '—';
	if (value < 1000) return `${Math.round(value)} ms`;
	const totalSeconds = Math.floor(value / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const parts: string[] = [];
	if (hours > 0) parts.push(`${hours} hr`);
	if (minutes > 0) parts.push(`${minutes} min`);
	parts.push(`${seconds} sec`);
	return parts.join(' ');
}

/** Status chip colors aligned with other tables: green = completed/active, red = failed, yellow = processing/running */
function getWorkflowStatusChip(status: string | undefined) {
	if (!status) return <Chip variant='default' label='—' />;
	const upper = status.toUpperCase();
	switch (upper) {
		case 'COMPLETED':
			return <Chip variant='success' label='Completed' />;
		case 'FAILED':
			return <Chip variant='failed' label='Failed' />;
		case 'RUNNING':
			return <Chip variant='warning' label='Running' />;
		default:
			return <Chip variant='default' label={status} />;
	}
}

/** Sentinel for "Any" in SELECT filters – Radix Select can reject empty string, so we use this and omit from API */
const FILTER_ANY_VALUE = '__any__';

/** API workflow_type → display name for UI. Usage: display = WORKFLOW_TYPE_DISPLAY_NAMES[workflow_type] ?? workflow_type */
export const WORKFLOW_TYPE_DISPLAY_NAMES: Record<string, string> = {
	PriceSyncWorkflow: 'Price sync',
	QuickBooksPriceSyncWorkflow: 'QuickBooks price sync',
	TaskProcessingWorkflow: 'Task processing',
	SubscriptionChangeWorkflow: 'Subscription change',
	SubscriptionCreationWorkflow: 'Subscription creation',
	StripeIntegrationWorkflow: 'Stripe integration',
	ExecuteExportWorkflow: 'Data export',
	HubSpotDealSyncWorkflow: 'HubSpot deal sync',
	HubSpotInvoiceSyncWorkflow: 'HubSpot invoice sync',
	HubSpotQuoteSyncWorkflow: 'HubSpot quote sync',
	NomodInvoiceSyncWorkflow: 'Nomod invoice sync',
	MoyasarInvoiceSyncWorkflow: 'Moyasar invoice sync',
	CustomerOnboardingWorkflow: 'Customer onboarding',
	PrepareProcessedEventsWorkflow: 'Prepare processed events',
	ScheduleSubscriptionBillingWorkflow: 'Schedule subscription billing',
	ProcessSubscriptionBillingWorkflow: 'Process subscription billing',
	ProcessInvoiceWorkflow: 'Process invoice',
	ReprocessEventsWorkflow: 'Reprocess events',
	ReprocessRawEventsWorkflow: 'Reprocess raw events',
	ReprocessEventsForPlanWorkflow: 'Reprocess events for plan',
};

function getWorkflowTypeDisplayName(apiValue: string | undefined): string {
	if (apiValue == null || apiValue === '') return '—';
	return WORKFLOW_TYPE_DISPLAY_NAMES[apiValue] ?? apiValue;
}

/** Map display name → API key so we always send the correct workflow_type (handles display name or key as stored value) */
const WORKFLOW_TYPE_DISPLAY_TO_API: Record<string, string> = Object.fromEntries(
	Object.entries(WORKFLOW_TYPE_DISPLAY_NAMES).map(([key, label]) => [label, key]),
);

/** Truncate id like Event Debugger: first 5 chars + "......", full id in tooltip/copy */
function formatWorkflowIdDisplay(id: string | undefined): string {
	if (!id) return '—';
	return id.length > 5 ? `${id.slice(0, 5)}......` : id;
}

/** Workflow type filter options: display name as label, API key as value (user selects "Price sync", we send PriceSyncWorkflow) */
const workflowTypeFilterOptions = [
	{ value: FILTER_ANY_VALUE, label: 'Any' },
	...Object.entries(WORKFLOW_TYPE_DISPLAY_NAMES).map(([value, label]) => ({ value, label })),
];

const filterOptions: FilterField[] = [
	{
		field: 'workflow_id',
		label: 'Workflow ID',
		fieldType: FilterFieldType.INPUT,
		operators: [FilterOperator.EQUAL],
		dataType: DataType.STRING,
	},
	{
		field: 'workflow_type',
		label: 'Workflow type',
		fieldType: FilterFieldType.SELECT,
		operators: [FilterOperator.EQUAL],
		dataType: DataType.STRING,
		options: workflowTypeFilterOptions,
	},
	{
		field: 'workflow_status',
		label: 'Status',
		fieldType: FilterFieldType.SELECT,
		operators: [FilterOperator.EQUAL],
		dataType: DataType.STRING,
		options: [
			{ value: FILTER_ANY_VALUE, label: 'Any' },
			{ value: 'Running', label: 'Running' },
			{ value: 'Completed', label: 'Completed' },
			{ value: 'Failed', label: 'Failed' },
		],
	},
	{
		field: 'entity',
		label: 'Entity',
		fieldType: FilterFieldType.SELECT,
		operators: [FilterOperator.EQUAL],
		dataType: DataType.STRING,
		options: [
			{ value: FILTER_ANY_VALUE, label: 'Any' },
			{ value: 'plan', label: 'plan' },
			{ value: 'customer', label: 'customer' },
			{ value: 'invoice', label: 'invoice' },
		],
	},
	{
		field: 'entity_id',
		label: 'Entity ID',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
];

const sortOptions: SortOption[] = [
	{ field: 'start_time', label: 'Start time', direction: SortDirection.DESC },
	{ field: 'close_time', label: 'Close time', direction: SortDirection.DESC },
	{ field: 'workflow_type', label: 'Workflow type', direction: SortDirection.ASC },
	{ field: 'status', label: 'Status', direction: SortDirection.ASC },
];

function convertWorkflowFiltersToParams(filters: TypedBackendFilter[]): Partial<ListWorkflowsParams> {
	const params: Partial<ListWorkflowsParams> = {};
	filters.forEach((filter) => {
		const value = filter.value?.string?.trim();
		if (!value || value === FILTER_ANY_VALUE) return;
		switch (filter.field) {
			case 'workflow_id':
				params.workflow_id = value;
				break;
			case 'workflow_type':
				// API expects workflow type key (e.g. PriceSyncWorkflow); convert display name if needed
				params.workflow_type = WORKFLOW_TYPE_DISPLAY_TO_API[value] ?? value;
				break;
			case 'workflow_status':
				params.workflow_status = value;
				break;
			case 'entity':
				params.entity = value;
				break;
			case 'entity_id':
				params.entity_id = value;
				break;
		}
	});
	return params;
}

const WorkflowsPage = () => {
	const [page, setPage] = useState(1);

	const initialFilters = useMemo(
		() => [
			{ id: 'wf-workflow_id', field: 'workflow_id', operator: FilterOperator.EQUAL, valueString: '', dataType: DataType.STRING },
			{
				id: 'wf-workflow_type',
				field: 'workflow_type',
				operator: FilterOperator.EQUAL,
				valueString: FILTER_ANY_VALUE,
				dataType: DataType.STRING,
			},
			{
				id: 'wf-workflow_status',
				field: 'workflow_status',
				operator: FilterOperator.EQUAL,
				valueString: FILTER_ANY_VALUE,
				dataType: DataType.STRING,
			},
			{ id: 'wf-entity', field: 'entity', operator: FilterOperator.EQUAL, valueString: FILTER_ANY_VALUE, dataType: DataType.STRING },
			{ id: 'wf-entity_id', field: 'entity_id', operator: FilterOperator.EQUAL, valueString: '', dataType: DataType.STRING },
		],
		[],
	);

	const initialSorts = useMemo(() => [{ field: 'start_time', label: 'Start time', direction: SortDirection.DESC }], []);

	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		initialFilters,
		initialSorts,
		debounceTime: 300,
	});

	const filterParams = useMemo(() => convertWorkflowFiltersToParams(sanitizedFilters), [sanitizedFilters]);

	const sortParams = useMemo((): Partial<ListWorkflowsParams> => {
		const first = sanitizedSorts[0];
		if (!first) return {};
		return {
			sort_by: first.field,
			sort_order: first.direction === SortDirection.DESC ? ('desc' as const) : ('asc' as const),
		};
	}, [sanitizedSorts]);

	const apiParams: ListWorkflowsParams = useMemo(
		() => ({
			page,
			page_size: PAGE_SIZE,
			...filterParams,
			...sortParams,
		}),
		[page, filterParams, sortParams],
	);

	const { data, isLoading, isError } = useQuery({
		queryKey: ['workflows', page, filterParams, sortParams],
		queryFn: async () => {
			const result = await WorkflowsApi.listWorkflows(apiParams);
			return result;
		},
		staleTime: 0,
		refetchOnWindowFocus: false,
	});

	useEffect(() => {
		setPage(1);
	}, [sanitizedFilters, sanitizedSorts]);

	const resetFilters = () => {
		setFilters(initialFilters);
		setSorts(initialSorts);
		setPage(1);
	};

	// Calculate total items for pagination
	// If backend provides total, use it. Otherwise estimate based on current page results
	const totalItems = useMemo(() => {
		if (data?.total !== undefined) {
			return data.total;
		}

		const currentPageItems = data?.workflows?.length ?? 0;

		// If we got fewer items than page size, we're on the last page
		if (currentPageItems < PAGE_SIZE) {
			return (page - 1) * PAGE_SIZE + currentPageItems;
		}

		// If we got exactly PAGE_SIZE items, assume there might be more pages
		// Show at least one more page to allow navigation
		return page * PAGE_SIZE + 1;
	}, [data?.total, data?.workflows?.length, page]);

	if (isLoading) {
		return <Loader />;
	}

	return (
		<Page heading='Runs'>
			<ApiDocsContent tags={['Workflows', 'Temporal']} />
			<div className='space-y-6'>
				<FormHeader title='Runs' variant='sub-header' />
				<div className='bg-white rounded-md flex items-start gap-4'>
					<QueryBuilder
						filterOptions={filterOptions}
						filters={filters}
						onFilterChange={setFilters}
						sortOptions={sortOptions}
						selectedSorts={sorts}
						onSortChange={setSorts}
						debounceTime={300}
					/>
					<Button variant='outline' onClick={resetFilters}>
						<RefreshCw />
					</Button>
				</div>
				{isError ? (
					<div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800'>
						Failed to load runs. Please try again later.
					</div>
				) : data?.workflows?.length ? (
					<div className='rounded-xl border border-gray-200 overflow-hidden'>
						<table className='w-full text-sm'>
							<thead className='bg-gray-50 border-b border-gray-200'>
								<tr>
									<th className='text-left py-3 px-4 font-medium text-gray-700'>Workflow ID</th>
									<th className='text-left py-3 px-4 font-medium text-gray-700'>Run ID</th>
									<th className='text-left py-3 px-4 font-medium text-gray-700'>Workflow type</th>
									<th className='text-left py-3 px-4 font-medium text-gray-700'>Status</th>
									<th className='text-left py-3 px-4 font-medium text-gray-700'>Start time</th>
									<th className='text-left py-3 px-4 font-medium text-gray-700'>Close time</th>
									<th className='text-left py-3 px-4 font-medium text-gray-700'>Duration</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-gray-200'>
								{data.workflows.map((workflow: WorkflowItem, index) => (
									<tr
										key={workflow.workflow_id && workflow.run_id ? `${workflow.workflow_id}-${workflow.run_id}` : `row-${index}`}
										className='hover:bg-gray-50'>
										<td className='py-3 px-4'>
											{workflow.workflow_id ? (
												<TooltipCell tooltipContent={formatWorkflowIdDisplay(workflow.workflow_id)} tooltipText={workflow.workflow_id} />
											) : (
												'—'
											)}
										</td>
										<td className='py-3 px-4'>
											{workflow.run_id ? (
												<TooltipCell tooltipContent={formatWorkflowIdDisplay(workflow.run_id)} tooltipText={workflow.run_id} />
											) : (
												'—'
											)}
										</td>
										<td className='py-3 px-4'>{getWorkflowTypeDisplayName(workflow.workflow_type)}</td>
										<td className='py-3 px-4'>{getWorkflowStatusChip(workflow.status)}</td>
										<td className='py-3 px-4 text-gray-600'>{formatTime(workflow.start_time)}</td>
										<td className='py-3 px-4 text-gray-600'>{formatTime(workflow.close_time)}</td>
										<td className='py-3 px-4 text-gray-600'>{formatDurationMs(workflow.duration_ms)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className='rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600'>No runs found.</div>
				)}
				{data?.workflows && data.workflows.length > 0 && (
					<ShortPagination unit='Runs' totalItems={totalItems} pageSize={PAGE_SIZE} currentPage={page} onPageChange={setPage} />
				)}
			</div>
		</Page>
	);
};

export default WorkflowsPage;
