import { describe, expect, it } from 'vitest';
import { ReportCatalogEntry } from '@/types/dto/Reports';
import { defaultControls } from './reportMath';
import { csvBaseName, effectiveControls, fromDefinition, sameDefinition, toDefinition } from './customReports';

const entry: ReportCatalogEntry = {
	key: 'invoice_total',
	name: 'Total billing',
	description: '',
	category: 'billing',
	kind: 'flow',
	value_type: 'money',
	improvement: 'higher',
	shapes: ['scalar', 'timeseries', 'breakdown'],
	default_shape: 'timeseries',
	dimensions: [
		{ key: 'customer_id', label: 'Customer' },
		{ key: 'invoice_type', label: 'Invoice type' },
	],
	grains: ['day', 'week', 'month'],
	supports_compare: true,
};
const now = new Date('2026-10-14T10:00:00Z');

describe('custom report definition', () => {
	it('round-trips controls through the saved definition', () => {
		const c = {
			...defaultControls(entry),
			preset: 'this_quarter' as const,
			groupBy: 'customer_id',
			view: 'table' as const,
			currency: 'USD',
			filters: [{ field: 'invoice_type', op: 'eq' as const, value: ['SUBSCRIPTION'] }],
		};
		const def = toDefinition(entry, c, now);
		expect(def).toMatchObject({
			family: 'report',
			metrics: ['invoice_total'],
			shape: 'breakdown',
			dimensions: ['customer_id'],
			time: { range: 'this_quarter' },
			display: 'table',
			currency: 'USD',
			compare: 'previous_period',
		});
		expect(def.filters).toEqual(c.filters);
		const back = fromDefinition(entry, def);
		expect(back.valid).toBe(true);
		expect(sameDefinition(toDefinition(entry, back.controls, now), def)).toBe(true);
	});

	it('flags and drops settings the report no longer allows', () => {
		const def = toDefinition(entry, defaultControls(entry), now);
		const stale = { ...def, filters: [{ field: 'meter_id', op: 'eq' as const, value: ['m1'] }], time: { range: 'last_8_days' } };
		const back = fromDefinition(entry, stale);
		expect(back.valid).toBe(false);
		expect(back.controls.filters).toEqual([]);
		expect(back.controls.preset).toBe(defaultControls(entry).preset);
	});

	it('ignores key order when comparing definitions', () => {
		const def = toDefinition(entry, defaultControls(entry), now);
		const reordered = JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(def).reverse())));
		expect(sameDefinition(def, reordered)).toBe(true);
	});

	it('names CSV files after the custom report', () => {
		expect(csvBaseName('Acme Q3 billing!', 'invoice_total')).toBe('acme_q3_billing');
		expect(csvBaseName('!!!', 'invoice_total')).toBe('invoice_total');
	});

	it('drops a currency the report does not carry', () => {
		const c = { ...defaultControls(entry), currency: 'USD' };
		expect(toDefinition(entry, effectiveControls(c, []), now).currency).toBeUndefined();
		expect(toDefinition(entry, effectiveControls(c, ['USD']), now).currency).toBe('USD');
	});
});
