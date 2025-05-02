/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, DateRangePicker, Input, Page } from '@/components/atoms';
import { EventsTable, ApiDocsContent } from '@/components/molecules';
import { Event } from '@/models/Event';
import EventsApi from '@/api/EventsApi';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Search } from 'lucide-react';

const getNext24HoursDate = (date: Date): Date => {
	const nextDate = new Date(date);
	nextDate.setHours(nextDate.getHours() + 23);
	nextDate.setMinutes(nextDate.getMinutes() + 59);
	return nextDate;
};

const EventsPage: React.FC = () => {
	const [events, setEvents] = useState<Event[]>([]);
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(false);
	const [queryData, setQueryData] = useState<{
		startTime?: string;
		endTime?: string;
		externalCustomerId?: string;
		eventName?: string;
		eventId?: string;
	}>({
		startTime: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
		endTime: new Date().toISOString(),
	});
	const [iterLastKey, setIterLastKey] = useState<string | undefined>(undefined);
	const observer = useRef<IntersectionObserver | null>(null);

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

	// Fetch events from API
	const fetchEvents = useCallback(
		async (iterLastKey?: string) => {
			if (!hasMore || loading) return;
			setLoading(true);
			try {
				const response = await EventsApi.getRawEvents({
					iter_last_key: iterLastKey,
					page_size: 10,
					start_time: queryData?.startTime,
					end_time: queryData?.endTime,
					external_customer_id: queryData?.externalCustomerId,
					event_name: queryData?.eventName,
					event_id: queryData?.eventId,
				});
				setEvents((prev) => [...prev, ...(response.events as Event[])]);
				setHasMore(response.has_more);
				setIterLastKey(response.iter_last_key);
			} catch (error) {
				console.error('Error fetching events:', error);
			} finally {
				setLoading(false);
			}
		},
		[queryData, iterLastKey, hasMore, loading],
	);

	const refetchEvents = () => {
		setEvents([]);
		setIterLastKey(undefined);
		setHasMore(true);
		fetchEvents(undefined);
	};

	useEffect(() => {
		setEvents([]);
		setIterLastKey(undefined);
		setHasMore(true);
		if (!!queryData.startTime && !!queryData.endTime) {
			refetchEvents();
		}
	}, [queryData]);

	// Refetch all events

	return (
		<Page heading='Events'>
			<ApiDocsContent tags={['Events']} />

			<div className='bg-white my-6 rounded-md  mb-6'>
				<div className='w-full flex items-end gap-4'>
					<DateRangePicker
						startDate={queryData.startTime ? new Date(queryData.startTime) : undefined}
						endDate={queryData.endTime ? new Date(queryData.endTime) : undefined}
						title='Time Period'
						placeholder='Select Range'
						onChange={({ endDate, startDate }) => {
							if (!startDate && endDate) {
								startDate = endDate;
							} else if (startDate && !endDate) {
								endDate = startDate;
							}
							setQueryData((prev) => ({
								...prev,
								startTime: startDate?.toISOString(),
								endTime: endDate ? getNext24HoursDate(new Date(endDate!)).toISOString() : undefined,
							}));
						}}
					/>

					<Input
						label='External Customer ID'
						placeholder='Enter External Customer ID'
						className='h-9'
						suffix={<Search className='size-4' />}
						labelClassName='text-muted-foreground font-normal'
						value={queryData?.externalCustomerId ?? ''}
						onChange={(e) => setQueryData((prev) => ({ ...prev, externalCustomerId: e === '' ? undefined : e }))}
					/>
					{/* <Input
						label=' Meter name'
						suffix={<Search className='size-4' />}
						placeholder='Enter Meter name'
						className='h-9'
						labelClassName='text-muted-foreground font-normal'
						value={queryData?.eventId ?? ''}
						onChange={(e) => setQueryData((prev) => ({ ...prev, eventId: e === '' ? undefined : e }))}
					/> */}
					<Input
						label='Event Name'
						suffix={<Search className='size-4' />}
						placeholder='Enter Event Name'
						className='h-9'
						labelClassName='text-muted-foreground font-normal'
						value={queryData?.eventName ?? ''}
						onChange={(e) => setQueryData((prev) => ({ ...prev, eventName: e === '' ? undefined : e }))}
					/>
					<Input
						label='Event ID'
						suffix={<Search className='size-4' />}
						placeholder='Enter Event Id'
						className='h-9'
						labelClassName='text-muted-foreground font-normal'
						value={queryData?.eventId ?? ''}
						onChange={(e) => setQueryData((prev) => ({ ...prev, eventId: e === '' ? undefined : e }))}
					/>
					<Button
						variant='outline'
						onClick={() => {
							setQueryData({
								startTime: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
								endTime: new Date().toISOString(),
							});
							setIterLastKey(undefined);
							setEvents([]);
							setHasMore(true);

							fetchEvents(undefined);
						}}>
						<RefreshCw />
					</Button>
				</div>
			</div>

			<div className='bg-white p-4 rounded-md '>
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
