import { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Card } from '@/components/atoms';
import { CustomerUsageChart } from '@/components/molecules';
import { DashboardAnalyticsRequest } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { UsageGraphConfig } from '@/types/dto/PortalConfig';
import { usePortalConfig } from '@/context/PortalConfigContext';

interface UsageGraphWidgetProps {
	config: UsageGraphConfig;
	/** Resolved by SectionContent (shared date filter — same cache key as UsageBreakdownWidget) */
	analyticsParams: DashboardAnalyticsRequest;
	label?: string;
}

/**
 * Renders ONLY the usage chart (line chart).
 * The breakdown table is a separate widget (UsageBreakdownWidget).
 * Both share the same React Query cache entry — one API call serves both.
 * Returns null if no data — no empty state container shown.
 */
const UsageGraphWidget = ({ config, analyticsParams, label }: UsageGraphWidgetProps) => {
	const { t } = useTranslation('customer-portal');
	const { config: portalConfig } = usePortalConfig();
	const hasTheme = !!portalConfig.theme;

	const {
		data: analyticsData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['portal-analytics', analyticsParams],
		queryFn: () => CustomerPortalApi.getAnalytics(analyticsParams),
	});

	useEffect(() => {
		if (isError) toast.error(t('errors.loadUsageAnalytics'));
	}, [isError, t]);

	// Client-side feature filter
	const filteredItems = useMemo(() => {
		if (!analyticsData?.items) return [];
		const { feature_filter_mode, feature_ids } = config;
		if (feature_filter_mode === 'include_list' && feature_ids?.length) {
			return analyticsData.items.filter((item) => feature_ids.includes(item.feature_id));
		}
		if (feature_filter_mode === 'exclude_list' && feature_ids?.length) {
			return analyticsData.items.filter((item) => !feature_ids.includes(item.feature_id));
		}
		return analyticsData.items;
	}, [analyticsData, config]);

	// Return null if no data — no empty container
	if (!isLoading && filteredItems.length === 0) return null;

	const filteredAnalyticsData = analyticsData ? { ...analyticsData, items: filteredItems } : undefined;

	return (
		<Card
			className='rounded-xl overflow-hidden'
			style={{ backgroundColor: 'var(--portal-surface, white)', border: '1px solid var(--portal-border, #E9E9E9)' }}>
			<div className='p-6' style={{ borderBottom: '1px solid var(--portal-border, #E9E9E9)' }}>
				<h3 className='text-base font-medium' style={{ color: 'var(--portal-text-primary, #09090b)' }}>
					{label || t('usage.trendTitle')}
				</h3>
			</div>
			<div className='p-6'>
				{/* Inject CSS custom properties on this wrapper so shadcn's Card (used inside
				    CustomerUsageChart) inherits the portal surface color seamlessly. */}
				<div
					className='portal-chart-wrapper'
					style={
						hasTheme
							? ({
									'--card': 'var(--portal-surface)',
									'--card-foreground': 'var(--portal-text-primary)',
									'--border': 'var(--portal-border)',
								} as React.CSSProperties)
							: undefined
					}>
					{isLoading ? (
						<div className='w-full h-64 flex flex-col gap-3 px-1'>
							{/* Y-axis guide lines */}
							<div className='flex flex-col justify-between h-52 relative'>
								{[...Array(5)].map((_, i) => (
									<div key={i} className='flex items-center gap-3 w-full'>
										<Skeleton className='h-3 w-8 shrink-0' style={{ opacity: 0.5 }} />
										<div className='flex-1 h-px' style={{ backgroundColor: 'var(--portal-border, #e5e7eb)', opacity: 0.4 }} />
									</div>
								))}
								{/* Fake chart bars */}
								<div className='absolute bottom-0 left-12 right-0 flex items-end gap-3 h-40'>
									{[35, 65, 45, 80, 55, 90, 40, 70, 50, 60].map((h, i) => (
										<Skeleton key={i} className='flex-1 rounded-sm' style={{ height: `${h}%`, opacity: 0.35 + i * 0.03 }} />
									))}
								</div>
							</div>
							{/* X-axis labels */}
							<div className='flex justify-between ps-12'>
								{['', '', '', ''].map((_, i) => (
									<Skeleton key={i} className='h-3 w-12' style={{ opacity: 0.4 }} />
								))}
							</div>
							{/* Legend */}
							<div className='flex items-center gap-2 justify-center'>
								<Skeleton className='h-2 w-2 rounded-full' />
								<Skeleton className='h-3 w-16' style={{ opacity: 0.5 }} />
							</div>
						</div>
					) : filteredAnalyticsData ? (
						<CustomerUsageChart
							data={filteredAnalyticsData}
							primaryColor={
								hasTheme ? getComputedStyle(document.documentElement).getPropertyValue('--portal-primary').trim() || undefined : undefined
							}
						/>
					) : null}
				</div>
			</div>
		</Card>
	);
};

export default UsageGraphWidget;
