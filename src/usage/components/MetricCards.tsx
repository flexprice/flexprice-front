import { useMemo } from 'react';
// Direct file import, NOT the `@/components/molecules` barrel: that barrel also re-exports
// `TaxTable`, which imports `@/core/routes/Routes` for a route-name constant — pulling the
// entire dashboard router (and every lazy-loaded page behind it) into this exported widget's
// bundle. Verified via a full static-reachability trace after a real npm-consumer build blew up
// to 17MB / pulled in unrelated dashboard pages (WebhookDashboard, InvoicesWidget, SubscriptionsWidget).
import MetricCard from '@/components/molecules/MetricCard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useUsageT } from '../i18n';
import { normalizeMetricCardItems } from '../schema';
import type { MetricCardsProps } from '../types';

const TRANSLATED_TITLE_KEYS = new Set(['revenue', 'cost', 'margin', 'marginPercent', 'cpm']);

/**
 * Prop-only metric-card grid — no fetching, no auth, no PortalConfigContext. Renders one
 * `MetricCard` per entry (already token-based, no portal coupling). Consumers supply
 * already-adapted `metrics` (see `adaptMetricCards`).
 */
const MetricCards = ({ metrics: rawMetrics, isLoading = false, className }: MetricCardsProps) => {
	const metrics = useMemo(() => normalizeMetricCardItems(rawMetrics), [rawMetrics]);
	const t = useUsageT();

	if (isLoading) {
		return (
			<div className={cn('flexprice-ui', 'grid grid-cols-2 md:grid-cols-4 gap-3', className)}>
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className='rounded-md p-[25px] space-y-3 bg-surface border border-line'>
						<Skeleton className='h-4 w-24' />
						<Skeleton className='h-7 w-32' />
					</div>
				))}
			</div>
		);
	}

	if (metrics.length === 0) return null;

	return (
		<div
			className={cn(
				'flexprice-ui',
				'grid gap-3',
				metrics.length === 1 ? 'grid-cols-1 w-1/4' : 'grid-cols-2 md:grid-cols-4 w-full',
				className,
			)}>
			{metrics.map((item) => (
				<MetricCard
					key={item.id}
					title={TRANSLATED_TITLE_KEYS.has(item.titleKey) ? t(`usageWidgets.${item.titleKey}`) : item.customLabel || ''}
					value={item.value}
					currency={item.currency}
					isPercent={item.isPercent}
					showChangeIndicator={item.showChangeIndicator}
					isNegative={item.isNegative}
				/>
			))}
		</div>
	);
};

export default MetricCards;
