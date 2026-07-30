import { Button } from '@/components/ui';
import { Loader2, Rocket, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import useEnvironment from '@/hooks/useEnvironment';
import { useQuery } from '@tanstack/react-query';
import CustomerApi from '@/api/CustomerApi';
import { Link, useNavigate } from 'react-router';
import { Progress } from '@/components/ui';
import { RouteNames } from '@/core/routes/Routes';
import EventsApi from '@/api/EventsApi';
import { getCommandPaletteActionEventName, CommandPaletteActionId } from '@/core/actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { AddButton } from '@/components/atoms';
import { useLocaleStore } from '@/store/useLocaleStore';
import { Direction } from '@/config/branding';

const TOTAL_EVENTS = 60;
const STREAM_DURATION = TOTAL_EVENTS * 1000;

const DebugMenu = () => {
	const { t } = useTranslation('settings');
	const [isOpen, setIsOpen] = useState(false);
	const { isDevelopment, activeEnvironment } = useEnvironment();
	const direction = useLocaleStore((s) => s.direction);
	const isRTL = direction === Direction.RTL;
	const anchorClass = isRTL ? 'left-6' : 'right-6';
	const [isStreaming, setIsStreaming] = useState(false);
	const [progress, setProgress] = useState(0);
	const [eventsCompleted, setEventsCompleted] = useState(false);
	const [eventCount, setEventCount] = useState(0);
	const navigate = useNavigate();

	const eventsScale = 5;
	const totalTriggered = TOTAL_EVENTS * eventsScale;

	const {
		data: customerData,
		isLoading: isCustomerLoading,
		refetch: refetchCustomer,
	} = useQuery({
		queryKey: ['debug-customers', activeEnvironment?.id],
		queryFn: async () => {
			return await CustomerApi.getAllCustomers({ limit: 1, offset: 0 });
		},
		enabled: isDevelopment,
	});

	const {
		data: subscriptions,
		isLoading: isSubscriptionLoading,
		refetch: refetchSubscription,
	} = useQuery({
		queryKey: ['debug-subscriptions', customerData?.items[0]?.id, activeEnvironment?.id],
		queryFn: async () => await CustomerApi.getCustomerSubscriptions(customerData?.items[0]?.id || ''),
		enabled: !!customerData?.items[0]?.id && isDevelopment,
	});

	useEffect(() => {
		refetchCustomer();
		refetchSubscription();
	}, [isDevelopment, activeEnvironment?.id, refetchCustomer, refetchSubscription]);

	useEffect(() => {
		if (!isStreaming) return;

		const startTime = Date.now();
		const simulationInterval = setInterval(() => {
			const elapsed = Date.now() - startTime;
			const currentProgress = Math.min((elapsed / STREAM_DURATION) * 100, 100);
			setProgress(currentProgress);

			const expectedEvents = Math.floor((currentProgress / 100) * TOTAL_EVENTS);
			setEventCount(expectedEvents);

			if (elapsed >= STREAM_DURATION) {
				clearInterval(simulationInterval);
				setIsStreaming(false);
				setEventsCompleted(true);
				setEventCount(TOTAL_EVENTS);
				setIsOpen(true);
			}
		}, 100);

		return () => {
			clearInterval(simulationInterval);
		};
	}, [isStreaming]);

	const handleStartStreaming = () => {
		if (!subscriptions?.items?.[0]?.id) return;
		setIsStreaming(true);
		setProgress(0);
		setEventsCompleted(false);
		setEventCount(0);
		EventsApi.fireEvents({
			subscription_id: subscriptions.items?.[0]?.id || '',
			duration: STREAM_DURATION / 1000,
		});
	};

	const handleStartStreamingRef = useRef(handleStartStreaming);
	handleStartStreamingRef.current = handleStartStreaming;

	useEffect(() => {
		const eventName = getCommandPaletteActionEventName(CommandPaletteActionId.DebugSimulateIngestEvents);
		const handler = () => {
			handleStartStreamingRef.current();
			setIsOpen(true);
		};
		window.addEventListener(eventName, handler);
		return () => window.removeEventListener(eventName, handler);
	}, []);

	const handleClose = () => {
		setIsOpen(false);
	};

	const handleCreateCustomer = () => {
		navigate(`${RouteNames.customers}`);
	};

	const handleCreateSubscription = () => {
		if (customerData?.items?.[0]?.id) {
			navigate(`${RouteNames.customers}/${customerData.items?.[0]?.id}/add-subscription`);
		}
	};

	const isLoading = isCustomerLoading || isSubscriptionLoading;
	const hasCustomer = !!customerData?.items?.length;
	const hasSubscription = !!subscriptions?.items?.length;

	const custId = customerData?.items?.[0]?.id;
	const custName = customerData?.items?.[0]?.name;
	const planName = subscriptions?.items?.[0]?.plan?.name;
	const subscriptionId = subscriptions?.items?.[0]?.id;

	if (!isDevelopment) {
		return null;
	}

	return (
		<>
			<TooltipProvider delayDuration={0}>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant='outline'
							className={`fixed bottom-6 ${anchorClass} size-10 z-[100] shadow-sm hover:shadow-md transition-all bg-white`}
							onClick={() => setIsOpen(!isOpen)}>
							{isStreaming ? (
								<div className='relative'>
									<Rocket className='text-blue-500 size-8 text-3xl' />
									<div className='absolute -top-2 -right-2 size-3 bg-blue-500 rounded-full animate-pulse' />
								</div>
							) : (
								<Rocket className='text-blue-500 size-8 text-3xl' />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent
						side='top'
						align='end'
						sideOffset={8}
						className='flex flex-col gap-1 bg-black/90 text-white px-4 py-2 rounded-lg max-w-[240px]'>
						<div className='text-[13px] text-white'>{t('debug.tooltipTitle')}</div>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95, x: isRTL ? -20 : 20 }}
						animate={{ opacity: 1, scale: 1, x: 0 }}
						exit={{ opacity: 0, scale: 0.95, x: isRTL ? -20 : 20 }}
						transition={{
							type: 'spring',
							stiffness: 300,
							damping: 25,
							duration: 0.3,
						}}
						className={`fixed bottom-6 ${anchorClass} w-[300px] bg-white/95 dark:bg-gray-900/95 rounded-lg shadow-lg z-[100] border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm`}
						drag
						dragConstraints={{
							top: -400,
							left: isRTL ? 0 : -600,
							right: isRTL ? 600 : 0,
							bottom: 0,
						}}
						dragElastic={0.1}
						dragMomentum={false}>
						<div className='p-5'>
							<div className='flex items-center justify-between mb-4'>
								<h2 className='text-base font-semibold'>
									{eventsCompleted ? t('debug.sampleEventsCreated') : isLoading ? t('debug.loading') : t('debug.titleStreamSamples')}
								</h2>
								<Button variant='ghost' size='sm' className='size-6 p-0 opacity-60 hover:opacity-100' onClick={handleClose}>
									<X className='size-3' />
								</Button>
							</div>

							{isLoading ? (
								<div className='flex items-center justify-center py-4'>
									<Loader2 className='animate-spin size-5' />
								</div>
							) : !hasCustomer ? (
								<div className='space-y-3'>
									<p className='text-sm text-muted-foreground'>{t('debug.noCustomers')}</p>
									<AddButton onClick={handleCreateCustomer} className='w-full' />
								</div>
							) : !hasSubscription ? (
								<div className='space-y-5'>
									<p className='text-sm text-muted-foreground leading-6'>
										{t('debug.needSubscriptionLead')}{' '}
										<Link to={`${RouteNames.customers}/${custId}`} className='text-blue-500'>
											{custName}
										</Link>
									</p>
									<AddButton onClick={handleCreateSubscription} className='w-full !mt-6' />
								</div>
							) : eventsCompleted ? (
								<>
									<p className='text-sm text-muted-foreground mb-4'>
										{t('debug.eventsFiredSentence', { count: eventCount * eventsScale })}
										<Link to={`${RouteNames.customers}/${custId}`} className='text-blue-500'>
											{` ${custName} `}
										</Link>
										{t('debug.eventsFiredMiddle')}
										<Link to={`${RouteNames.customers}/${custId}/subscription/${subscriptionId}`} className='text-blue-500'>
											{` ${planName} `}
										</Link>
										{t('debug.eventsFiredTrailing')}
									</p>
									<div className='flex gap-2'>
										<Link to={RouteNames.events} className='flex-1'>
											<Button variant='outline' size='sm' className='w-full'>
												{t('debug.viewEvents')}
											</Button>
										</Link>
										<Button variant='outline' size='sm' className='flex-1' onClick={handleStartStreaming}>
											{t('debug.streamAgain')}
										</Button>
									</div>
								</>
							) : (
								<>
									<p className='text-sm text-muted-foreground mb-4'>
										{t('debug.streamIntro')}
										<Link to={`${RouteNames.customers}/${custId}`} className='text-blue-500'>
											{` ${custName} `}
										</Link>
										{t('debug.planBridge')}
										<Link to={`${RouteNames.customers}/${custId}/subscription/${subscriptionId}`} className='text-blue-500'>
											{` ${planName} `}
										</Link>
										{t('debug.planEnd')}
									</p>

									{isStreaming && (
										<div className='mb-4'>
											<Progress value={progress} className='h-1' />
											<p className='text-xs text-muted-foreground mt-2 text-center'>
												{t('debug.progress', { current: eventCount * eventsScale, total: totalTriggered })}
											</p>
										</div>
									)}

									<Button
										className='w-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow transition-all duration-200'
										size='sm'
										onClick={handleStartStreaming}
										disabled={isLoading || isStreaming}>
										{isStreaming ? <Loader2 className='me-2 size-3.5 animate-spin' /> : <Rocket className='me-2 size-3.5' />}
										{isLoading ? t('debug.loading') : isStreaming ? t('debug.streaming') : t('debug.startStreaming')}
									</Button>
								</>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
};

export default DebugMenu;
