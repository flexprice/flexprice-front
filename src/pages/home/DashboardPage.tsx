import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Page } from '@/components/atoms';
import { Skeleton } from '@/components/ui';
import EventsApi from '@/api/EventsApi';
import toast from 'react-hot-toast';
import { GetMonitoringDataRequest } from '@/types';
import { WindowSize } from '@/models';
import { TIME_PERIOD } from '@/constants/constants';
import {
	EventsMonitoringChart,
	DashboardControls,
	RecentSubscriptionsCard,
	// RevenueTrendCard,
	InvoiceIssuesCard,
	ApiDocsContent,
} from '@/components/molecules';
import { useRecentSubscriptions, /* useRevenueData, */ useInvoiceIssues } from '@/hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { AlertCircle } from 'lucide-react';
import { getTypographyClass } from '@/lib/typography';
import { useEnvironment } from '@/hooks/useEnvironment';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';

const getTimeRangeForPeriod = (period: TIME_PERIOD): { startDate: Date; endDate: Date } => {
	const endDate = new Date();
	let startDate = new Date();

	switch (period) {
		case TIME_PERIOD.LAST_HOUR:
			startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
			break;
		case TIME_PERIOD.LAST_DAY:
			startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
			break;
		case TIME_PERIOD.LAST_WEEK:
			startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
			break;
		case TIME_PERIOD.LAST_30_DAYS:
			startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
			break;
	}

	return { startDate, endDate };
};

const DashboardPage = () => {
	const { t } = useTranslation('common');
	const [timePeriod, setTimePeriod] = useState<TIME_PERIOD>(TIME_PERIOD.LAST_DAY);
	const [windowSize, setWindowSize] = useState<WindowSize>(WindowSize.HOUR);

	// Calculate date range based on selected time period
	const { startDate, endDate } = useMemo(() => {
		return getTimeRangeForPeriod(timePeriod);
	}, [timePeriod]);

	// Prepare Monitoring API parameters
	const monitoringApiParams: GetMonitoringDataRequest = useMemo(() => {
		const params: GetMonitoringDataRequest = {
			window_size: windowSize,
		};
		if (startDate) params.start_time = startDate.toISOString();
		if (endDate) params.end_time = endDate.toISOString();
		return params;
	}, [startDate, endDate, windowSize]);

	// Debounced API parameters with 300ms delay
	const [debouncedMonitoringParams, setDebouncedMonitoringParams] = useState<GetMonitoringDataRequest | null>(null);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setDebouncedMonitoringParams(monitoringApiParams);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [monitoringApiParams]);

	// Use reactive environment hook instead of static API call
	const { activeEnvironment } = useEnvironment();
	const environmentId = activeEnvironment?.id || null;

	const {
		data: monitoringData,
		isLoading: monitoringLoading,
		error: monitoringError,
	} = useQuery({
		queryKey: ['monitoring', 'dashboard', environmentId, debouncedMonitoringParams],
		queryFn: async () => {
			if (!debouncedMonitoringParams) {
				throw new Error('Monitoring API parameters not available');
			}
			return await EventsApi.getMonitoringData(debouncedMonitoringParams);
		},
		enabled: !!debouncedMonitoringParams && !!environmentId,
		refetchInterval: 30000, // Refetch every 30 seconds for real-time monitoring
		staleTime: 0, // No caching
		gcTime: 0, // No garbage collection time
		refetchOnWindowFocus: true,
		refetchOnMount: true,
	});

	useEffect(() => {
		if (monitoringError) {
			toast.error('Error fetching monitoring data');
		}
	}, [monitoringError]);

	// Use custom hooks for data fetching
	const { subscriptionsCount, subscriptionsByPlan, isLoading: subscriptionsLoading, error: subscriptionsError } = useRecentSubscriptions();
	// const { revenueData, isLoading: revenueLoading, error: revenueError } = useRevenueData();
	const { invoicesByStatus, isLoading: invoiceIssuesLoading, errors: invoiceErrors } = useInvoiceIssues();

	// Format "Updated just now" timestamp
	const getUpdatedTime = () => {
		return t('dashboardHome.updatedJustNow');
	};

	// Handle errors
	useEffect(() => {
		if (subscriptionsError) toast.error('Error fetching subscription data');
		// if (revenueError) toast.error('Error fetching revenue data');
		invoiceErrors.forEach(() => toast.error('Error fetching invoice data'));
	}, [subscriptionsError, /* revenueError, */ invoiceErrors]);

	// Skeleton loader for Events Monitoring Chart
	const EventsMonitoringChartSkeleton = () => (
		<Card className='shadow-sm'>
			<CardHeader className='pb-4'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
					<div className='space-y-2'>
						<Skeleton className='h-6 w-48' />
						<Skeleton className='h-4 w-64' />
					</div>
				</div>
			</CardHeader>
			<CardContent className='pt-0'>
				<Skeleton className='h-[300px] w-full' />
			</CardContent>
		</Card>
	);

	// Error state for Events Monitoring Chart
	const EventsMonitoringChartError = () => (
		<Card className='shadow-sm'>
			<CardHeader className='pb-4'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
					<div>
						<CardTitle className={getTypographyClass('section-title', 'font-medium')}>{t('dashboardHome.eventsMonitoring')}</CardTitle>
						<CardDescription className={getTypographyClass('helper-text', 'mt-1')}>
							{t('dashboardHome.eventsMonitoringDescription')}
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className='pt-0'>
				<div className='flex flex-col items-center justify-center py-12'>
					<AlertCircle className='h-10 w-10 text-red-500 mb-3' />
					<p className={getTypographyClass('body-default', 'text-zinc-600 text-center')}>{t('dashboardHome.monitoringLoadFailed')}</p>
				</div>
			</CardContent>
		</Card>
	);

	return (
		<Page
			heading={t('dashboardHome.pageTitle')}
			headingCTA={
				<DashboardControls
					timePeriod={timePeriod}
					windowSize={windowSize}
					onTimePeriodChange={setTimePeriod}
					onWindowSizeChange={setWindowSize}
				/>
			}>
			<ApiDocsContent tags={API_DOCS_TAGS.Events} />
			<div className='space-y-6'>
				{/* Events Monitoring Chart */}
				<div>
					{monitoringLoading ? (
						<EventsMonitoringChartSkeleton />
					) : monitoringError ? (
						<EventsMonitoringChartError />
					) : (
						monitoringData && (
							<EventsMonitoringChart
								data={monitoringData}
								title={t('dashboardHome.eventsMonitoring')}
								description={getUpdatedTime()}
								onViewLatestData={() => setTimePeriod(TIME_PERIOD.LAST_30_DAYS)}
							/>
						)
					)}
				</div>

				{/* Business Metrics Cards */}
				<div className='space-y-6 mt-6'>
					{/* Revenue Trend Card - Full Width - Only render if there's data, loading, or error */}
					{/* {(revenueData.length > 0 || revenueLoading || revenueError) && (
						<RevenueTrendCard revenueData={revenueData} isLoading={revenueLoading} error={revenueError} />
					)} */}

					{/* Recent Subscriptions and Invoice Payment Status - Side by Side */}
					<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
						<RecentSubscriptionsCard
							subscriptionsCount={subscriptionsCount}
							subscriptionsByPlan={subscriptionsByPlan}
							isLoading={subscriptionsLoading}
							error={subscriptionsError}
						/>

						<InvoiceIssuesCard invoicesByStatus={invoicesByStatus} isLoading={invoiceIssuesLoading} error={invoiceErrors.length > 0} />
					</div>
				</div>
			</div>
		</Page>
	);
};

export default DashboardPage;
