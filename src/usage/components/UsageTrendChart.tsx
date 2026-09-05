import { useMemo } from 'react';
// Direct file import, NOT the '@/components/atoms' barrel — see UsageQuota.tsx for why.
import Card from '@/components/atoms/Card/Card';
import { Skeleton } from '@/components/ui/skeleton';
// Direct file import, NOT the `@/components/molecules` barrel — see MetricCards.tsx for why.
import CustomerUsageChart from '@/components/molecules/CustomerUsageChart';
import type { GetUsageAnalyticsResponse } from '@/types/dto';
import { cn } from '@/lib/utils';
import { formatCredits } from '@/utils/common/formatBalance';
import { LineChart } from 'lucide-react';
import EmptyState from '@/components/atoms/EmptyState/EmptyState';
import { useTranslation } from 'react-i18next';
import SectionIcon from '@/components/atoms/SectionIcon/SectionIcon';
import { useUsageT } from '../i18n';
import { normalizeUsageTrendSeries } from '../schema';
import type { UsageTrendChartProps } from '../types';

/**
 * Prop-only usage-trend line chart — no fetching, no auth, no PortalConfigContext. Internally
 * reuses the dashboard's `CustomerUsageChart` renderer (already token-based, no portal coupling)
 * and a decoupled `series` prop shape so the public contract never leaks the
 * `GetUsageAnalyticsResponse` backend DTO.
 *
 * `CustomerUsageChart` renders its own Card chrome (title included) in both its no-data and
 * has-data paths — this wrapper must not add a second one around it, or the widget renders
 * nested card borders/padding. The Card here is only for the loading-skeleton state, which
 * `CustomerUsageChart` has no prop for.
 *
 * The empty case is rendered here rather than delegated to `CustomerUsageChart`: its own
 * no-data path holds a 250px void and states the same thing twice ("No usage data available"
 * above "No data to display"), which reads as a broken chart. This one keeps the heading and
 * the period it covers, then a compact empty state saying what is missing, why, and where to go.
 */
const UsageTrendChart = ({ series: rawSeries, label, isLoading = false, className, periodLabel, emptyAction }: UsageTrendChartProps) => {
	const series = useMemo(() => normalizeUsageTrendSeries(rawSeries), [rawSeries]);
	const t = useUsageT();
	// The caption's words come from i18next but its date came from the browser
	// locale, so the two could disagree — an Arabic label above an en-US date.
	// Optional throughout: a consumer app may have no i18next provider at all.
	const { i18n } = useTranslation();
	const locale = i18n?.resolvedLanguage || i18n?.language || undefined;

	const chartData: GetUsageAnalyticsResponse = useMemo(
		() => ({
			total_cost: 0,
			currency: '',
			items: series.map((s) => ({
				feature_id: s.id,
				source: s.id,
				name: s.name,
				total_usage: 0,
				total_cost: 0,
				event_count: 0,
				points: s.points.map((p) => ({ timestamp: p.timestamp, usage: p.usage, cost: 0, event_count: 0 })),
			})),
		}),
		[series],
	);

	// With a single point there is no trend to read, so the chart is captioned with the
	// value and its date. The chart still renders — CustomerUsageChart shows a marker
	// when the series is too short to draw a line.
	// Built once so the empty card and the chart's own header carry the same heading.
	const heading = (
		<span className='flex items-center gap-2.5'>
			<SectionIcon>
				<LineChart />
			</SectionIcon>
			<span className='text-sm font-medium text-content'>{label || t('usageWidgets.trendTitle')}</span>
		</span>
	);

	const points = series.flatMap((s) => s.points);
	const sparseCaption =
		points.length === 1
			? t('usageWidgets.singlePointLabel', {
					// Not formatDateShort: it pins 'en-US', so this caption rendered an
					// English date inside the Arabic portal.
					date: new Date(points[0].timestamp).toLocaleDateString(locale, {
						month: 'short',
						day: 'numeric',
						year: 'numeric',
					}),
					value: formatCredits(series.reduce((sum, item) => sum + (item.points[0]?.usage ?? 0), 0)),
				})
			: undefined;

	if (isLoading) {
		return (
			<Card noPadding className={cn('flexprice-ui', 'rounded-xl overflow-hidden bg-surface', className)}>
				<div className='border-b border-line px-5 py-4'>{heading}</div>
				<div className='p-6'>
					<div className='w-full h-64 flex flex-col gap-3 px-1'>
						<div className='flex flex-col justify-between h-52 relative'>
							{[...Array(5)].map((_, i) => (
								<div key={i} className='flex items-center gap-3 w-full'>
									<Skeleton className='h-3 w-8 shrink-0' />
									<div className='flex-1 h-px bg-line' />
								</div>
							))}
							<div className='absolute bottom-0 left-12 right-0 flex items-end gap-3 h-40'>
								{[35, 65, 45, 80, 55, 90, 40, 70, 50, 60].map((h, i) => (
									<Skeleton key={i} className='flex-1 rounded-sm' style={{ height: `${h}%` }} />
								))}
							</div>
						</div>
						<div className='flex justify-between ps-12'>
							{[0, 1, 2, 3].map((i) => (
								<Skeleton key={i} className='h-3 w-12' />
							))}
						</div>
					</div>
				</div>
			</Card>
		);
	}

	if (series.length === 0) {
		return (
			<Card noPadding className={cn('flexprice-ui', 'rounded-xl overflow-hidden bg-surface', className)}>
				<div className='p-6 border-b border-line'>
					<h3 className='text-base font-medium text-content'>{label || t('usageWidgets.trendTitle')}</h3>
					{periodLabel && <p className='mt-1 text-xs text-content-tertiary'>{periodLabel}</p>}
				</div>
				<EmptyState
					icon={<LineChart />}
					title={t('usageWidgets.trendEmptyTitle')}
					description={t('usageWidgets.trendEmptyDescription')}
					action={emptyAction}
				/>
			</Card>
		);
	}

	return (
		<CustomerUsageChart
			data={chartData}
			title={heading}
			description={sparseCaption || periodLabel}
			className={cn('flexprice-ui', className)}
			height={260}
		/>
	);
};

export default UsageTrendChart;
