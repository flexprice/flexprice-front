import { FC, useEffect, useMemo, useState } from 'react';
import { Sheet } from '@/components/atoms';
import { Event } from '@/models/Event';
import toast from 'react-hot-toast';
import EventsApi from '@/api/EventsApi';
import { GetEventDebugResponse } from '@/types/dto';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteNames } from '@/core/routes/Routes';
import { useNavigate } from 'react-router';
import SubscriptionApi from '@/api/SubscriptionApi';
import JsonCodeBlock from './JsonCodeBlock';
import ProcessedEventsSection from './ProcessedEventsSection';
import EventTrackerSection from './EventTrackerSection';
import IdempotencyKeySection from './IdempotencyKeySection';
import CustomerApi from '@/api/CustomerApi';
import FeatureApi from '@/api/FeatureApi';

interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	event: Event | null;
}

const EventPropertiesDrawer: FC<Props> = ({ isOpen, onOpenChange, event }) => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [debugResponse, setDebugResponse] = useState<GetEventDebugResponse | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
	const [featureNames, setFeatureNames] = useState<Record<string, string>>({});

	useEffect(() => {
		let isMounted = true;

		const run = async () => {
			if (!isOpen || !event?.id) return;
			setLoading(true);
			setLoadError(null);
			try {
				const res = await EventsApi.getEventDebug(event.id);
				if (!isMounted) return;
				setDebugResponse(res);
			} catch (e: any) {
				if (!isMounted) return;
				setDebugResponse(null);
				setLoadError(e?.message || 'Failed to load event debug details');
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		run();

		return () => {
			isMounted = false;
		};
	}, [isOpen, event?.id]);

	// Fallback to the table event while the debug payload loads
	const displayEvent = debugResponse?.event ?? event;
	const processedEvents = debugResponse?.processed_events ?? [];
	const resolvedCustomerId =
		processedEvents?.[0]?.customer_id ??
		(displayEvent?.customer_id && displayEvent.customer_id.trim().length > 0 ? displayEvent.customer_id : undefined) ??
		debugResponse?.debug_tracker?.customer_lookup?.customer?.id;

	// Fetch customer and feature names when processed events are available
	useEffect(() => {
		if (!processedEvents.length) return;

		const fetchNames = async () => {
			const customerIds = [...new Set(processedEvents.map((pe) => pe.customer_id).filter(Boolean))];
			const featureIds = [...new Set(processedEvents.map((pe) => pe.feature_id).filter(Boolean))];

			const customerPromises = customerIds.map(async (id) => {
				try {
					const customer = await CustomerApi.getCustomerById(id);
					return { id, name: customer.name };
				} catch {
					return { id, name: null };
				}
			});

			const featurePromises = featureIds.map(async (id) => {
				try {
					const feature = await FeatureApi.getFeatureById(id);
					return { id, name: feature.name };
				} catch {
					return { id, name: null };
				}
			});

			const [customerResults, featureResults] = await Promise.all([Promise.all(customerPromises), Promise.all(featurePromises)]);

			const customerMap: Record<string, string> = {};
			const featureMap: Record<string, string> = {};

			customerResults.forEach(({ id, name }) => {
				if (name) customerMap[id] = name;
			});

			featureResults.forEach(({ id, name }) => {
				if (name) featureMap[id] = name;
			});

			setCustomerNames(customerMap);
			setFeatureNames(featureMap);
		};

		fetchNames();
	}, [processedEvents]);

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
		<Sheet isOpen={isOpen} onOpenChange={onOpenChange} title='Event Details' size='2xl'>
			<div className='flex flex-col h-full'>
				<div className='space-y-6 px-6 pb-6 pt-4'>
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
							<p className='text-xs text-red-600 mt-1'>{loadError}</p>
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
						<JsonCodeBlock value={displayEvent} onCopy={handleCopyCode} />
					</div>
				</div>
			</div>
		</Sheet>
	);
};

export default EventPropertiesDrawer;
