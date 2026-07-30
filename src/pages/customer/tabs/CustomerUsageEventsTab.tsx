import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Card } from '@/components/atoms';
import { EventsTable, QueryBuilder } from '@/components/molecules';
import { Event } from '@/models/Event';
import EventsApi from '@/api/EventsApi';
import CustomerApi from '@/api/CustomerApi';
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
import EmptyState from '@/components/customer-portal/EmptyState';
import { useTranslation } from 'react-i18next';

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

const CustomerUsageEventsTab = () => {
	const { t } = useTranslation('customers');
	const { t: tDev } = useTranslation('developers');
	const { id: customerId } = useParams();
	const { reset } = usePagination();
	const [events, setEvents] = useState<Event[]>([]);
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(false);
	const [iterLastKey, setIterLastKey] = useState<string | undefined>(undefined);
	const observer = useRef<IntersectionObserver | null>(null);

	const sortingOptions: SortOption[] = useMemo(
		() => [
			{
				field: 'created_at',
				label: tDev('events.queryBuilder.sort.createdAt'),
				direction: SortDirection.DESC,
			},
			{
				field: 'updated_at',
				label: tDev('events.queryBuilder.sort.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[tDev],
	);

	const filterOptions: FilterField[] = useMemo(
		() => [
			{
				field: 'event_id',
				label: tDev('events.queryBuilder.filters.eventId'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'event_name',
				label: tDev('events.queryBuilder.filters.eventName'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'source',
				label: tDev('events.queryBuilder.filters.source'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'start_time',
				label: tDev('events.queryBuilder.filters.startTime'),
				fieldType: FilterFieldType.DATEPICKER,
				operators: [FilterOperator.AFTER],
				dataType: DataType.DATE,
			},
			{
				field: 'end_time',
				label: tDev('events.queryBuilder.filters.endTime'),
				fieldType: FilterFieldType.DATEPICKER,
				operators: [FilterOperator.BEFORE],
				dataType: DataType.DATE,
			},
		],
		[tDev],
	);

	const { data: customer, isLoading: customerLoading } = useQuery({
		queryKey: ['fetchCustomerDetails', customerId],
		queryFn: () => CustomerApi.getCustomerById(customerId!),
		enabled: !!customerId,
	});

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

	const initialSorts: SortOption[] = useMemo(
		() => [
			{
				field: 'updated_at',
				label: tDev('events.queryBuilder.sort.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[tDev],
	);

	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		initialFilters: initialFilters,
		initialSorts,
		debounceTime: 300,
	});

	// Convert sanitized filters to API parameters and always include external_customer_id
	const apiParams = useMemo(() => {
		const paramsFromFilters = convertFiltersToEventParams(sanitizedFilters);
		return {
			...paramsFromFilters,
			external_customer_id: customer?.external_id,
		};
	}, [sanitizedFilters, customer?.external_id]);

	// Fetch events from API
	const fetchEvents = useCallback(
		async (iterLastKey?: string) => {
			if (!hasMore || loading || !customer?.external_id) return;
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
		[apiParams, hasMore, loading, customer?.external_id],
	);

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
		[loading, hasMore, iterLastKey, fetchEvents],
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
		if (!customer?.external_id) return;
		setEvents([]);
		setIterLastKey(undefined);
		setHasMore(true);
		fetchEvents(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [apiParams]);

	if (customerLoading) {
		return (
			<div className='space-y-6'>
				<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
					<div className='animate-pulse space-y-4'>
						<div className='h-10 bg-zinc-100 rounded' />
						<div className='h-12 bg-zinc-100 rounded' />
						<div className='h-12 bg-zinc-100 rounded' />
					</div>
				</Card>
			</div>
		);
	}

	if (!customer?.external_id) {
		return (
			<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
				<EmptyState title={t('tabPanels.usageEvents.loadErrorTitle')} description={t('tabPanels.usageEvents.loadErrorDescription')} />
			</Card>
		);
	}

	return (
		<>
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
				{!hasMore && events.length === 0 && (
					<p className=' text-[#64748B] text-xs font-normal font-sans mt-4'>{t('tabPanels.usageEvents.noEventsFound')}</p>
				)}
			</div>
		</>
	);
};

export default CustomerUsageEventsTab;
