import { FC, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sheet } from '@/components/atoms';
import { Event } from '@/models/Event';
import toast from 'react-hot-toast';
import EventsApi from '@/api/EventsApi';
import { GetEventDebugResponse } from '@/types/dto';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteNames } from '@/core/routes/Routes';
import { useNavigate } from 'react-router';
import SubscriptionApi from '@/api/SubscriptionApi';
import CustomerApi from '@/api/CustomerApi';
import FeatureApi from '@/api/FeatureApi';
import JsonCodeBlock from './JsonCodeBlock';
import ProcessedEventsSection from './ProcessedEventsSection';
import EventTrackerSection from './EventTrackerSection';
import IdempotencyKeySection from './IdempotencyKeySection';

interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	event: Event | null;
}

const EventPropertiesDrawer: FC<Props> = ({ isOpen, onOpenChange, event }) => {
	const navigate = useNavigate();

	const {
		data: debugResponse,
		isLoading: loading,
		error: loadError,
	} = useQuery<GetEventDebugResponse, Error>({
		queryKey: ['eventDebug', event?.id],
		queryFn: () => EventsApi.getEventDebug(event!.id),
		enabled: isOpen && !!event?.id,
	});

	const displayEvent = debugResponse?.event ?? event;
	const processedEvents = debugResponse?.processed_events ?? [];
	const resolvedCustomerId =
		processedEvents?.[0]?.customer_id ??
		(displayEvent?.customer_id && displayEvent.customer_id.trim().length > 0 ? displayEvent.customer_id : undefined) ??
		debugResponse?.debug_tracker?.customer_lookup?.customer?.id;

	const customerIds = useMemo(
		() => [...new Set(processedEvents.map((pe) => pe.customer_id).filter(Boolean))] as string[],
		[processedEvents],
	);
	const featureIds = useMemo(() => [...new Set(processedEvents.map((pe) => pe.feature_id).filter(Boolean))] as string[], [processedEvents]);

	const { data: customerNames = {} } = useQuery({
		queryKey: ['eventCustomerNames', customerIds.slice().sort().join(',')],
		queryFn: async () => {
			const res = await CustomerApi.getCustomersByFilters({
				customer_ids: customerIds,
				filters: [],
				sort: [],
			});
			const map: Record<string, string> = {};
			res.items.forEach((c) => {
				map[c.id] = c.name;
			});
			return map;
		},
		enabled: customerIds.length > 0,
	});

	const { data: featureNames = {} } = useQuery({
		queryKey: ['eventFeatureNames', featureIds.slice().sort().join(',')],
		queryFn: async () => {
			const res = await FeatureApi.listFeatures({
				feature_ids: featureIds,
				limit: featureIds.length,
				offset: 0,
			});
			const map: Record<string, string> = {};
			res.items.forEach((f) => {
				map[f.id] = f.name;
			});
			return map;
		},
		enabled: featureIds.length > 0,
	});

	const openSubscription = async (subscriptionId: string) => {
		try {
			// If we already know the customerId, navigate directly
			if (resolvedCustomerId) {
				navigate(`${RouteNames.customers}/${resolvedCustomerId}/subscription/${subscriptionId}`);
				return;
			}

			// Otherwise, fetch subscription to discover customer_id
			const sub = await SubscriptionApi.getSubscription(subscriptionId);
			if (sub?.customer_id) {
				navigate(`${RouteNames.customers}/${sub.customer_id}/subscription/${subscriptionId}`);
				return;
			}

			toast.error('Could not resolve customer for this subscription');
		} catch (e: any) {
			toast.error(e?.message || 'Failed to open subscription');
		}
	};

	const handleCopyCode = () => {
		if (!displayEvent) return;
		navigator.clipboard.writeText(JSON.stringify(displayEvent, null, 2));
		toast.success('Properties copied to clipboard!');
	};

	const showProcessedOnly = useMemo(() => processedEvents.length > 0, [processedEvents.length]);

	// Important: don't conditionally skip hooks. Only conditionally skip rendering.
	if (!displayEvent) return null;

	return (
		<Sheet isOpen={isOpen} onOpenChange={onOpenChange} title={showProcessedOnly ? 'Processed Events' : 'Event Details'} size='2xl'>
			<div className='flex flex-col h-full'>
				<div className='space-y-6 px-6 pb-6 pt-0'>
					{/* Tracker / processed section should appear before the JSON */}
					{loading ? (
						<div className='space-y-3'>
							<Skeleton className='h-4 w-40' />
							<Skeleton className='h-20 w-full' />
							<Skeleton className='h-20 w-full' />
						</div>
					) : loadError ? (
						<div className='rounded-lg border border-red-200 bg-red-50 px-4 py-3'>
							<p className='text-sm font-medium text-red-700'>Failed to load event debug details</p>
							<p className='text-xs text-red-600 mt-1'>{loadError.message || String(loadError)}</p>
						</div>
					) : debugResponse ? (
						<div className='space-y-6'>
							{/* Idempotency key header (if present) */}
							{displayEvent?.idempotency_key && <IdempotencyKeySection idempotencyKey={displayEvent.idempotency_key} />}

							{/* Processed: show processed events only. Failed: show tracker waterfall. */}
							{showProcessedOnly ? (
								<ProcessedEventsSection
									events={processedEvents}
									onOpenSubscription={openSubscription}
									customerNames={customerNames}
									featureNames={featureNames}
								/>
							) : debugResponse.debug_tracker ? (
								<EventTrackerSection debugResponse={debugResponse} displayEventTimestamp={displayEvent?.timestamp} />
							) : (
								<p className='text-sm text-slate-500'>No tracker data available for this event.</p>
							)}
						</div>
					) : null}

					{/* Event details JSON */}
					<div className='space-y-3'>
						<JsonCodeBlock value={displayEvent} title='Event Details' onCopy={handleCopyCode} />
					</div>
				</div>
			</div>
		</Sheet>
	);
};

export default EventPropertiesDrawer;
