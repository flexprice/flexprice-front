//
// Bundled i18n so the usage widgets render real English out-of-the-box for external consumers —
// WITHOUT overriding a host app that has its own i18n (the dashboard localizes these to Arabic).
// Mirrors `src/pricing/i18n.ts`. Namespace stays `'common'` so a host dashboard's own `common`
// bundle is reused for the handoff check; the bundled English defaults live under
// `common.usageWidgets`.
import { createBundledT } from '@/lib/exportable/bundledI18n';

/** English defaults for the keys the usage widgets render (mirror of dashboard `customer-portal.usage` / `usageBreakdown` / `metrics`). Extended by later tasks. */
const EN_USAGE_WIDGETS = {
	quotaTitle: 'Usage Quota',
	unknownFeature: 'Unknown Feature',
	unlimited: 'Unlimited',
	revenue: 'Total spend',
	cost: 'Cost',
	margin: 'Margin',
	marginPercent: 'Margin %',
	cpm: 'CPM',
	trendTitle: 'Usage Trend',
	singlePointLabel: 'Usage for {{date}} · {{value}}',
	breakdownTitle: 'Usage Breakdown',
	feature: 'Feature',
	totalUsage: 'Total Usage',
	totalCost: 'Total Cost',
	noGroup: 'No group',
	expandAllAria: 'Expand all',
	collapseAllAria: 'Collapse all',
	unknownRow: 'Unknown',
	cellEmDash: '—',
	cellEmpty: '--',
	trendEmptyTitle: 'No usage data yet',
	trendEmptyDescription: 'No usage has been recorded during this period.',
	breakdownEmptyTitle: 'No usage in this period',
	breakdownEmptyDescription: 'Try selecting a different date range.',
};

export const useUsageT = createBundledT('common', { usageWidgets: EN_USAGE_WIDGETS }).useBoundT;
