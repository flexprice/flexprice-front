import { UsageAnalyticItem } from '@/models';
import { CostAnalyticItem } from '@/types';

export interface MergedUsageAnalyticRow extends UsageAnalyticItem {
	cogs: number | null;
	margin: number | null;
}

export interface MergeUsageAndCostAnalyticsResult {
	mergedUsageItems: MergedUsageAnalyticRow[];
	unmatchedCostItems: CostAnalyticItem[];
}

function parseCostAmount(value: string | undefined): number {
	const parsed = parseFloat(value || '0');
	return Number.isFinite(parsed) ? parsed : 0;
}

function aggregateCostItems(existing: CostAnalyticItem, incoming: CostAnalyticItem): CostAnalyticItem {
	return {
		...existing,
		total_cost: String(parseCostAmount(existing.total_cost) + parseCostAmount(incoming.total_cost)),
		total_quantity: String(parseFloat(existing.total_quantity || '0') + parseFloat(incoming.total_quantity || '0')),
		total_events: (existing.total_events ?? 0) + (incoming.total_events ?? 0),
	};
}

function buildCostByMeterId(costItems: CostAnalyticItem[]): Map<string, CostAnalyticItem> {
	const costByMeterId = new Map<string, CostAnalyticItem>();

	for (const costItem of costItems) {
		if (!costItem.meter_id) {
			continue;
		}

		const existing = costByMeterId.get(costItem.meter_id);
		costByMeterId.set(costItem.meter_id, existing ? aggregateCostItems(existing, costItem) : costItem);
	}

	return costByMeterId;
}

function buildMeterTotals(usageItems: UsageAnalyticItem[]) {
	const revenueByMeterId = new Map<string, number>();
	const usageByMeterId = new Map<string, number>();
	const rowCountByMeterId = new Map<string, number>();

	for (const item of usageItems) {
		if (!item.meter_id) {
			continue;
		}

		const revenue = Number(item.total_cost) || 0;
		const usage = Number(item.total_usage) || 0;

		revenueByMeterId.set(item.meter_id, (revenueByMeterId.get(item.meter_id) ?? 0) + revenue);
		usageByMeterId.set(item.meter_id, (usageByMeterId.get(item.meter_id) ?? 0) + usage);
		rowCountByMeterId.set(item.meter_id, (rowCountByMeterId.get(item.meter_id) ?? 0) + 1);
	}

	return { revenueByMeterId, usageByMeterId, rowCountByMeterId };
}

/**
 * Allocates a meter's total COGS across all usage rows for that meter.
 * Prefers revenue share, then usage share, then equal split.
 */
function allocateMeterCogs(
	item: UsageAnalyticItem,
	meterCogs: number,
	revenueByMeterId: Map<string, number>,
	usageByMeterId: Map<string, number>,
	rowCountByMeterId: Map<string, number>,
): number {
	const meterId = item.meter_id!;
	const totalRevenue = revenueByMeterId.get(meterId) ?? 0;
	const rowRevenue = Number(item.total_cost) || 0;

	if (totalRevenue > 0) {
		return meterCogs * (rowRevenue / totalRevenue);
	}

	const totalUsage = usageByMeterId.get(meterId) ?? 0;
	const rowUsage = Number(item.total_usage) || 0;
	if (totalUsage > 0) {
		return meterCogs * (rowUsage / totalUsage);
	}

	const rowCount = rowCountByMeterId.get(meterId) ?? 1;
	return meterCogs / rowCount;
}

/**
 * Joins cost analytics onto usage rows by `meter_id` and returns cost rows
 * whose meter is not present on any usage row.
 */
export function mergeUsageAndCostAnalytics(
	usageItems: UsageAnalyticItem[],
	costItems: CostAnalyticItem[] = [],
): MergeUsageAndCostAnalyticsResult {
	const costByMeterId = buildCostByMeterId(costItems);
	const usageMeterIds = new Set(usageItems.map((item) => item.meter_id).filter((id): id is string => Boolean(id)));
	const { revenueByMeterId, usageByMeterId, rowCountByMeterId } = buildMeterTotals(usageItems);

	const mergedUsageItems: MergedUsageAnalyticRow[] = usageItems.map((item) => {
		const revenue = Number(item.total_cost) || 0;

		if (!item.meter_id) {
			return { ...item, cogs: null, margin: null };
		}

		const matchedCost = costByMeterId.get(item.meter_id);
		if (!matchedCost) {
			return { ...item, cogs: null, margin: null };
		}

		const meterCogs = parseCostAmount(matchedCost.total_cost);
		const cogs = allocateMeterCogs(item, meterCogs, revenueByMeterId, usageByMeterId, rowCountByMeterId);

		return {
			...item,
			cogs,
			margin: revenue - cogs,
		};
	});

	const unmatchedCostItems = costItems.filter((item) => !item.meter_id || !usageMeterIds.has(item.meter_id));

	return { mergedUsageItems, unmatchedCostItems };
}
