import { FC, useEffect, useMemo, useState } from 'react';
import { Sheet } from '@/components/atoms';
import { Event } from '@/models/Event';
import { Highlight, themes } from 'prism-react-renderer';
import { CheckCircle2, Copy, XCircle, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import EventsApi from '@/api/EventsApi';
import { DebugTrackerStatus, EventDebugStatus, GetEventDebugResponse, EventProcessedEvent } from '@/types/dto';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';
import { RouteNames } from '@/core/routes/Routes';
import { useNavigate } from 'react-router';
import SubscriptionApi from '@/api/SubscriptionApi';
import CustomerApi from '@/api/CustomerApi';
import FeatureApi from '@/api/FeatureApi';
import RedirectCell from '@/components/molecules/Table/RedirectCell';

interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	event: Event | null;
}

const JsonCodeBlock: FC<{ value: any; title?: string; onCopy?: () => void }> = ({ value, title, onCopy }) => {
	return (
		<div className='rounded-lg overflow-hidden border border-gray-200 bg-white'>
			{title ? (
				<div className='px-3 py-2 border-b border-gray-200 flex items-center justify-between'>
					<p className='text-xs font-medium text-slate-700'>{title}</p>
					{onCopy ? (
						<button onClick={onCopy} className='text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1'>
							<Copy size={14} />
							Copy
						</button>
					) : null}
				</div>
			) : null}
			<div className='relative'>
				<Highlight theme={themes.nightOwl} code={JSON.stringify(value ?? {}, null, 2)} language='json'>
					{({ className, style, tokens, getLineProps, getTokenProps }) => (
						<pre className={`${className} p-4 overflow-x-auto`} style={style}>
							{tokens.map((line, i) => (
								<div key={i} {...getLineProps({ line })}>
									{line.map((token, key) => (
										<span key={key} {...getTokenProps({ token })} className='text-sm font-normal font-fira-code' />
									))}
								</div>
							))}
						</pre>
					)}
				</Highlight>
			</div>
		</div>
	);
};

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

	const renderStepIcon = (status?: DebugTrackerStatus | EventDebugStatus) => {
		switch (status) {
			case 'processing':
				return <Circle className='h-5 w-5 text-blue-500' />;
			case 'failed':
				return <XCircle className='h-5 w-5 text-red-500' />;
			case 'found':
				return <CheckCircle2 className='h-5 w-5 text-emerald-500' />;
			case 'not_found':
				return <XCircle className='h-5 w-5 text-amber-500' />;
			case 'error':
				return <XCircle className='h-5 w-5 text-red-500' />;
			default:
				return <XCircle className='h-5 w-5 text-slate-300' />;
		}
	};

	const renderStepStatusText = (status?: DebugTrackerStatus | EventDebugStatus) => {
		switch (status) {
			case 'processing':
				return 'Processing';
			case 'failed':
				return 'Failed';
			case 'found':
				return 'Successful';
			case 'not_found':
				return 'Failed';
			case 'error':
				return 'Failed';
			default:
				return 'Skipped';
		}
	};

	const renderProcessedEvents = (items: EventProcessedEvent[]) => {
		return (
			<div className='rounded-lg border border-gray-200 bg-white'>
				<div className='px-4 py-3 border-b border-gray-200 flex items-start justify-between gap-3'>
					<div>
						<p className='text-sm font-medium text-foreground'>Processed Events</p>
					</div>
					<div className='shrink-0'>
						<span className='inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-medium'>
							{items.length} record{items.length === 1 ? '' : 's'}
						</span>
					</div>
				</div>

				<div className='p-4 space-y-3'>
					{items.map((pe, idx) => {
						const processedAt = pe.processed_at ? formatDateTimeWithSecondsAndTimezone(pe.processed_at) : null;

						return (
							<div key={`${pe.subscription_id}-${pe.sub_line_item_id}-${idx}`} className='rounded-md border border-gray-200 bg-white p-3'>
								<div className='flex items-start justify-between gap-3'>
									<p className='text-xs text-slate-500'>Processed Event #{idx + 1}</p>
									{processedAt ? <p className='text-xs text-slate-500 whitespace-nowrap'>{processedAt}</p> : null}
								</div>

								<dl className='mt-3 grid grid-cols-12 gap-x-2 gap-y-2'>
									<dt className='col-span-3 text-xs text-slate-500'>Customer</dt>
									<dd className='col-span-9 text-xs break-all'>
										{pe.customer_id ? (
											<RedirectCell redirectUrl={`${RouteNames.customers}/${pe.customer_id}`}>
												{customerNames[pe.customer_id] || pe.customer_id}
											</RedirectCell>
										) : (
											<span className='text-slate-500'>—</span>
										)}
									</dd>

									<dt className='col-span-3 text-xs text-slate-500'>Subscription</dt>
									<dd className='col-span-9 text-xs font-mono break-all'>
										{pe.customer_id ? (
											<RedirectCell redirectUrl={`${RouteNames.customers}/${pe.customer_id}/subscription/${pe.subscription_id}`}>
												{pe.subscription_id}
											</RedirectCell>
										) : (
											<button
												type='button'
												onClick={() => openSubscription(pe.subscription_id)}
												className='text-blue-600 hover:underline text-left'>
												{pe.subscription_id}
											</button>
										)}
									</dd>

									<dt className='col-span-3 text-xs text-slate-500'>Feature</dt>
									<dd className='col-span-9 text-xs font-mono break-all'>
										<RedirectCell redirectUrl={`${RouteNames.featureDetails}/${pe.feature_id}`}>
											{featureNames[pe.feature_id] || pe.feature_id}
										</RedirectCell>
									</dd>

									<dt className='col-span-3 text-xs text-slate-500'>Line item</dt>
									<dd className='col-span-9 text-xs font-mono text-slate-900 break-all'>{pe.sub_line_item_id}</dd>

									<dt className='col-span-3 text-xs text-slate-500'>Meter</dt>
									<dd className='col-span-9 text-xs font-mono text-slate-900 break-all'>{pe.meter_id}</dd>

									<dt className='col-span-3 text-xs text-slate-500'>Price</dt>
									<dd className='col-span-9 text-xs font-mono text-slate-900 break-all'>{pe.price_id}</dd>

									<dt className='col-span-3 text-xs text-slate-500'>Qty</dt>
									<dd className='col-span-9 text-xs font-mono text-slate-900 break-all'>{pe.qty_total}</dd>
								</dl>
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	const renderFailedTracker = () => {
		const t = debugResponse?.debug_tracker;
		const overallStatus = debugResponse?.status;

		const steps: Array<{
			key: 'customer_lookup' | 'meter_lookup' | 'price_lookup' | 'subscription_line_item_lookup';
			title: string;
			status?: DebugTrackerStatus | EventDebugStatus;
			value: any;
		}> = [
			{
				key: 'customer_lookup',
				title: 'Customer Lookup',
				status: t?.customer_lookup?.status ?? 'unprocessed',
				value: t?.customer_lookup ?? {},
			},
			{
				key: 'meter_lookup',
				title: 'Feature Lookup',
				status: t?.meter_matching?.status ?? 'unprocessed',
				value: t?.meter_matching ?? {},
			},
			{
				key: 'price_lookup',
				title: 'Price Lookup',
				status: t?.price_lookup?.status ?? 'unprocessed',
				value: t?.price_lookup ?? {},
			},
			{
				key: 'subscription_line_item_lookup',
				title: 'Subscription Line Item Lookup',
				status: t?.subscription_line_item_lookup?.status ?? 'unprocessed',
				value: t?.subscription_line_item_lookup ?? {},
			},
		];

		return (
			<div className='rounded-lg border border-gray-200 bg-white'>
				<div className='px-4 py-3 border-b border-gray-200'>
					<p className='text-sm font-medium text-foreground'>Event Tracker</p>
				</div>

				<div className='px-4 py-3'>
					{/* vertical waterfall line */}
					<div className='relative before:absolute before:left-3 before:top-6 before:bottom-6 before:w-px before:bg-slate-200 before:z-0'>
						{/* Ingested step (not expandable) */}
						<div className='grid grid-cols-[24px_1fr] gap-x-4 mb-3'>
							<div className='relative z-10 flex justify-center pt-0.5'>
								<div className='bg-white rounded-full p-0.5'>
									<CheckCircle2 className='h-5 w-5 text-emerald-500' />
								</div>
							</div>
							<div className='min-w-0'>
								<p className='text-sm text-foreground'>Ingested</p>
								{displayEvent?.timestamp ? <p className='text-xs text-slate-500 mt-1'>{displayEvent.timestamp}</p> : null}
							</div>
						</div>

						<Accordion type='single' collapsible className='border-none'>
							{steps.map((s) => (
								<AccordionItem key={s.key} value={s.key} className='border-b-0'>
									<AccordionTrigger className='py-3 hover:no-underline'>
										<div className='grid grid-cols-[24px_1fr] gap-x-4 w-full flex-1 pr-2'>
											<div className='relative z-10 flex justify-center pt-0.5'>
												<div className='bg-white rounded-full p-0.5'>{renderStepIcon(s.status)}</div>
											</div>
											<div className='min-w-0'>
												<p className='text-sm text-foreground'>{s.title}</p>
												<p
													className={cn('text-xs mt-1', {
														'text-emerald-600': s.status === 'found',
														'text-amber-600': s.status === 'not_found',
														'text-red-600': s.status === 'error',
														'text-slate-500': s.status === 'unprocessed' || !s.status,
													})}>
													{renderStepStatusText(s.status)}
												</p>
											</div>
										</div>
									</AccordionTrigger>
									<AccordionContent className='pl-0'>
										<div className='ml-[40px] relative z-10'>
											<JsonCodeBlock
												value={s.value}
												title='Response'
												onCopy={() => {
													navigator.clipboard.writeText(JSON.stringify(s.value ?? {}, null, 2));
													toast.success('Copied to clipboard!');
												}}
											/>
										</div>
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>

						{/* Attributed to Customer: status row only (no dropdown) */}
						<div className='grid grid-cols-[24px_1fr] gap-x-4 py-3'>
							<div className='relative z-10 flex justify-center pt-0.5'>
								<div className='bg-white rounded-full p-0.5'>
									{/* Always grey crossed for this row */}
									<XCircle className='h-5 w-5 text-slate-300' />
								</div>
							</div>
							<div className='min-w-0'>
								<p className='text-sm text-foreground'>Attributed to Customer</p>
								<p className='text-xs mt-1 text-slate-500'>{overallStatus === 'processing' ? 'Processing' : 'Failed'}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	// Important: don't conditionally skip hooks. Only conditionally skip rendering.
	if (!displayEvent) return null;

	return (
		<Sheet isOpen={isOpen} onOpenChange={onOpenChange} title='Event Details' size='lg'>
			<div className='flex flex-col h-full'>
				<div className='my-6 px-1 pb-8'>
					{/* Tracker / processed section should appear before the JSON */}
					{loading ? (
						<div className='space-y-3 mb-6'>
							<Skeleton className='h-5 w-40' />
							<Skeleton className='h-16 w-full' />
							<Skeleton className='h-16 w-full' />
						</div>
					) : loadError ? (
						<div className='mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3'>
							<p className='text-sm font-medium text-red-700'>Failed to load event debug details</p>
							<p className='text-xs text-red-600 mt-1'>{loadError}</p>
						</div>
					) : debugResponse ? (
						<div className='mb-6'>
							{/* Idempotency key header (if present) */}
							{displayEvent?.idempotency_key ? (
								<div className='mb-4'>
									<p className='text-xs text-slate-500'>Idempotency key</p>
									<p className='text-sm font-medium text-foreground break-all'>{displayEvent.idempotency_key}</p>
								</div>
							) : null}

							{/* Processed: show processed events only. Failed: show tracker waterfall. */}
							{showProcessedOnly ? (
								renderProcessedEvents(processedEvents)
							) : debugResponse.debug_tracker ? (
								renderFailedTracker()
							) : (
								<div className='rounded-lg border border-gray-200 bg-white px-4 py-3'>
									<p className='text-sm font-medium text-foreground'>Tracker</p>
									<p className='text-xs text-slate-500 mt-1'>No tracker data available for this event.</p>
								</div>
							)}
						</div>
					) : null}

					{/* Event details JSON */}
					<div className='mb-3'>
						<p className='text-sm font-medium text-foreground'>Data</p>
					</div>
					<JsonCodeBlock value={displayEvent} onCopy={handleCopyCode} />
				</div>
			</div>
		</Sheet>
	);
};

export default EventPropertiesDrawer;
