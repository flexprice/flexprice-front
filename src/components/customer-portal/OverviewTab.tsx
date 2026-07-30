import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Card } from '@/components/atoms';
import { CustomerUsageChart } from '@/components/molecules';
import { WindowSize } from '@/models';
import { WALLET_STATUS } from '@/models/Wallet';
import { DashboardAnalyticsRequest } from '@/types';
import { formatAmount } from '@/components/atoms/Input/Input';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { Wallet as WalletIcon } from 'lucide-react';
import SubscriptionsSection from './SubscriptionsSection';
import UsageSection from './UsageSection';
import TimePeriodSelector from './TimePeriodSelector';
import { CustomerPortalTimePeriod, DEFAULT_TIME_PERIOD, calculateTimeRange } from './constants';

const CARD_CLASS = 'bg-white border border-[#E9E9E9] rounded-xl p-6';
const TITLE_TO_CONTENT_GAP = 'mb-4';

const OverviewSkeleton = () => (
	<div className='space-y-6'>
		{/* Subscriptions Skeleton */}
		<Card className={CARD_CLASS}>
			<div className='animate-pulse space-y-4'>
				<div className={`h-5 bg-zinc-100 rounded w-1/4 ${TITLE_TO_CONTENT_GAP}`}></div>
				<div className='h-20 bg-zinc-100 rounded'></div>
			</div>
		</Card>

		{/* Wallet Balance Skeleton */}
		<Card className={CARD_CLASS}>
			<div className='animate-pulse'>
				<div className={`h-10 bg-zinc-100 rounded w-1/3 ${TITLE_TO_CONTENT_GAP}`}></div>
				<div className='h-10 bg-zinc-100 rounded w-1/4'></div>
			</div>
		</Card>

		{/* Usage Chart Skeleton */}
		<Card className={CARD_CLASS}>
			<div className='animate-pulse'>
				<div className={`h-5 bg-zinc-100 rounded w-1/4 ${TITLE_TO_CONTENT_GAP}`}></div>
				<div className='h-48 bg-zinc-100 rounded'></div>
			</div>
		</Card>
	</div>
);

const OverviewTab = () => {
	const { t } = useTranslation('customer-portal');
	const [selectedPeriod, setSelectedPeriod] = useState<CustomerPortalTimePeriod>(DEFAULT_TIME_PERIOD);

	// Fetch subscriptions
	const {
		data: subscriptionsData,
		isLoading: subscriptionsLoading,
		isError: subscriptionsError,
	} = useQuery({
		queryKey: ['portal-subscriptions'],
		queryFn: () => CustomerPortalApi.getSubscriptions({ limit: 10, offset: 0 }),
	});

	// Fetch wallets
	const {
		data: wallets,
		isLoading: walletsLoading,
		isError: walletsError,
	} = useQuery({
		queryKey: ['portal-wallets'],
		queryFn: () => CustomerPortalApi.getWallets(),
	});

	// Get first wallet (prefer active, otherwise first available)
	const firstWallet = wallets?.find((w) => w.wallet_status === WALLET_STATUS.ACTIVE) || wallets?.[0];

	// Fetch usage summary
	const {
		data: usageData,
		isLoading: usageLoading,
		isError: usageError,
	} = useQuery({
		queryKey: ['portal-usage'],
		queryFn: () => CustomerPortalApi.getUsageSummary(),
	});

	// Prepare analytics params based on selected period
	const analyticsParams: DashboardAnalyticsRequest | null = useMemo(() => {
		const timeRange = calculateTimeRange(selectedPeriod);

		return {
			window_size: WindowSize.DAY,
			start_time: timeRange.start_time,
			end_time: timeRange.end_time,
		};
	}, [selectedPeriod]);

	// Fetch usage analytics for chart
	const { data: analyticsData, isError: analyticsError } = useQuery({
		queryKey: ['portal-analytics', analyticsParams],
		queryFn: () => CustomerPortalApi.getAnalytics(analyticsParams!),
		enabled: !!analyticsParams,
	});

	// Handle errors with toast
	useEffect(() => {
		if (subscriptionsError) {
			toast.error(t('errors.loadSubscriptions'));
		}
	}, [subscriptionsError, t]);

	useEffect(() => {
		if (usageError) {
			toast.error(t('errors.loadUsage'));
		}
	}, [usageError, t]);

	useEffect(() => {
		if (analyticsError) {
			toast.error(t('errors.loadUsageAnalytics'));
		}
	}, [analyticsError, t]);

	useEffect(() => {
		if (walletsError) {
			toast.error(t('errors.loadWallet'));
		}
	}, [walletsError, t]);

	const isLoading = subscriptionsLoading || walletsLoading || usageLoading;

	if (isLoading) {
		return <OverviewSkeleton />;
	}

	const subscriptions = subscriptionsData?.items || [];
	const usage = usageData?.features || [];
	const currencySymbol = getCurrencySymbol(firstWallet?.currency ?? 'USD');
	return (
		<div className='space-y-6'>
			{/* Wallet Balance */}
			{firstWallet && (
				<Card className={CARD_CLASS}>
					<div className={`flex items-center gap-3 ${TITLE_TO_CONTENT_GAP}`}>
						<div className='h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0'>
							<WalletIcon className='h-5 w-5 text-blue-600' />
						</div>
						<div>
							<h3 className='text-base font-medium text-zinc-950'>{firstWallet.name || t('wallet.defaultName')}</h3>
						</div>
					</div>
					<div>
						<span className='text-sm text-zinc-500 block mb-1.5'>{t('wallet.balance')}</span>
						<div className='flex items-baseline gap-2'>
							<span className='text-4xl font-semibold text-zinc-950'>{formatAmount(firstWallet.credit_balance?.toString() ?? '0')}</span>
							<span className='text-base font-normal text-zinc-500'>{t('wallet.credits')}</span>
						</div>
						<p className='text-sm text-zinc-500 mt-1.5'>
							{currencySymbol}
							{formatAmount(firstWallet.balance?.toString() ?? '0')} {t('wallet.valueSuffix')}
						</p>
					</div>
				</Card>
			)}

			{/* Active Subscriptions */}
			<SubscriptionsSection subscriptions={subscriptions} />
			{/* Usage Analytics Chart */}
			{analyticsData && (
				<Card className={CARD_CLASS}>
					<div className={`flex items-center justify-between ${TITLE_TO_CONTENT_GAP}`}>
						<h3 className='text-base font-medium text-zinc-950'>{t('usage.title')}</h3>
						<TimePeriodSelector selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />
					</div>
					<CustomerUsageChart data={analyticsData} />
				</Card>
			)}

			{/* Current Period Usage */}
			<UsageSection usageData={usage} />
		</div>
	);
};

export default OverviewTab;
