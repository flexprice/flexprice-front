import type { EmptyStateAction } from '@/components/atoms/EmptyState/EmptyState';

/**
 * What the reader can do when this widget has nothing to show. Supplied by the
 * host — these widgets have no router — and omitted when there is nowhere useful
 * to send them, in which case no action is rendered.
 */
export type { EmptyStateAction };

//
// Public presentational types for the usage widgets (quota, metric cards, trend chart, breakdown).
//
// Decoupled from backend DTOs (CustomerUsage / DashboardAnalyticsRequest / UsageAnalyticItem /
// GetDetailedCostAnalyticsResponse). Containers map API responses INTO these shapes via
// `adapters.ts`, so backend schema changes never leak into the widgets' public contract.

// ── UsageQuota ──────────────────────────────────────────────────────────────

export interface UsageQuotaItem {
	id: string;
	name: string;
	currentUsage: number;
	limit: number | null;
	isUnlimited: boolean;
}

export interface UsageQuotaProps {
	items: UsageQuotaItem[];
	label?: string;
	className?: string;
}

// ── MetricCards ──────────────────────────────────────────────────────────────

export interface MetricCardItem {
	id: string;
	titleKey: 'revenue' | 'cost' | 'margin' | 'marginPercent' | 'cpm' | 'custom';
	/** Only set when `titleKey` is `'custom'` — the item's own name from the API. */
	customLabel?: string;
	value: number;
	currency?: string;
	isPercent?: boolean;
	showChangeIndicator?: boolean;
	isNegative?: boolean;
}

export interface MetricCardsProps {
	metrics: MetricCardItem[];
	isLoading?: boolean;
	className?: string;
}

// ── UsageTrendChart ──────────────────────────────────────────────────────────

export interface UsageTrendPoint {
	timestamp: string;
	usage: number;
}

export interface UsageTrendSeries {
	id: string;
	name: string;
	points: UsageTrendPoint[];
}

export interface UsageTrendChartProps {
	series: UsageTrendSeries[];
	label?: string;
	isLoading?: boolean;
	className?: string;
	/** The window the series covers, e.g. "Aug 26 – Sep 1", shown under the title. */
	periodLabel?: string;
	emptyAction?: EmptyStateAction;
}

// ── UsageBreakdown ──────────────────────────────────────────────────────────

export interface UsageBreakdownRow {
	id: string;
	name: string;
	groupId?: string;
	groupName?: string;
	totalUsage: number;
	totalUsageDisplay?: string;
	unit?: string;
	totalCost: number;
	currency?: string;
}

export interface UsageBreakdownProps {
	rows: UsageBreakdownRow[];
	label?: string;
	isLoading?: boolean;
	className?: string;
	emptyAction?: EmptyStateAction;
}
