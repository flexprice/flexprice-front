import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button, Page } from '@/components/atoms';
import { EventsTable, ApiDocsContent, QueryBuilder } from '@/components/molecules';
import { Event } from '@/models/Event';
import EventsApi from '@/api/EventsApi';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
} from '@/types/common/QueryBuilder';
import useFilterSorting from '@/hooks/useFilterSorting';
import usePagination from '@/hooks/usePagination';
import { TypedBackendFilter } from '@/types/formatters/QueryBuilder';
import { GetEventsPayload } from '@/types/dto/Events';
import { logger } from '@/utils/common/Logger';

// Helper function to convert sanitized filters to Events API parameters
const convertFiltersToEventParams = (filters: TypedBackendFilter[]): Partial<GetEventsPayload> => {
	const params: Partial<GetEventsPayload> = {};

	filters.forEach((filter) => {
		switch (filter.field) {
			case 'event_id':
				if (filter.value.string) {
					params.event_id = filter.value.string;
				}
				break;
			case 'event_name':
				if (filter.value.string) {
					params.event_name = filter.value.string;
				}
				break;
			case 'external_customer_id':
				if (filter.value.string) {
					params.external_customer_id = filter.value.string;
				}
				break;
			case 'start_time':
				if (filter.value.date) {
					params.start_time = filter.value.date;
				}
				break;
			case 'end_time':
				if (filter.value.date) {
					params.end_time = filter.value.date;
				}
				break;
			case 'source':
				if (filter.value.string) {
					params.source = filter.value.string;
				}
				break;
		}
	});

	return params;
};

const sortingOptions: SortOption[] = [
	{
		field: 'name',
		label: 'Name',
		direction: SortDirection.ASC,
	},
	{
		field: 'email',
		label: 'Email',
		direction: SortDirection.ASC,
	},
	{
		field: 'created_at',
		label: 'Created At',
		direction: SortDirection.DESC,
	},
	{
		field: 'updated_at',
		label: 'Updated At',
		direction: SortDirection.DESC,
	},
];

const filterOptions: FilterField[] = [
	{
		field: 'event_id',
		label: 'EventID',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'event_name',
		label: 'Events Name',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'external_customer_id',
		label: 'External Customer ID',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'source',
		label: 'Source',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'start_time',
		label: 'Start Time',
		fieldType: FilterFieldType.DATEPICKER,
		operators: [FilterOperator.AFTER],
		dataType: DataType.DATE,
	},
	{
		field: 'end_time',
		label: 'End Time',
		fieldType: FilterFieldType.DATEPICKER,
		operators: [FilterOperator.BEFORE],
		dataType: DataType.DATE,
	},
];

const EventsPage: React.FC = () => {
	const { reset } = usePagination();
	const [events, setEvents] = useState<Event[]>([]);
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(false);
	const [iterLastKey, setIterLastKey] = useState<string | undefined>(undefined);
	const observer = useRef<IntersectionObserver | null>(null);

	const initialFilters = useMemo(() => {
		return [
			{
				field: 'event_id',
				operator: FilterOperator.EQUAL,
				valueString: '',
				dataType: DataType.STRING,
				id: 'initial-event-id',
			},
			{
				field: 'event_name',
				operator: FilterOperator.EQUAL,
				valueString: '',
				dataType: DataType.STRING,
				id: 'initial-event-name',
			},
			{
				field: 'external_customer_id',
				operator: FilterOperator.EQUAL,
				valueString: '',
				dataType: DataType.STRING,
				id: 'initial-customer-id',
			},
			{
				field: 'source',
				operator: FilterOperator.EQUAL,
				valueString: '',
				dataType: DataType.STRING,
				id: 'initial-source',
			},
			{
				field: 'start_time',
				operator: FilterOperator.AFTER,
				valueDate: new Date(new Date().setDate(new Date().getDate() - 30)),
				dataType: DataType.DATE,
				id: 'initial-start-time',
			},
		];
	}, []);

	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		initialFilters: initialFilters,
		initialSorts: [
			{
				field: 'updated_at',
				label: 'Updated At',
				direction: SortDirection.DESC,
			},
		],
		debounceTime: 300,
	});

	const lastElementRef = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(node: any) => {
			if (loading) return;
			if (observer.current) observer.current.disconnect();
			observer.current = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting && hasMore) {
					fetchEvents(iterLastKey);
				}
			});
			if (node) observer.current.observe(node);
		},
		[loading, hasMore],
	);

	// Convert sanitized filters to API parameters - only include parameters that are actually specified
	const apiParams = useMemo(() => {
		return convertFiltersToEventParams(sanitizedFilters);
	}, [sanitizedFilters]);

	// Fetch events from API
	const fetchEvents = useCallback(
		async (iterLastKey?: string) => {
			if (!hasMore || loading) return;
			setLoading(true);
			try {
				const response = await EventsApi.getRawEvents({
					iter_last_key: iterLastKey,
					page_size: 10,
					...apiParams,
				});

				if (response.events) {
					setEvents((prevEvents) => (iterLastKey ? [...prevEvents, ...response.events] : response.events));
					setIterLastKey(response.iter_last_key);
					setHasMore(response.has_more);
				}
			} catch (error) {
				logger.error('Error fetching events:', error);
			} finally {
				setLoading(false);
			}
		},
		[apiParams, hasMore, loading],
	);

	const refetchEvents = () => {
		setEvents([]);
		setIterLastKey(undefined);
		setHasMore(true);
		fetchEvents(undefined);
	};

	const resetFilters = () => {
		setFilters(initialFilters);
		refetchEvents();
	};

	// Reset pagination when filters change
	useEffect(() => {
		reset();
	}, [sanitizedFilters, sanitizedSorts]);

	// Refetch events when filters change
	useEffect(() => {
		setEvents([]);
		setIterLastKey(undefined);
		setHasMore(true);
		fetchEvents(undefined);
	}, [apiParams]);

	return (
		<Page heading='Events'>
			<ApiDocsContent tags={['Events']} />
			<div className='bg-white rounded-md flex items-start gap-4'>
				<QueryBuilder
					filterOptions={filterOptions}
					filters={filters}
					onFilterChange={setFilters}
					sortOptions={sortingOptions}
					onSortChange={setSorts}
					selectedSorts={sorts}
				/>
				<Button variant='outline' onClick={resetFilters}>
					<RefreshCw />
				</Button>
			</div>
			<div className='bg-white rounded-md '>
				<EventsTable data={events} />
				<div ref={lastElementRef} />
				{loading && (
					<div className='space-y-4 mt-4'>
						<Skeleton className='h-8 w-full' />
						<Skeleton className='h-8 w-full' />
						<Skeleton className='h-8 w-full' />
					</div>
				)}
				{!hasMore && events.length === 0 && <p className=' text-[#64748B] text-xs font-normal font-sans mt-4'>No events found</p>}
			</div>
		</Page>
	);
};

export default EventsPage;
