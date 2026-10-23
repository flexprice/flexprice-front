import { describe, it, expect } from 'vitest';
import { Dataset, DatasetDefinition } from '@/types/dto/Reports';
import {
	aggsFor,
	defaultDefinition,
	isDatasetDefinition,
	measureLabel,
	opsFor,
	resolveDefinition,
	sameDatasetDefinition,
	validateBuilder,
	withTopN,
} from './builderModel';

const ds: Dataset = {
	key: 'invoices',
	label: 'Invoices',
	description: '',
	fields: [
		{ key: 'created_at', label: 'Created', kind: 'time', group: false, filter: false, measure: false },
		{ key: 'status', label: 'Status', kind: 'string', group: true, filter: true, measure: false, enum: ['A', 'B'] },
		{ key: 'plan', label: 'Plan', kind: 'string', group: true, filter: true, measure: false },
		{ key: 'total', label: 'Total', kind: 'number', money: true, group: false, filter: true, measure: true },
		{ key: 'paid', label: 'Paid', kind: 'bool', group: true, filter: true, measure: false },
		{ key: 'note', label: 'Note', kind: 'string', group: false, filter: false, measure: false },
	],
};
const base = (over: Partial<DatasetDefinition> = {}): DatasetDefinition => ({
	...defaultDefinition(ds),
	...over,
});
const has = (def: DatasetDefinition, key: string, d = ds) => validateBuilder(d, def).includes(`builder.errors.${key}`);

describe('aggsFor / opsFor', () => {
	it('picks aggs by field', () => {
		expect(aggsFor()).toEqual(['count']);
		expect(aggsFor(ds.fields[3])).toEqual(['count_distinct', 'sum', 'avg', 'min', 'max']);
		expect(aggsFor(ds.fields[1])).toEqual(['count_distinct']);
		expect(aggsFor(ds.fields[5])).toEqual([]);
	});
	it('picks ops by kind', () => {
		expect(opsFor(ds.fields[1])).toEqual(['eq', 'in', 'not_in']);
		expect(opsFor(ds.fields[3])).toEqual(['eq', 'gt', 'gte', 'lt', 'lte', 'between']);
		expect(opsFor(ds.fields[4])).toEqual(['eq']);
		expect(opsFor(ds.fields[0])).toEqual([]);
	});
});

describe('validateBuilder', () => {
	it('accepts the default', () => expect(validateBuilder(ds, base())).toEqual([]));
	it('measure count 1..5', () => {
		expect(has(base({ measures: [] }), 'measureCount')).toBe(true);
		expect(has(base({ measures: Array(6).fill({ agg: 'count' }) }), 'measureCount')).toBe(true);
	});
	it('count takes no field', () => expect(has(base({ measures: [{ agg: 'count', field: 'total' }] }), 'countNoField')).toBe(true));
	it('agg must fit field', () => {
		expect(has(base({ measures: [{ agg: 'sum', field: 'status' }] }), 'measureField')).toBe(true);
		expect(has(base({ measures: [{ agg: 'sum' }] }), 'measureField')).toBe(true);
		expect(has(base({ measures: [{ agg: 'count_distinct', field: 'note' }] }), 'measureField')).toBe(true);
		expect(
			validateBuilder(
				ds,
				base({
					measures: [
						{ agg: 'sum', field: 'total' },
						{ agg: 'count_distinct', field: 'plan' },
					],
				}),
			),
		).toEqual([]);
	});
	it('dimension rules', () => {
		const noGrain = { ...base().time, grain: '' as const };
		expect(has(base({ dimensions: ['note'] }), 'dimensionField')).toBe(true);
		expect(has(base({ time: noGrain, dimensions: ['status', 'status'] }), 'dimensionDuplicate')).toBe(true);
		expect(has(base({ time: noGrain, dimensions: ['status', 'plan', 'paid'] }), 'dimensionCount')).toBe(true);
		expect(validateBuilder(ds, base({ time: noGrain, dimensions: ['status', 'plan'] }))).toEqual([]);
		expect(has(base({ dimensions: ['status', 'plan'] }), 'dimensionCount')).toBe(true);
	});
	it('filter count and field', () => {
		const f = { field: 'plan', op: 'eq' as const, value: ['x'] };
		expect(has(base({ filters: Array(11).fill(f) }), 'filterCount')).toBe(true);
		expect(has(base({ filters: [{ ...f, field: 'note' }] }), 'filterField')).toBe(true);
		expect(has(base({ filters: [{ ...f, field: 'nope' }] }), 'filterField')).toBe(true);
	});
	it('filter ops by kind', () => {
		expect(has(base({ filters: [{ field: 'plan', op: 'gt', value: ['1'] }] }), 'filterOp')).toBe(true);
		expect(has(base({ filters: [{ field: 'paid', op: 'in', value: ['true'] }] }), 'filterOp')).toBe(true);
	});
	it('filter value counts', () => {
		const v = (op: 'eq' | 'in' | 'between' | 'gt', value: string[], field = 'total') =>
			has(base({ filters: [{ field, op, value }] }), 'filterValueCount');
		expect(v('eq', [], 'plan')).toBe(true);
		expect(v('eq', ['a', 'b'], 'plan')).toBe(true);
		expect(v('in', [], 'plan')).toBe(true);
		expect(v('in', ['a', 'b'], 'plan')).toBe(false);
		expect(v('between', ['1'])).toBe(true);
		expect(v('between', ['1', '2', '3'])).toBe(true);
		expect(v('gt', ['1', '2'])).toBe(true);
		expect(v('gt', ['1'])).toBe(false);
	});
	it('between order and numeric values', () => {
		expect(has(base({ filters: [{ field: 'total', op: 'between', value: ['5', '2'] }] }), 'filterBetween')).toBe(true);
		expect(validateBuilder(ds, base({ filters: [{ field: 'total', op: 'between', value: ['2', '5'] }] }))).toEqual([]);
		expect(has(base({ filters: [{ field: 'total', op: 'gt', value: ['abc'] }] }), 'filterNumeric')).toBe(true);
	});
	it('enum membership', () => {
		expect(has(base({ filters: [{ field: 'status', op: 'in', value: ['A', 'Z'] }] }), 'filterEnum')).toBe(true);
		expect(validateBuilder(ds, base({ filters: [{ field: 'status', op: 'in', value: ['A', 'B'] }] }))).toEqual([]);
	});
	it('time field must be time', () => expect(has(base({ time: { ...base().time, field: 'plan' } }), 'timeField')).toBe(true));
	it('range validity and max days', () => {
		const capped = { ...ds, max_range_days: 7 };
		const t = (range: string) => base({ time: { ...base().time, range } });
		expect(has(t('bogus'), 'range')).toBe(true);
		expect(has(t('2026-10-05..2026-10-01'), 'range')).toBe(true);
		expect(has(t('last_30_days'), 'rangeTooLong', capped)).toBe(true);
		expect(has(t('2026-10-01..2026-10-09'), 'rangeTooLong', capped)).toBe(true);
		expect(has(t('2026-10-01..2026-10-08'), 'rangeTooLong', capped)).toBe(false);
		expect(has(t('last_7_days'), 'rangeTooLong', capped)).toBe(false);
	});
	it('compare not on usage', () => {
		const usage = { ...ds, key: 'usage' };
		expect(has(base({ compare: 'previous_period' }), 'compareUnsupported', usage)).toBe(true);
		expect(has(base({ compare: 'previous_period' }), 'compareUnsupported')).toBe(false);
	});
});

describe('resolveDefinition', () => {
	const now = new Date('2026-10-14T12:00:00Z');
	it('turns a preset into an absolute range', () => {
		const r = resolveDefinition(base({ time: { field: 'created_at', range: 'this_quarter', grain: 'month' } }), now);
		expect(r.time.range).toBe('2026-10-01..2026-10-14');
	});
	it('keeps absolute ranges and does not mutate', () => {
		const d = base({ time: { field: 'created_at', range: '2026-01-01..2026-02-01' } });
		expect(resolveDefinition(d, now).time.range).toBe('2026-01-01..2026-02-01');
		const p = base();
		resolveDefinition(p, now);
		expect(p.time.range).toBe('last_30_days');
	});
});

describe('helpers', () => {
	it('defaultDefinition', () => {
		expect(defaultDefinition(ds)).toMatchObject({
			measures: [{ agg: 'count' }],
			time: { field: 'created_at', range: 'last_30_days', grain: 'month' },
		});
		expect(defaultDefinition({ ...ds, max_range_days: 7 }).time.range).toBe('last_7_days');
	});
	it('isDatasetDefinition', () => {
		expect(isDatasetDefinition(base())).toBe(true);
		expect(isDatasetDefinition({ family: 'report' })).toBe(false);
		expect(isDatasetDefinition(undefined)).toBe(false);
	});
	it('measureLabel uses translator', () => {
		const t = (k: string, o?: Record<string, unknown>) => `${k}:${o?.field}`;
		expect(measureLabel(ds, { agg: 'sum', field: 'total' }, t)).toBe('builder.agg.sum:Total');
	});
	it('sameDatasetDefinition ignores key order and empty defaults', () => {
		const a = base();
		const b = JSON.parse(JSON.stringify(a)) as DatasetDefinition;
		b.time = { grain: 'month', range: a.time.range, field: a.time.field };
		expect(sameDatasetDefinition(a, b)).toBe(true);
		expect(sameDatasetDefinition({ ...a, dimensions: [] }, a)).toBe(true);
		expect(sameDatasetDefinition({ ...a, limit: 5 }, a)).toBe(false);
	});
});

describe('withTopN', () => {
	it('adds top-N to breakdowns only', () => {
		const top = withTopN({ ...base(), time: { ...base().time, grain: '' }, dimensions: ['status'] });
		expect(top.limit).toBe(100);
		expect(top.sort).toEqual([{ field: 'm0', dir: 'desc' }]);
		expect(withTopN(base()).limit).toBeUndefined();
		expect(withTopN({ ...base(), dimensions: ['status'] }).sort).toBeUndefined();
		expect(withTopN({ ...base(), time: { ...base().time, grain: '' } }).limit).toBeUndefined();
	});
	it('does not make a saved breakdown dirty', () => {
		const d = { ...base(), time: { ...base().time, grain: '' as const }, dimensions: ['status'] };
		expect(sameDatasetDefinition(d, withTopN(d))).toBe(true);
	});
});
