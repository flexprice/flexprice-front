//
// Pure DTO → presentational mapping for the usage widgets. No React, no hooks — independently
// unit-testable. Containers call these to turn API responses into the usage widgets' typed
// presentational models. Mirrors `src/pricing/adapters.ts`.
import { FEATURE_TYPE } from '@/models/Feature';
import type { CustomerUsage, UsageAnalyticItem } from '@/models';
import type { GetDetailedCostAnalyticsResponse } from '@/types/dto/Cost';
import type { CustomAnalyticItem } from '@/types/dto/Events';
import type { MetricCardsConfig, UsageGraphConfig } from '@/types/dto/PortalConfig';
import type { UsageQuotaItem, MetricCardItem, UsageTrendSeries, UsageBreakdownRow } from './types';

/** Metered-usage entitlements only — static/boolean entitlements have no quota to show. */
export function adaptUsageQuotaItems(usageData: CustomerUsage[] | undefined): UsageQuotaItem[] {
	return (usageData ?? [])
		.filter((item) => item.feature?.type === FEATURE_TYPE.METERED)
		.map((item, index) => ({
			id: item.feature?.id || String(index),
			name: item.feature?.name || '',
			currentUsage: Number(item.current_usage || 0),
			limit: item.is_unlimited ? null : item.total_limit != null ? Number(item.total_limit) : null,
			isUnlimited: item.is_unlimited,
		}));
}

// ── MetricCards ──────────────────────────────────────────────────────────────

export function adaptMetricCards(
	costData: GetDetailedCostAnalyticsResponse | undefined,
	customItems: CustomAnalyticItem[],
	config: MetricCardsConfig,
): MetricCardItem[] {
	const items: MetricCardItem[] = [];
	const currency = costData?.currency ?? 'USD';

	if (config.show_revenue_metric && costData) {
		items.push({ id: 'revenue', titleKey: 'revenue', value: parseFloat(costData.total_revenue), currency });
	}
	if (config.show_cost_metrics && costData) {
		const margin = parseFloat(costData.margin);
		const marginPercent = parseFloat(costData.margin_percent);
		items.push({ id: 'cost', titleKey: 'cost', value: parseFloat(costData.total_cost), currency });
		items.push({ id: 'margin', titleKey: 'margin', value: margin, currency, showChangeIndicator: true, isNegative: margin < 0 });
		items.push({
			id: 'margin-percent',
			titleKey: 'marginPercent',
			value: marginPercent,
			isPercent: true,
			showChangeIndicator: true,
			isNegative: marginPercent < 0,
		});
	}
	if (config.show_custom_metrics) {
		for (const item of customItems ?? []) {
			const value = parseFloat(item.value);
			const isCpm = item.id === 'revenue-per-minute' || item.name === 'revenue-per-minute';
			items.push({
				id: item.id,
				titleKey: isCpm ? 'cpm' : 'custom',
				customLabel: item.name,
				value: isNaN(value) ? 0 : value,
				currency: isCpm ? currency : undefined,
			});
		}
	}
	return items;
}

// ── UsageTrendChart ──────────────────────────────────────────────────────────

/** Applies the portal's feature_filter_mode config. */
export function filterItemsByFeatureConfig(
	items: UsageAnalyticItem[],
	config: Pick<UsageGraphConfig, 'feature_filter_mode' | 'feature_ids'>,
): UsageAnalyticItem[] {
	const { feature_filter_mode, feature_ids } = config;
	if (feature_filter_mode === 'include_list' && feature_ids?.length) {
		return (items ?? []).filter((item) => feature_ids.includes(item.feature_id));
	}
	if (feature_filter_mode === 'exclude_list' && feature_ids?.length) {
		return (items ?? []).filter((item) => !feature_ids.includes(item.feature_id));
	}
	return items ?? [];
}

/** Applies the portal's feature_filter_mode config, then maps to the decoupled series shape. */
export function adaptUsageTrendSeries(
	items: UsageAnalyticItem[],
	config: Pick<UsageGraphConfig, 'feature_filter_mode' | 'feature_ids'>,
): UsageTrendSeries[] {
	return filterItemsByFeatureConfig(items, config).map((item, index) => ({
		// Properties are part of the identity: items of one feature split by a property would otherwise collide.
		id: [item.source || item.feature_id || `series-${index}`, ...propertyPairs(item)].join('|'),
		name: item.name || item.event_name || '',
		points: (item.points ?? []).map((p) => ({ timestamp: p.timestamp, usage: p.usage })),
	}));
}

function propertyPairs(item: UsageAnalyticItem): string[] {
	return Object.entries(item.properties ?? {})
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([key, value]) => `${key}=${value}`);
}

// ── Grouped by a property ────────────────────────────────────────────────────

export type GroupedMetric = 'usage' | 'cost';

/** Labels for usage without the grouped property, and for the groups folded past the cap. */
export interface GroupedLabels {
	none: string;
	other: string;
}

const OTHER_SERIES_ID = '__other__';

/**
 * One series per value of `groupKey`, summed across features per timestamp. Keeps the `maxGroups`
 * groups with the highest total cost and folds the rest into one "Other" series.
 */
export function adaptGroupedTrendSeries(
	items: UsageAnalyticItem[],
	groupKey: string,
	metric: GroupedMetric,
	maxGroups: number,
	labels: GroupedLabels,
): UsageTrendSeries[] {
	const groups = new Map<string, { cost: number; points: Map<string, number> }>();
	for (const item of items ?? []) {
		const value = item.properties?.[groupKey] ?? '';
		const group = groups.get(value) ?? { cost: 0, points: new Map<string, number>() };
		group.cost += Number(item.total_cost) || 0;
		addPoints(group.points, item.points ?? [], metric);
		groups.set(value, group);
	}

	const ranked = [...groups.entries()].sort(([a, x], [b, y]) => y.cost - x.cost || a.localeCompare(b));
	const series = ranked.slice(0, maxGroups).map(([value, group]) => toSeries(value || groupKey, value || labels.none, group.points));
	const rest = ranked.slice(maxGroups);
	if (rest.length > 0) {
		const merged = new Map<string, number>();
		for (const [, group] of rest)
			for (const [timestamp, total] of group.points) merged.set(timestamp, (merged.get(timestamp) ?? 0) + total);
		series.push(toSeries(OTHER_SERIES_ID, labels.other, merged));
	}
	return series;
}

function addPoints(totals: Map<string, number>, points: NonNullable<UsageAnalyticItem['points']>, metric: GroupedMetric) {
	for (const p of points) totals.set(p.timestamp, (totals.get(p.timestamp) ?? 0) + (Number(metric === 'cost' ? p.cost : p.usage) || 0));
}

function toSeries(id: string, name: string, totals: Map<string, number>): UsageTrendSeries {
	return {
		id,
		name,
		points: [...totals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([timestamp, usage]) => ({ timestamp, usage })),
	};
}

/** One row per value of `groupKey`, with usage and cost summed across features. */
export function adaptGroupedBreakdownRows(items: UsageAnalyticItem[], groupKey: string, noneLabel: string): UsageBreakdownRow[] {
	const rows = new Map<string, UsageBreakdownRow>();
	adaptUsageBreakdownRows(items).forEach((base, index) => {
		const value = items[index].properties?.[groupKey] ?? '';
		const shown = base.totalUsageDisplay != null ? parseFloat(base.totalUsageDisplay.replace(/,/g, '')) : base.totalUsage;
		const row = rows.get(value) ?? {
			id: value || groupKey,
			name: value || noneLabel,
			totalUsage: 0,
			totalCost: 0,
			unit: base.unit,
			unitPrice: base.unitPrice,
			currency: base.currency,
		};
		row.totalUsage += Number.isFinite(shown) ? shown : 0;
		row.totalCost += base.totalCost;
		if (row.unitPrice !== base.unitPrice) row.unitPrice = undefined;
		rows.set(value, row);
	});
	return [...rows.values()];
}

// ── UsageBreakdown ──────────────────────────────────────────────────────────

export function adaptUsageBreakdownRows(items: UsageAnalyticItem[]): UsageBreakdownRow[] {
	return (items ?? []).map((row, index) => {
		const group = row.group ?? row.feature?.group ?? row.price?.group;
		// Singular/plural must key off the value actually shown, not the raw metered total: when
		// `reporting_unit.conversion_rate` is set, `total_usage_display` can read "1" while raw
		// `total_usage` is e.g. 1000 — plural would be wrong for what the user sees.
		const displayQuantity =
			row.total_usage_display != null ? parseFloat(row.total_usage_display.replace(/,/g, '')) : Number(row.total_usage);
		const isSingular = Number.isFinite(displayQuantity) ? displayQuantity === 1 : Number(row.total_usage) === 1;
		const unitLabel = row.reporting_unit
			? isSingular
				? (row.reporting_unit.unit_singular ?? row.reporting_unit.unit_plural ?? '')
				: (row.reporting_unit.unit_plural ?? row.reporting_unit.unit_singular ?? '')
			: row.unit
				? isSingular
					? row.unit
					: (row.unit_plural ?? row.unit)
				: undefined;
		return {
			id: row.feature_id || row.price_id || row.meter_id || String(index),
			name: row.name || row.feature?.name || row.event_name || '',
			groupId: group?.id,
			groupName: group?.name,
			totalUsage: Number(row.total_usage) || 0,
			totalUsageDisplay: row.total_usage_display || undefined,
			unit: unitLabel,
			unitPrice: row.price?.amount?.trim() || undefined,
			totalCost: Number(row.total_cost) || 0,
			currency: row.currency,
		};
	});
}
