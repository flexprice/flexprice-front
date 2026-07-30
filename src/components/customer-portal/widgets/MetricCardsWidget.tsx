import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { CustomAnalyticItem } from '@/types/dto/Events';
import { DashboardAnalyticsRequest } from '@/types';
import { MetricCardsConfig } from '@/types/dto/PortalConfig';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCard } from '@/components/molecules';
import { usePortalConfig } from '@/context/PortalConfigContext';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MetricCardsWidgetProps {
	analyticsParams: DashboardAnalyticsRequest;
	/** Controls which sub-groups are shown. Defaults to both true if absent. */
	config?: MetricCardsConfig;
}

const DEFAULT_CONFIG: MetricCardsConfig = {
	show_custom_metrics: true,
	show_revenue_metric: true,
	show_cost_metrics: true,
};

/**
 * Renders three optional card groups in one flat auto-fill grid row:
 *   1. Revenue metric     — Revenue from cost analytics API
 *   2. Cost metrics       — Cost / Margin / Margin % from cost analytics API
 *   3. Custom metrics     — from revenue analytics custom_analytics[]
 *
 * Uses the same MetricCard molecule as the admin CostAnalytics page.
 * auto-fill grid ensures all cards sit on one line at full width.
 */
const MetricCardsWidget = ({ analyticsParams, config }: MetricCardsWidgetProps) => {
	const { t } = useTranslation('customer-portal');
	const mergedConfig: MetricCardsConfig = { ...DEFAULT_CONFIG, ...config };
	const { show_custom_metrics: showCustom, show_revenue_metric: showRevenue, show_cost_metrics: showCost } = mergedConfig;
	const { config: portalConfig } = usePortalConfig();
	const hasTheme = !!portalConfig.theme;

	// ── Revenue analytics (custom_analytics[]) ───────────────────────────────
	const {
		data: analyticsData,
		isLoading: analyticsLoading,
		isError: analyticsError,
	} = useQuery({
		queryKey: ['portal-analytics', analyticsParams],
		queryFn: () => CustomerPortalApi.getAnalytics(analyticsParams),
		enabled: showCustom,
	});

	// ── Cost analytics (Revenue / Cost / Margin / Margin %) ──────────────────
	const {
		data: costData,
		isLoading: costLoading,
		isError: costError,
	} = useQuery({
		queryKey: ['portal-cost-analytics', analyticsParams.start_time, analyticsParams.end_time],
		queryFn: () =>
			CustomerPortalApi.getCostAnalytics({
				start_time: analyticsParams.start_time,
				end_time: analyticsParams.end_time,
				expand: ['meter', 'price'],
			}),
		enabled: showRevenue || showCost,
	});

	useEffect(() => {
		if (analyticsError) toast.error(t('errors.loadAnalytics'));
	}, [analyticsError, t]);

	useEffect(() => {
		if (costError) toast.error(t('errors.loadCostAnalytics'));
	}, [costError, t]);

	const customItems: CustomAnalyticItem[] = analyticsData?.custom_analytics ?? [];
	const isLoading = (showCustom && analyticsLoading) || ((showRevenue || showCost) && costLoading);

	if (isLoading) {
		const revenueCount = showRevenue ? 1 : 0;
		const costCount = showCost ? 3 : 0;
		const customCount = showCustom ? 2 : 0;
		const skeletonCount = revenueCount + costCount + customCount || 4;
		return (
			<div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
				{Array.from({ length: skeletonCount }).map((_, i) => (
					<div
						key={i}
						className='rounded-md p-[25px] space-y-3'
						style={{ backgroundColor: 'var(--portal-surface, white)', border: '1px solid var(--portal-border, #E5E7EB)' }}>
						<Skeleton className='h-4 w-24' />
						<Skeleton className='h-7 w-32' />
					</div>
				))}
			</div>
		);
	}

	const hasRevenueData = showRevenue && costData;
	const hasCostData = showCost && costData;
	const hasCustomData = showCustom && customItems.length > 0;

	if (!hasRevenueData && !hasCostData && !hasCustomData) return null;

	const currency = costData?.currency ?? 'USD';
	const totalRevenue = parseFloat(costData?.total_revenue ?? '0');
	const totalCost = parseFloat(costData?.total_cost ?? '0');
	const margin = parseFloat(costData?.margin ?? '0');
	const marginPercent = parseFloat(costData?.margin_percent ?? '0');

	// Calculate total card count for grid layout
	const revenueCardCount = hasRevenueData ? 1 : 0;
	const costCardCount = hasCostData ? 3 : 0;
	const customCardCount = hasCustomData ? customItems.length : 0;
	const totalCards = revenueCardCount + costCardCount + customCardCount;

	return (
		<div
			className='grid gap-3'
			style={{
				gridTemplateColumns: totalCards === 1 ? 'auto' : `repeat(${totalCards}, 1fr)`,
				width: totalCards === 1 ? '25%' : '100%',
			}}>
			{/* Revenue metric */}
			{hasRevenueData && (
				<PortalMetricWrapper hasTheme={hasTheme}>
					<MetricCard title={t('metrics.revenue')} value={totalRevenue} currency={currency} />
				</PortalMetricWrapper>
			)}

			{/* Cost metrics — 3 cards */}
			{hasCostData && (
				<>
					<PortalMetricWrapper hasTheme={hasTheme}>
						<MetricCard title={t('metrics.cost')} value={totalCost} currency={currency} />
					</PortalMetricWrapper>
					<PortalMetricWrapper hasTheme={hasTheme}>
						<MetricCard title={t('metrics.margin')} value={margin} currency={currency} showChangeIndicator isNegative={margin < 0} />
					</PortalMetricWrapper>
					<PortalMetricWrapper hasTheme={hasTheme}>
						<MetricCard
							title={t('metrics.marginPercent')}
							value={marginPercent}
							isPercent
							showChangeIndicator
							isNegative={marginPercent < 0}
						/>
					</PortalMetricWrapper>
				</>
			)}

			{hasCustomData &&
				customItems.map((item) => {
					const value = parseFloat(item.value);
					const displayName = item.id === 'revenue-per-minute' || item.name === 'revenue-per-minute' ? t('metrics.cpm') : item.name;
					const isCurrencyMetric = item.id === 'revenue-per-minute';
					return (
						<PortalMetricWrapper key={item.id} hasTheme={hasTheme}>
							<MetricCard title={displayName} value={isNaN(value) ? 0 : value} currency={isCurrencyMetric ? currency : undefined} />
						</PortalMetricWrapper>
					);
				})}
		</div>
	);
};

/**
 * A portal-aware wrapper that overrides MetricCard's hardcoded white background
 * with the tenant's surface/border/text CSS variables when a theme is active.
 * Without a theme it renders as a transparent pass-through (MetricCard's own styles apply).
 */
const PortalMetricWrapper = ({ hasTheme, children }: { hasTheme: boolean; children: React.ReactNode }) => {
	if (!hasTheme) return <>{children}</>;
	return (
		<div
			className='rounded-md overflow-hidden'
			style={{
				backgroundColor: 'var(--portal-surface)',
				border: '1px solid var(--portal-border)',
			}}>
			{/* Override MetricCard internals via CSS cascade */}
			<style>{`
				.portal-metric-inner .bg-white { background-color: transparent !important; }
				.portal-metric-inner .border { border-color: transparent !important; }
				.portal-metric-inner p:first-child { color: var(--portal-text-secondary) !important; }
				.portal-metric-inner p:last-child { color: var(--portal-text-primary) !important; }
			`}</style>
			<div className='portal-metric-inner'>{children}</div>
		</div>
	);
};

export default MetricCardsWidget;
