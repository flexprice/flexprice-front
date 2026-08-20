import { memo, useCallback, useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { QueryBuilder } from '@/components/molecules';
import OrgTypeMetadataFilter from '@/components/molecules/Customer/OrgTypeMetadataFilter';
import { ColumnData } from '@/components/molecules/Table';
import usePagination from '@/hooks/usePagination';
import { usePaginationReset } from '@/hooks/usePaginationReset';
import useFilterSortingWithPersistence from '@/hooks/useFilterSortingWithPersistence';
import { useQueryWithEmptyState } from '@/hooks/useQueryWithEmptyState';
import { usePageToolbarSlot } from '@/context/PageToolbarSlotContext';
import { CustomerOrgTypeFilterValue } from '@/constants/customerOrgTypeFilter';
import { hasOrgTypeInMetadataFilters, removeOrgTypeFromMetadataFilters } from '@/utils/customer/orgTypeMetadataFilterSync';
import { FilterField, FilterCondition, SortOption } from '@/types/common/QueryBuilder';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import TableArea from './TableArea';

/**
 * Configuration for filtering and sorting functionality.
 * Controls the QueryBuilder component behavior and initial state.
 */
export interface QueryConfig {
	/** Available filter fields that users can filter by */
	filterOptions: FilterField[];
	/** Available sort options that users can sort by */
	sortOptions?: SortOption[];
	/** Initial filter conditions to apply on mount */
	initialFilters?: FilterCondition[];
	/** Initial sort options to apply on mount */
	initialSorts?: SortOption[];
	/** Debounce time in milliseconds for filter changes (default: 300) */
	debounceTime?: number;
	/**
	 * Key for filter/sort persistence (URL + session storage). Default: dataConfig.queryKey. Omit or set to undefined to use default.
	 */
	filterPersistenceKey?: string;
	/** Optional trailing toolbar content rendered on the right of the query builder row. */
	toolbarTrailing?: React.ReactNode;
	/** Optional parent/child org_type toolbar filter with metadata-filter sync. */
	orgTypeMetadataFilter?: {
		value: CustomerOrgTypeFilterValue | null;
		onChange: (value: CustomerOrgTypeFilterValue | null) => void;
	};
	/** Icon-only filter/sort triggers with a count coin when active. */
	controlsVariant?: 'labeled' | 'icon';
}

/**
 * Configuration for data fetching.
 * Defines how data is fetched from the API and cached.
 */
export interface DataConfig<T> {
	/** Unique key for React Query cache (e.g., 'fetchCustomers') */
	queryKey: string;
	/** Main function to fetch data. Receives pagination, filters, and sort params */
	fetchFn: (params: {
		limit: number;
		offset: number;
		filters: any[];
		sort: any[];
		[key: string]: any;
	}) => Promise<{ items: T[]; pagination: { total?: number } }>;
	/** Optional probe function to check if any data exists (for empty state detection) */
	probeFetchFn?: (params: {
		limit: number;
		offset: number;
		filters: any[];
		sort: any[];
		[key: string]: any;
	}) => Promise<{ items: T[]; pagination: { total?: number } }>;
	/** Additional query parameters to pass to fetch functions */
	additionalQueryParams?: Record<string, any>;
	/**
	 * Called whenever the main query result changes, including when served from cache
	 * (e.g. pagination or filter changes). Use to sync UI like dynamic table columns.
	 */
	onMainDataChange?: (data: { items: T[]; pagination: { total?: number } } | undefined) => void;
}

/**
 * Configuration for table rendering.
 * Controls how the data table is displayed and behaves.
 */
export interface TableConfig<T> {
	/** Column definitions for the table */
	columns: ColumnData<T>[];
	/** Optional callback when a row is clicked */
	onRowClick?: (row: T) => void;
	/** Show an empty row when there's no data (default: false) */
	showEmptyRow?: boolean;
	/** Hide the bottom border of the table (default: false) */
	hideBottomBorder?: boolean;
	/** Visual variant of the table (default: 'default') */
	variant?: 'default' | 'no-bordered' | 'card';
	/** Applied to the inner `<table>` (e.g. `table-fixed` for predictable column widths). */
	tableClassName?: string;
}

/**
 * Configuration for pagination.
 * Controls pagination behavior and display.
 */
export interface PaginationConfig {
	/** Display label for pagination (e.g., 'Customers', 'Plans') */
	unit?: string;
	/** Initial number of items per page (default: 10) */
	initialLimit?: number;
	/** URL parameter prefix for pagination state (e.g., 'wallet_transactions') */
	prefix?: string;
}

/**
 * Configuration for empty state display.
 * Shown when no data is available after filtering.
 */
export interface EmptyStateConfig {
	/** Heading text for empty state */
	heading?: string;
	/** Description text for empty state */
	description?: string;
	/** Label for the action button */
	buttonLabel?: string;
	/** Callback when action button is clicked */
	buttonAction?: () => void;
	/** API documentation tags to show */
	tags?: string[];
	/** Tutorial cards to display */
	tutorials?: any[];
	/** Custom React component to render instead of default empty state (takes priority) */
	customComponent?: React.ReactNode;
}

/**
 * Main props interface for QueryableDataArea component.
 *
 * This component provides a complete data table solution with:
 * - Filtering and sorting via QueryBuilder
 * - Pagination
 * - Data fetching with React Query
 * - Empty state handling
 * - Error handling
 *
 * The component is optimized to only re-render the data area when query parameters change,
 * keeping the QueryBuilder stable to prevent unnecessary re-renders.
 */
export interface QueryableDataAreaProps<T = any> {
	/** Query configuration: filtering and sorting */
	queryConfig: QueryConfig;
	/** Data configuration: fetching and caching */
	dataConfig: DataConfig<T>;
	/** Table configuration: columns and display options */
	tableConfig: TableConfig<T>;
	/** Pagination configuration */
	paginationConfig?: PaginationConfig;
	/** Empty state configuration */
	emptyStateConfig?: EmptyStateConfig;
	/** Optional error handler callback */
	onError?: (error: any) => void;
}

// Stable QueryBuilder wrapper - memoized to prevent re-renders
const QueryBuilderWrapper = memo<{
	filterOptions: FilterField[];
	sortOptions?: SortOption[];
	filters: FilterCondition[];
	sorts: SortOption[];
	onFilterChange: (filters: FilterCondition[]) => void;
	onSortChange: (sorts: SortOption[]) => void;
	toolbarTrailing?: React.ReactNode;
	controlsVariant?: 'labeled' | 'icon';
	placement?: 'standalone' | 'header';
}>(({ filterOptions, sortOptions, filters, sorts, onFilterChange, onSortChange, toolbarTrailing, controlsVariant, placement }) => {
	return (
		<QueryBuilder
			filterOptions={filterOptions}
			filters={filters}
			onFilterChange={onFilterChange}
			sortOptions={sortOptions}
			onSortChange={onSortChange}
			selectedSorts={sorts}
			controlsVariant={controlsVariant}
			placement={placement}>
			{toolbarTrailing}
		</QueryBuilder>
	);
});

QueryBuilderWrapper.displayName = 'QueryBuilderWrapper';

/** Ensures list responses always expose an `items` array for table + empty-state logic. */
const normalizeListResponse = <T,>(result: { items?: T[]; pagination?: { total?: number } }) => ({
	...result,
	items: result.items ?? [],
	pagination: result.pagination ?? { total: 0 },
});

// Data area component - re-renders when query params change
const DataArea = <T,>({
	sanitizedFilters,
	sanitizedSorts,
	tableConfig,
	paginationConfig,
	reset,
	emptyStateConfig,
	onError,
	data,
	isError,
	error,
	showEmptyPage,
	shouldShowLoading,
}: {
	sanitizedFilters: any[];
	sanitizedSorts: any[];
	tableConfig: TableConfig<T>;
	paginationConfig?: PaginationConfig;
	reset: () => void;
	emptyStateConfig?: EmptyStateConfig;
	onError?: (error: any) => void;
	data: { items: T[]; pagination: { total?: number } } | undefined;
	isError: boolean;
	error: any;
	showEmptyPage: boolean;
	shouldShowLoading: boolean;
}) => {
	// Reset pagination when filters or sorts change
	usePaginationReset(reset, sanitizedFilters, sanitizedSorts);

	// Loading state - prioritize showing loading during transitions
	if (shouldShowLoading) {
		return <LoadingState />;
	}

	// Handle errors
	if (isError) {
		return <ErrorState error={error} onError={onError} />;
	}

	// Show empty state - only when NOT loading and we have definitive data
	if (showEmptyPage && emptyStateConfig) {
		return <EmptyState config={emptyStateConfig} />;
	}

	// Render table with data
	return <TableArea data={data} tableConfig={tableConfig} paginationConfig={paginationConfig} />;
};

/**
 * QueryableDataArea Component
 *
 * A comprehensive data table component with built-in filtering, sorting, pagination,
 * and empty state handling. Optimized to minimize re-renders by isolating the data
 * area from the query builder.
 *
 * @example
 * ```tsx
 * <QueryableDataArea<Customer>
 *   queryConfig={{
 *     filterOptions: customerFilterOptions,
 *     sortOptions: customerSortOptions,
 *     initialFilters: defaultFilters,
 *     debounceTime: 300,
 *   }}
 *   dataConfig={{
 *     queryKey: 'fetchCustomers',
 *     fetchFn: CustomerApi.getCustomersByFilters,
 *   }}
 *   tableConfig={{
 *     columns: customerColumns,
 *     onRowClick: (customer) => navigate(`/customers/${customer.id}`),
 *     showEmptyRow: true,
 *   }}
 *   paginationConfig={{
 *     unit: 'Customers',
 *     initialLimit: 10,
 *   }}
 *   emptyStateConfig={{
 *     heading: 'No Customers',
 *     description: 'Create your first customer to get started.',
 *     buttonLabel: 'Create Customer',
 *     buttonAction: handleCreate,
 *   }}
 * />
 * ```
 */
const QueryableDataArea = <T = any,>({
	queryConfig,
	dataConfig,
	tableConfig,
	paginationConfig,
	emptyStateConfig,
	onError,
}: QueryableDataAreaProps<T>) => {
	// Track loading state (initial mount + filter/sort transitions)
	const [isInitialMount, setIsInitialMount] = useState(true);
	const [isTransitionLoading, setIsTransitionLoading] = useState(false);
	const prevQueryKeyRef = useRef<string>('');

	// Pagination
	const { limit, offset, page, reset } = usePagination({
		initialLimit: paginationConfig?.initialLimit ?? 10,
		prefix: paginationConfig?.prefix as any,
	});

	// Filter and sort state
	// URL + session persistence by default so filters/sorts are shareable via link
	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSortingWithPersistence({
		initialFilters: queryConfig.initialFilters ?? [],
		initialSorts: queryConfig.initialSorts ?? [],
		debounceTime: queryConfig.debounceTime ?? 300,
		persistenceKey: queryConfig.filterPersistenceKey ?? dataConfig.queryKey,
	});

	const allowedFilterFields = useMemo(() => new Set(queryConfig.filterOptions.map((field) => field.field)), [queryConfig.filterOptions]);
	const hasValidatedPersistedFiltersRef = useRef(false);

	// Drop stale persisted filters (e.g. renamed fields) so they cannot zero-out results silently.
	useLayoutEffect(() => {
		if (hasValidatedPersistedFiltersRef.current) return;
		hasValidatedPersistedFiltersRef.current = true;
		const valid = filters.filter((condition) => allowedFilterFields.has(condition.field));
		if (valid.length !== filters.length) {
			setFilters(valid);
		}
	}, [allowedFilterFields, filters, setFilters]);

	const orgTypeMetadataFilter = queryConfig.orgTypeMetadataFilter;

	const handleFilterChange = useCallback(
		(nextFilters: FilterCondition[]) => {
			if (orgTypeMetadataFilter && orgTypeMetadataFilter.value != null && hasOrgTypeInMetadataFilters(nextFilters)) {
				orgTypeMetadataFilter.onChange(null);
			}
			setFilters(nextFilters);
		},
		[orgTypeMetadataFilter, setFilters],
	);

	const handleOrgTypeMetadataFilterChange = useCallback(
		(value: CustomerOrgTypeFilterValue | null) => {
			if (!orgTypeMetadataFilter) return;

			if (value != null) {
				const strippedFilters = removeOrgTypeFromMetadataFilters(filters);
				if (strippedFilters !== filters) {
					setFilters(strippedFilters);
				}
			}

			orgTypeMetadataFilter.onChange(value);
		},
		[filters, orgTypeMetadataFilter, setFilters],
	);

	const resolvedToolbarTrailing = useMemo(() => {
		const orgTypeFilterNode = orgTypeMetadataFilter ? (
			<OrgTypeMetadataFilter value={orgTypeMetadataFilter.value} onChange={handleOrgTypeMetadataFilterChange} />
		) : null;

		if (orgTypeFilterNode && queryConfig.toolbarTrailing) {
			return (
				<>
					{orgTypeFilterNode}
					{queryConfig.toolbarTrailing}
				</>
			);
		}

		return orgTypeFilterNode ?? queryConfig.toolbarTrailing ?? null;
	}, [handleOrgTypeMetadataFilterChange, orgTypeMetadataFilter, queryConfig.toolbarTrailing]);

	// Generate query key for tracking changes
	const additionalQueryParamsKey = useMemo(
		() => JSON.stringify(dataConfig.additionalQueryParams ?? {}),
		[dataConfig.additionalQueryParams],
	);

	const queryKey = useMemo(
		() => JSON.stringify({ page, filters: sanitizedFilters, sorts: sanitizedSorts, additionalQueryParams: additionalQueryParamsKey }),
		[page, sanitizedFilters, sanitizedSorts, additionalQueryParamsKey],
	);

	// Create fetch function with all params
	const fetchData = useCallback(async () => {
		const result = await dataConfig.fetchFn({
			limit,
			offset,
			filters: sanitizedFilters,
			sort: sanitizedSorts,
			...dataConfig.additionalQueryParams,
		});
		return normalizeListResponse(result);
	}, [dataConfig, limit, offset, sanitizedFilters, sanitizedSorts]);

	// Create probe fetch function
	const probeFetch = useCallback(async () => {
		const result = dataConfig.probeFetchFn
			? await dataConfig.probeFetchFn({
					limit: 1,
					offset: 0,
					filters: [],
					sort: [],
					...dataConfig.additionalQueryParams,
				})
			: await dataConfig.fetchFn({
					limit: 1,
					offset: 0,
					filters: [],
					sort: [],
					...dataConfig.additionalQueryParams,
				});
		return normalizeListResponse(result);
	}, [dataConfig]);

	// Data fetching with empty state detection
	const { data, isLoading, isError, error, probeData } = useQueryWithEmptyState({
		main: {
			queryKey: [dataConfig.queryKey, queryKey],
			queryFn: fetchData,
		},
		probe: {
			queryKey: [dataConfig.queryKey, 'probe', queryKey],
			queryFn: probeFetch,
		},
		shouldProbe: (mainData) => (mainData?.items?.length ?? 0) === 0,
	});

	const onMainDataChangeRef = useRef(dataConfig.onMainDataChange);
	onMainDataChangeRef.current = dataConfig.onMainDataChange;

	useEffect(() => {
		reset();
	}, [filters, sorts, additionalQueryParamsKey]);

	useLayoutEffect(() => {
		onMainDataChangeRef.current?.(data);
	}, [data]);

	// Consolidated effect: detect query changes and manage loading states
	useEffect(() => {
		const queryChanged = prevQueryKeyRef.current !== queryKey;

		// Set transition loading if query changed (after initial mount)
		if (queryChanged && !isInitialMount) {
			setIsTransitionLoading(true);
		}

		// Clear loading states once queries settle (success or error — not only when data exists)
		if (!isLoading) {
			if (isInitialMount) {
				setIsInitialMount(false);
			}
			if (isTransitionLoading) {
				setIsTransitionLoading(false);
			}
		}

		// Update previous query key
		prevQueryKeyRef.current = queryKey;
	}, [queryKey, isLoading, isInitialMount, isTransitionLoading]);

	// Calculate loading state
	const shouldShowLoading = isLoading || isInitialMount || isTransitionLoading;

	// Show empty page when no data exists (only when not loading and have definitive data)
	const showEmptyPage = useMemo(() => {
		if (shouldShowLoading || !data) return false;
		if ((data.items?.length ?? 0) > 0) return false;
		if (!probeData) return false;
		return (probeData.items?.length ?? 0) === 0;
	}, [shouldShowLoading, probeData, data]);

	const shouldShowEmptyState = showEmptyPage && !!emptyStateConfig;

	// Determine if we should show QueryBuilder
	// Hide only on initial mount; after that, always show unless in empty state
	const shouldShowQueryBuilder = useMemo(() => {
		// Don't show during initial mount (we don't know if data exists yet)
		if (isInitialMount) return false;
		// Don't show when in empty state
		if (shouldShowEmptyState) return false;
		// After initial mount, always show QueryBuilder (even during filter changes)
		// This prevents blinking when filters/sorts change
		return true;
	}, [isInitialMount, shouldShowEmptyState]);

	const toolbarSlotEl = usePageToolbarSlot();
	const useHeaderToolbar = toolbarSlotEl != null;

	const queryControls = shouldShowQueryBuilder ? (
		<QueryBuilderWrapper
			filterOptions={queryConfig.filterOptions}
			sortOptions={queryConfig.sortOptions}
			filters={filters}
			sorts={sorts}
			onFilterChange={handleFilterChange}
			onSortChange={setSorts}
			toolbarTrailing={resolvedToolbarTrailing}
			controlsVariant={queryConfig.controlsVariant ?? 'icon'}
			placement={useHeaderToolbar ? 'header' : 'standalone'}
		/>
	) : null;

	return (
		<div>
			{useHeaderToolbar ? createPortal(queryControls, toolbarSlotEl) : queryControls}

			{/* Data area - re-renders when query params change */}
			<DataArea<T>
				sanitizedFilters={sanitizedFilters}
				sanitizedSorts={sanitizedSorts}
				tableConfig={tableConfig}
				paginationConfig={paginationConfig}
				reset={reset}
				emptyStateConfig={emptyStateConfig}
				onError={onError}
				data={data}
				isError={isError}
				error={error}
				showEmptyPage={showEmptyPage}
				shouldShowLoading={shouldShowLoading}
			/>
		</div>
	);
};

export default QueryableDataArea;
