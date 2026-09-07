import { lazy, Suspense } from 'react';
import { TabConfig, UsageGraphConfig } from '@/types/dto/PortalConfig';
import { DashboardAnalyticsRequest } from '@/types';
import { SubscriptionResponse } from '@/types/dto/Subscription';
import { CustomerUsage } from '@/models';
import { Loader } from '@/components/atoms';

// Lazy-load widgets — unused widgets don't bloat the bundle.
const SubscriptionsWidget = lazy(() => import('./widgets/SubscriptionsWidget'));
const UsageQuotaContainer = lazy(() => import('@/usage/containers/UsageQuotaContainer'));
const UsageTrendChartContainer = lazy(() => import('@/usage/containers/UsageTrendChartContainer'));
const UsageBreakdownContainer = lazy(() => import('@/usage/containers/UsageBreakdownContainer'));
const InvoicesWidget = lazy(() => import('./widgets/InvoicesWidget'));
const CreditBalanceContainer = lazy(() => import('@/credits/containers/CreditBalanceContainer'));
const CreditHistoryContainer = lazy(() => import('@/credits/containers/CreditHistoryContainer'));
const MetricCardsContainer = lazy(() => import('@/usage/containers/MetricCardsContainer'));
const TopUpWidget = lazy(() => import('./widgets/TopUpWidget'));
const TopUpButton = lazy(() => import('./widgets/TopUpButton'));
const AutoTopUpWidget = lazy(() => import('./widgets/AutoTopUpWidget'));
const PaymentMethodsWidget = lazy(() => import('./widgets/PaymentMethodsWidget'));
const WalletActionsHeader = lazy(() => import('./widgets/WalletActionsHeader'));
const AccountSummaryWidget = lazy(() => import('./widgets/AccountSummaryWidget'));

const FallbackLoader = () => (
	<div className='py-12'>
		<Loader />
	</div>
);

// Exported so SectionContent can fall back to the same defaults when a section has a
// metric_cards tab but no usage_graph tab to source date-filter config from.
export const DEFAULT_USAGE_GRAPH_CONFIG: UsageGraphConfig = {
	date_presets: ['last_7_days', 'last_30_days'],
	default_preset: 'last_7_days',
	allow_custom_date_range: false,
	feature_filter_mode: 'all',
};

interface TabRendererProps {
	tab: TabConfig;
	subscriptions?: SubscriptionResponse[];
	usageData?: CustomerUsage[];
	/**
	 * Resolved analytics params from SectionContent.
	 * Shared across all analytics widgets (metric_cards, usage_graph)
	 * so they hit the same React Query cache entry — zero duplicate API calls.
	 */
	analyticsParams: DashboardAnalyticsRequest;
}

/**
 * Maps tab.type to the correct lazily-loaded widget.
 * analyticsParams is always passed from SectionContent (which owns the date filter state).
 */
/** "Aug 26 – Sep 1" for the window the analytics widgets are showing. */
const formatPeriod = (start?: string, end?: string): string | undefined => {
	if (!start || !end) return undefined;
	// Not formatDateShort: it pins 'en-US', which would print English dates inside
	// the Arabic portal. undefined defers to the runtime locale.
	const short = (value: string) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	return `${short(start)} – ${short(end)}`;
};

const TabRenderer = ({ tab, subscriptions = [], usageData, analyticsParams }: TabRendererProps) => {
	const period = formatPeriod(analyticsParams?.start_time, analyticsParams?.end_time);

	return (
		<Suspense fallback={<FallbackLoader />}>
			{tab.type === 'subscriptions' && <SubscriptionsWidget subscriptions={subscriptions} label={tab.label} />}
			{tab.type === 'current_usage' && <UsageQuotaContainer usageData={usageData} label={tab.label} />}
			{tab.type === 'usage_graph' && (
				<UsageTrendChartContainer
					config={tab.usage_graph ?? DEFAULT_USAGE_GRAPH_CONFIG}
					analyticsParams={analyticsParams}
					label={tab.label}
					periodLabel={period}
				/>
			)}
			{tab.type === 'usage_breakdown' && <UsageBreakdownContainer analyticsParams={analyticsParams} label={tab.label} />}
			{tab.type === 'invoices' && <InvoicesWidget />}
			{tab.type === 'account_summary' && <AccountSummaryWidget label={tab.label} />}
			{/* Top up leads, in the header beside the wallet's name; the menu drops to the
			    balance row so the primary action is the first thing read. */}
			{tab.type === 'wallet_balance' && <CreditBalanceContainer actions={<TopUpButton />} balanceAction={<WalletActionsHeader />} />}
			{tab.type === 'wallet_transactions' && <CreditHistoryContainer />}
			{tab.type === 'wallet_topup' && <TopUpWidget label={tab.label} />}
			{tab.type === 'auto_topup' && <AutoTopUpWidget label={tab.label} />}
			{tab.type === 'payment_methods' && <PaymentMethodsWidget label={tab.label} />}
			{tab.type === 'metric_cards' && <MetricCardsContainer analyticsParams={analyticsParams} config={tab.metric_cards} />}
		</Suspense>
	);
};

export default TabRenderer;
