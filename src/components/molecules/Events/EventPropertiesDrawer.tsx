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
import { useTranslation } from 'react-i18next';

interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	event: Event | null;
}

const EventPropertiesDrawer: FC<Props> = ({ isOpen, onOpenChange, event }) => {
	const { t } = useTranslation(['developers', 'common']);
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
	const processedEvents = useMemo(() => debugResponse?.processed_events ?? [], [debugResponse]);
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
			if (resolvedCustomerId) {
				navigate(`${RouteNames.customers}/${resolvedCustomerId}/subscription/${subscriptionId}`);
				return;
			}

			const sub = await SubscriptionApi.getSubscription(subscriptionId);
			if (sub?.customer_id) {
				navigate(`${RouteNames.customers}/${sub.customer_id}/subscription/${subscriptionId}`);
				return;
			}

			toast.error(t('events.debugger.couldNotResolveCustomer'));
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : t('events.debugger.openSubscriptionFailed'));
		}
	};

	const handleCopyCode = () => {
		if (!displayEvent) return;
		navigator.clipboard.writeText(JSON.stringify(displayEvent, null, 2));
		toast.success(t('events.debugger.propertiesCopied'));
	};

	const showProcessedOnly = useMemo(() => processedEvents.length > 0, [processedEvents.length]);

	const sheetTitle = showProcessedOnly ? t('events.debugger.processedEventsTitle') : t('events.debugger.eventDetailsTitle');

	if (!displayEvent) return null;

	return (
		<Sheet isOpen={isOpen} onOpenChange={onOpenChange} title={sheetTitle} size='2xl'>
			<div className='flex flex-col h-full'>
				<div className='space-y-6 px-6 pb-6 pt-0'>
					{loading ? (
						<div className='space-y-3'>
							<Skeleton className='h-4 w-40' />
							<Skeleton className='h-20 w-full' />
							<Skeleton className='h-20 w-full' />
						</div>
					) : loadError ? (
						<div className='rounded-lg border border-red-200 bg-red-50 px-4 py-3'>
							<p className='text-sm font-medium text-red-700'>{t('events.debugger.loadFailedTitle')}</p>
							<p className='text-xs text-red-600 mt-1'>{loadError.message || String(loadError)}</p>
						</div>
					) : debugResponse ? (
						<div className='space-y-6'>
							{displayEvent?.idempotency_key && <IdempotencyKeySection idempotencyKey={displayEvent.idempotency_key} />}

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
								<p className='text-sm text-slate-500'>{t('events.debugger.noTrackerData')}</p>
							)}
						</div>
					) : null}

					<div className='space-y-3'>
						<JsonCodeBlock value={displayEvent} title={t('labels.eventDetails')} onCopy={handleCopyCode} />
					</div>
				</div>
			</div>
		</Sheet>
	);
};

export default EventPropertiesDrawer;
