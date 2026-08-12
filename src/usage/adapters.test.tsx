import { describe, it, expect } from 'vitest';
import { FEATURE_TYPE, type Feature } from '@/models/Feature';
import { ENTITY_STATUS } from '@/models/base';
import type { CustomerUsage, UsageAnalyticItem } from '@/models';
import type { Group } from '@/models/Group';
import { GROUP_ENTITY_TYPE } from '@/models/Group';
import { adaptUsageQuotaItems, adaptMetricCards, adaptUsageTrendSeries, adaptUsageBreakdownRows } from './adapters';

function makeFeature(overrides: Partial<Feature> = {}): Feature {
	return {
		id: 'feat_x',
		created_at: '',
		updated_at: '',
		created_by: '',
		updated_by: '',
		tenant_id: '',
		status: ENTITY_STATUS.PUBLISHED,
		environment_id: '',
		name: '',
		description: '',
		meter_id: '',
		metadata: {},
		type: FEATURE_TYPE.METERED,
		unit_plural: '',
		unit_singular: '',
		...overrides,
	};
}

function makeCustomerUsage(overrides: Partial<CustomerUsage> = {}): CustomerUsage {
	return {
		id: 'ent_x',
		created_at: '',
		updated_at: '',
		created_by: '',
		updated_by: '',
		tenant_id: '',
		status: ENTITY_STATUS.PUBLISHED,
		environment_id: '',
		feature: makeFeature(),
		total_limit: null,
		is_unlimited: false,
		current_usage: 0,
		usage_percent: 0,
		is_enabled: true,
		is_soft_limit: false,
		next_usage_reset_at: null,
		sources: [],
		...overrides,
	};
}

function makeGroup(overrides: Partial<Group> = {}): Group {
	return {
		id: 'grp_x',
		created_at: '',
		updated_at: '',
		created_by: '',
		updated_by: '',
		tenant_id: '',
		status: ENTITY_STATUS.PUBLISHED,
		environment_id: '',
		name: '',
		lookup_key: '',
		entity_type: GROUP_ENTITY_TYPE.FEATURE,
		entity_ids: [],
		metadata: null,
		...overrides,
	};
}

function makeUsageAnalyticItem(overrides: Partial<UsageAnalyticItem> = {}): UsageAnalyticItem {
	return {
		feature_id: 'feat_x',
		total_usage: 0,
		total_cost: 0,
		event_count: 0,
		...overrides,
	};
}

describe('adaptUsageQuotaItems', () => {
	it('keeps only metered entitlements and maps limit/unlimited', () => {
		const result = adaptUsageQuotaItems([
			makeCustomerUsage({
				id: 'ent_1',
				feature: makeFeature({ id: 'feat_1', name: 'API Calls', type: FEATURE_TYPE.METERED }),
				total_limit: 1000,
				is_unlimited: false,
				current_usage: 250,
				usage_percent: 25,
			}),
			makeCustomerUsage({
				id: 'ent_2',
				feature: makeFeature({ id: 'feat_2', name: 'Seats', type: FEATURE_TYPE.STATIC }),
				total_limit: null,
			}),
			makeCustomerUsage({
				id: 'ent_3',
				feature: makeFeature({ id: 'feat_3', name: 'Storage', type: FEATURE_TYPE.METERED }),
				total_limit: null,
				is_unlimited: true,
				current_usage: 42,
			}),
		]);

		expect(result).toEqual([
			{ id: 'feat_1', name: 'API Calls', currentUsage: 250, limit: 1000, isUnlimited: false },
			{ id: 'feat_3', name: 'Storage', currentUsage: 42, limit: null, isUnlimited: true },
		]);
	});

	it('returns [] for empty/undefined input', () => {
		expect(adaptUsageQuotaItems([])).toEqual([]);
		expect(adaptUsageQuotaItems(undefined)).toEqual([]);
	});
});

describe('adaptMetricCards', () => {
	const costData = {
		cost_analytics: [],
		total_revenue: '1000',
		total_cost: '400',
		margin: '600',
		margin_percent: '60',
		roi: '1.5',
		roi_percent: '150',
		currency: 'USD',
		start_time: '2026-01-01',
		end_time: '2026-01-31',
	};

	it('includes revenue + cost + margin cards when enabled', () => {
		const result = adaptMetricCards(costData, [], { show_custom_metrics: false, show_revenue_metric: true, show_cost_metrics: true });
		expect(result).toEqual([
			{ id: 'revenue', titleKey: 'revenue', value: 1000, currency: 'USD' },
			{ id: 'cost', titleKey: 'cost', value: 400, currency: 'USD' },
			{ id: 'margin', titleKey: 'margin', value: 600, currency: 'USD', showChangeIndicator: true, isNegative: false },
			{ id: 'margin-percent', titleKey: 'marginPercent', value: 60, isPercent: true, showChangeIndicator: true, isNegative: false },
		]);
	});

	it('maps the revenue-per-minute custom metric to the cpm title key with currency', () => {
		const result = adaptMetricCards(
			costData,
			[{ id: 'revenue-per-minute', name: 'revenue-per-minute', feature_name: 'Revenue per minute', value: '0.12', type: 'currency' }],
			{ show_custom_metrics: true, show_revenue_metric: false, show_cost_metrics: false },
		);
		expect(result).toEqual([
			{ id: 'revenue-per-minute', titleKey: 'cpm', customLabel: 'revenue-per-minute', value: 0.12, currency: 'USD' },
		]);
	});

	it('maps a plain custom metric to the custom title key with no currency', () => {
		const result = adaptMetricCards(
			costData,
			[{ id: 'active-calls', name: 'Active Calls', feature_name: 'Active Calls', value: '42', type: 'count' }],
			{
				show_custom_metrics: true,
				show_revenue_metric: false,
				show_cost_metrics: false,
			},
		);
		expect(result).toEqual([{ id: 'active-calls', titleKey: 'custom', customLabel: 'Active Calls', value: 42, currency: undefined }]);
	});

	it('returns [] when nothing is enabled or costData is missing', () => {
		expect(adaptMetricCards(undefined, [], { show_custom_metrics: false, show_revenue_metric: true, show_cost_metrics: true })).toEqual([]);
	});
});

describe('adaptUsageTrendSeries', () => {
	const items: UsageAnalyticItem[] = [
		makeUsageAnalyticItem({
			feature_id: 'feat_1',
			source: 'feat_1',
			name: 'API Calls',
			points: [{ timestamp: '2026-01-01T00:00:00Z', usage: 10, cost: 1, event_count: 5 }],
		}),
		makeUsageAnalyticItem({ feature_id: 'feat_2', source: 'feat_2', name: 'Storage', points: [] }),
	];

	it('maps items to series with no filtering when mode is all', () => {
		const result = adaptUsageTrendSeries(items, { feature_filter_mode: 'all' });
		expect(result).toEqual([
			{ id: 'feat_1', name: 'API Calls', points: [{ timestamp: '2026-01-01T00:00:00Z', usage: 10 }] },
			{ id: 'feat_2', name: 'Storage', points: [] },
		]);
	});

	it('applies an include_list filter', () => {
		const result = adaptUsageTrendSeries(items, { feature_filter_mode: 'include_list', feature_ids: ['feat_1'] });
		expect(result.map((s) => s.id)).toEqual(['feat_1']);
	});

	it('applies an exclude_list filter', () => {
		const result = adaptUsageTrendSeries(items, { feature_filter_mode: 'exclude_list', feature_ids: ['feat_1'] });
		expect(result.map((s) => s.id)).toEqual(['feat_2']);
	});
});

describe('adaptUsageBreakdownRows', () => {
	it('maps group, usage display, and cost fields', () => {
		const result = adaptUsageBreakdownRows([
			makeUsageAnalyticItem({
				feature_id: 'feat_1',
				name: 'API Calls',
				group: makeGroup({ id: 'grp_1', name: 'Core' }),
				total_usage: 1234,
				total_usage_display: '1,234',
				unit: 'call',
				unit_plural: 'calls',
				total_cost: 12.5,
				currency: 'USD',
			}),
		]);
		expect(result).toEqual([
			{
				id: 'feat_1',
				name: 'API Calls',
				groupId: 'grp_1',
				groupName: 'Core',
				totalUsage: 1234,
				totalUsageDisplay: '1,234',
				unit: 'calls',
				totalCost: 12.5,
				currency: 'USD',
			},
		]);
	});

	it('leaves group fields undefined when the row has no group', () => {
		const result = adaptUsageBreakdownRows([
			makeUsageAnalyticItem({ feature_id: 'feat_2', name: 'Storage', total_usage: 0, total_cost: 0 }),
		]);
		expect(result[0].groupId).toBeUndefined();
		expect(result[0].groupName).toBeUndefined();
	});

	it('picks singular/plural off the converted display value, not the raw metered total', () => {
		// A conversion_rate can make raw total_usage=1000 display as "1" — the unit shown must
		// agree with what's on screen, not the underlying raw count.
		const result = adaptUsageBreakdownRows([
			makeUsageAnalyticItem({
				feature_id: 'feat_1',
				name: 'Storage',
				total_usage: 1000,
				total_usage_display: '1',
				reporting_unit: { unit_singular: 'GB', unit_plural: 'GBs' },
				total_cost: 5,
			}),
		]);
		expect(result[0].unit).toBe('GB');
	});
});
