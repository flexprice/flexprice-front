import { describe, expect, it } from 'vitest';
import { UsageAnalyticItem } from '@/models';
import { CostAnalyticItem } from '@/types';
import { mergeUsageAndCostAnalytics } from './mergeUsageAndCostAnalytics';

const usageItem = (overrides: Partial<UsageAnalyticItem>): UsageAnalyticItem => ({
	feature_id: 'feat-1',
	total_usage: 10,
	total_cost: 100,
	event_count: 0,
	...overrides,
});

const costItem = (overrides: Partial<CostAnalyticItem>): CostAnalyticItem => ({
	meter_id: 'meter-1',
	total_cost: '40',
	total_quantity: '10',
	total_events: 1,
	currency: 'usd',
	...overrides,
});

describe('mergeUsageAndCostAnalytics', () => {
	it('joins cogs and margin when meter_id matches', () => {
		const result = mergeUsageAndCostAnalytics(
			[usageItem({ meter_id: 'meter-1', total_cost: 100 })],
			[costItem({ meter_id: 'meter-1', total_cost: '40' })],
		);

		expect(result.mergedUsageItems).toHaveLength(1);
		expect(result.mergedUsageItems[0]?.cogs).toBe(40);
		expect(result.mergedUsageItems[0]?.margin).toBe(60);
		expect(result.unmatchedCostItems).toHaveLength(0);
	});

	it('returns unmatched cost rows when meter_id is absent from usage', () => {
		const result = mergeUsageAndCostAnalytics(
			[usageItem({ meter_id: 'meter-1' })],
			[costItem({ meter_id: 'meter-1' }), costItem({ meter_id: 'meter-2', meter_name: 'Orphan meter' })],
		);

		expect(result.unmatchedCostItems).toHaveLength(1);
		expect(result.unmatchedCostItems[0]?.meter_id).toBe('meter-2');
	});

	it('leaves cogs and margin null when usage row has no meter_id', () => {
		const result = mergeUsageAndCostAnalytics([usageItem({ meter_id: undefined })], [costItem({ meter_id: 'meter-1' })]);

		expect(result.mergedUsageItems[0]?.cogs).toBeNull();
		expect(result.mergedUsageItems[0]?.margin).toBeNull();
		expect(result.unmatchedCostItems).toHaveLength(1);
	});

	it('allocates meter cogs across all usage rows sharing the meter_id by revenue share', () => {
		const result = mergeUsageAndCostAnalytics(
			[usageItem({ meter_id: 'meter-1', total_cost: 100 }), usageItem({ meter_id: 'meter-1', total_cost: 50 })],
			[costItem({ meter_id: 'meter-1', total_cost: '40' })],
		);

		expect(result.mergedUsageItems[0]?.cogs).toBeCloseTo(26.6666666667, 5);
		expect(result.mergedUsageItems[0]?.margin).toBeCloseTo(73.3333333333, 5);
		expect(result.mergedUsageItems[1]?.cogs).toBeCloseTo(13.3333333333, 5);
		expect(result.mergedUsageItems[1]?.margin).toBeCloseTo(36.6666666667, 5);

		const totalCogs = (result.mergedUsageItems[0]?.cogs ?? 0) + (result.mergedUsageItems[1]?.cogs ?? 0);
		expect(totalCogs).toBeCloseTo(40, 5);
	});

	it('allocates meter cogs by usage share when revenue is zero', () => {
		const result = mergeUsageAndCostAnalytics(
			[
				usageItem({ meter_id: 'meter-1', total_cost: 0, total_usage: 30 }),
				usageItem({ meter_id: 'meter-1', total_cost: 0, total_usage: 10 }),
			],
			[costItem({ meter_id: 'meter-1', total_cost: '40' })],
		);

		expect(result.mergedUsageItems[0]?.cogs).toBe(30);
		expect(result.mergedUsageItems[1]?.cogs).toBe(10);
	});
});
