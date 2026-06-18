import { memo, useCallback, useMemo, useRef, useState, useEffect, useLayoutEffect, type ReactNode } from 'react';
import { QueryBuilder } from '@/components/molecules';
import { ColumnData } from '@/components/molecules/Table';
import usePagination from '@/hooks/usePagination';
import { usePaginationReset } from '@/hooks/usePaginationReset';
import useFilterSortingWithPersistence from '@/hooks/useFilterSortingWithPersistence';
import { useQueryWithEmptyState } from '@/hooks/useQueryWithEmptyState';
import { FilterField, FilterCondition, SortOption } from '@/types/common/QueryBuilder';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import TableArea from './TableArea';
import { MetadataToggleQuickFilter, type MetadataToggleQuickFilterConfig } from './metadataToggleQuickFilter';

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
	/** Optional metadata toggle quick filters (e.g. parent/child via `metadata.org_type`). */
	metadataToggleQuickFilter?: MetadataToggleQuickFilterConfig;
	/** Optional content rendered to the right of filter + sort in the query builder toolbar. */
	queryBuilderPrepend?: ReactNode | ((ctx: { filters: FilterCondition[]; setFilters: (filters: FilterCondition[]) => void }) => ReactNode);
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
	variant?: 'default' | 'no-bordered';
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
	prepend?: ReactNode;
	reservedMetadataKeys?: string[];
}>(({ filterOptions, sortOptions, filters, sorts, onFilterChange, onSortChange, prepend, reservedMetadataKeys }) => {
	return (
		<QueryBuilder
			filterOptions={filterOptions}
			filters={filters}
			onFilterChange={onFilterChange}
			sortOptions={sortOptions}
			onSortChange={onSortChange}
			selectedSorts={sorts}
			prepend={prepend}
			reservedMetadataKeys={reservedMetadataKeys}
		/>
	);
});

QueryBuilderWrapper.displayName = 'QueryBuilderWrapper';

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

	// Generate query key for tracking changes
	const queryKey = useMemo(
		() => JSON.stringify({ page, filters: sanitizedFilters, sorts: sanitizedSorts }),
		[page, sanitizedFilters, sanitizedSorts],
	);

	// Create fetch function with all params
	const fetchData = useCallback(async () => {
		return dataConfig.fetchFn({
			limit,
			offset,
			filters: sanitizedFilters,
			sort: sanitizedSorts,
			...dataConfig.additionalQueryParams,
		});
	}, [dataConfig, limit, offset, sanitizedFilters, sanitizedSorts]);

	// Create probe fetch function
	const probeFetch = useCallback(async () => {
		if (dataConfig.probeFetchFn) {
			return await dataConfig.probeFetchFn({
				limit: 1,
				offset: 0,
				filters: [],
				sort: [],
				...dataConfig.additionalQueryParams,
			});
		}
		return await dataConfig.fetchFn({
			limit: 1,
			offset: 0,
			filters: [],
			sort: [],
			...dataConfig.additionalQueryParams,
		});
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
		shouldProbe: (mainData) => mainData?.items.length === 0,
	});

	const onMainDataChangeRef = useRef(dataConfig.onMainDataChange);
	onMainDataChangeRef.current = dataConfig.onMainDataChange;

	useEffect(() => {
		reset();
	}, [filters, sorts]);

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

		// Clear loading states when query completes
		if (!isLoading) {
			if (isInitialMount && (data || probeData)) {
				setIsInitialMount(false);
			}
			if (isTransitionLoading) {
				setIsTransitionLoading(false);
			}
		}

		// Update previous query key
		prevQueryKeyRef.current = queryKey;
	}, [queryKey, isLoading, data, probeData, isInitialMount, isTransitionLoading]);

	// Calculate loading state
	const shouldShowLoading = isLoading || isInitialMount || isTransitionLoading;

	// Show empty page when no data exists (only when not loading and have definitive data)
	const showEmptyPage = useMemo(() => {
		if (shouldShowLoading || !data || !probeData) return false;
		return probeData.items.length === 0 && data.items.length === 0;
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

	const reservedMetadataKeys = useMemo(
		() => (queryConfig.metadataToggleQuickFilter ? [queryConfig.metadataToggleQuickFilter.metadataKey ?? 'org_type'] : undefined),
		[queryConfig.metadataToggleQuickFilter],
	);

	const queryBuilderPrependContent = (() => {
		const parts: ReactNode[] = [];

		if (queryConfig.metadataToggleQuickFilter) {
			parts.push(
				<MetadataToggleQuickFilter
					key='metadata-toggle-quick-filter'
					config={queryConfig.metadataToggleQuickFilter}
					filters={filters}
					setFilters={setFilters}
				/>,
			);
		}

		const prepend = queryConfig.queryBuilderPrepend;
		if (prepend) {
			parts.push(typeof prepend === 'function' ? prepend({ filters, setFilters }) : prepend);
		}

		return parts.length > 0 ? <div className='flex flex-wrap items-center gap-2'>{parts}</div> : undefined;
	})();

	return (
		<div>
			{/* Stable QueryBuilder - only show when we know data state (not during initial loading) */}
			{shouldShowQueryBuilder && (
				<QueryBuilderWrapper
					filterOptions={queryConfig.filterOptions}
					sortOptions={queryConfig.sortOptions}
					filters={filters}
					sorts={sorts}
					onFilterChange={setFilters}
					onSortChange={setSorts}
					prepend={queryBuilderPrependContent}
					reservedMetadataKeys={reservedMetadataKeys}
				/>
			)}

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
