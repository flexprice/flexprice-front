import { BuilderFilter, BuilderFilterOp, Dataset, DatasetDefinition, DatasetField, MeasureAgg, MeasureSpec } from '@/types/dto/Reports';
import { PRESET_MAX_DAYS, RANGE_PRESETS, RangePreset, rangeForPreset } from '../reportMath';

export type Translate = (key: string, opts?: Record<string, unknown>) => string;

export const MAX_MEASURES = 5;
export const MAX_DIMENSIONS = 2;
export const MAX_FILTERS = 10;

const ABSOLUTE_RANGE = /^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/;
const DAY_MS = 86_400_000;

export const isDatasetDefinition = (d: unknown): d is DatasetDefinition =>
	(d as { family?: string } | null | undefined)?.family === 'dataset';

export const aggsFor = (field?: DatasetField): MeasureAgg[] => {
	if (!field) return ['count'];
	const out: MeasureAgg[] = [];
	if (field.measure || field.group) out.push('count_distinct');
	if (field.kind === 'number' && field.measure) out.push('sum', 'avg', 'min', 'max');
	return out;
};

export const opsFor = (field: DatasetField): BuilderFilterOp[] => {
	switch (field.kind) {
		case 'string':
			return ['eq', 'in', 'not_in'];
		case 'number':
			return ['eq', 'gt', 'gte', 'lt', 'lte', 'between'];
		case 'bool':
			return ['eq'];
		default:
			return [];
	}
};

const isPreset = (r: string): r is RangePreset => (RANGE_PRESETS as string[]).includes(r);

const rangeDays = (range: string): number | undefined => {
	if (isPreset(range)) return PRESET_MAX_DAYS[range];
	const m = ABSOLUTE_RANGE.exec(range);
	if (!m) return undefined;
	const days = (Date.parse(m[2]) - Date.parse(m[1])) / DAY_MS;
	return Number.isFinite(days) && days > 0 ? days : undefined;
};

const isNum = (v: string) => v.trim() !== '' && Number.isFinite(Number(v));

const filterErrors = (f: BuilderFilter, field: DatasetField | undefined): string[] => {
	if (!field || !field.filter) return ['builder.errors.filterField'];
	if (!opsFor(field).includes(f.op)) return ['builder.errors.filterOp'];
	const n = f.value.length;
	const errs: string[] = [];
	if (f.op === 'in' || f.op === 'not_in' ? n < 1 : f.op === 'between' ? n !== 2 : n !== 1) errs.push('builder.errors.filterValueCount');
	if (field.kind === 'number' && f.value.some((v) => !isNum(v))) errs.push('builder.errors.filterNumeric');
	else if (f.op === 'between' && n === 2 && Number(f.value[0]) > Number(f.value[1])) errs.push('builder.errors.filterBetween');
	if (field.enum && f.value.some((v) => !field.enum?.includes(v))) errs.push('builder.errors.filterEnum');
	return errs;
};

export const validateBuilder = (ds: Dataset, def: DatasetDefinition): string[] => {
	const errs: string[] = [];
	const byKey = (k?: string) => ds.fields.find((f) => f.key === k);

	if (def.measures.length < 1 || def.measures.length > MAX_MEASURES) errs.push('builder.errors.measureCount');
	for (const m of def.measures) {
		if (m.agg === 'count') {
			if (m.field) errs.push('builder.errors.countNoField');
			continue;
		}
		const f = byKey(m.field);
		if (!f || !aggsFor(f).includes(m.agg)) errs.push('builder.errors.measureField');
	}

	const dims = def.dimensions ?? [];
	if (dims.length > (def.time.grain ? 1 : MAX_DIMENSIONS)) errs.push('builder.errors.dimensionCount');
	if (new Set(dims).size !== dims.length) errs.push('builder.errors.dimensionDuplicate');
	if (dims.some((k) => !byKey(k)?.group)) errs.push('builder.errors.dimensionField');

	const filters = def.filters ?? [];
	if (filters.length > MAX_FILTERS) errs.push('builder.errors.filterCount');
	for (const f of filters) errs.push(...filterErrors(f, byKey(f.field)));

	if (byKey(def.time.field)?.kind !== 'time') errs.push('builder.errors.timeField');
	const days = rangeDays(def.time.range);
	if (days === undefined) errs.push('builder.errors.range');
	else if (ds.max_range_days && days > ds.max_range_days) errs.push('builder.errors.rangeTooLong');

	if (def.compare && ds.key === 'usage') errs.push('builder.errors.compareUnsupported');

	return [...new Set(errs)];
};

export const BREAKDOWN_LIMIT = 100;

export const withTopN = (def: DatasetDefinition): DatasetDefinition => {
	const { sort: _sort, limit: _limit, ...rest } = def;
	return def.dimensions?.length && !def.time.grain ? { ...rest, limit: BREAKDOWN_LIMIT, sort: [{ field: 'm0', dir: 'desc' }] } : rest;
};

export const resolveDefinition = (def: DatasetDefinition, now: Date): DatasetDefinition => ({
	...withTopN(def),
	time: { ...def.time, range: isPreset(def.time.range) ? rangeForPreset(def.time.range, now) : def.time.range },
});

export const measureLabel = (ds: Dataset, m: MeasureSpec, t: Translate): string => {
	const field = ds.fields.find((f) => f.key === m.field)?.label ?? '';
	return t(`builder.agg.${m.agg}`, { field });
};

export const defaultDefinition = (ds: Dataset): DatasetDefinition => ({
	family: 'dataset',
	dataset: ds.key,
	measures: [{ agg: 'count' }],
	time: {
		field: ds.fields.find((f) => f.kind === 'time')?.key ?? '',
		range: ds.max_range_days && ds.max_range_days < 30 ? 'last_7_days' : 'last_30_days',
		grain: 'month',
	},
	display: 'chart',
});

export const sameDatasetDefinition = (a: DatasetDefinition, b: DatasetDefinition): boolean => {
	const canon = (raw: DatasetDefinition) => {
		const d = raw.dimensions?.length && !raw.time.grain ? withTopN(raw) : raw;
		return JSON.stringify({
			family: d.family,
			dataset: d.dataset,
			measures: d.measures.map((m) => ({ agg: m.agg, field: m.field ?? '' })),
			dimensions: d.dimensions ?? [],
			filters: (d.filters ?? []).map((f) => ({ field: f.field, op: f.op, value: f.value })),
			time: { field: d.time.field, range: d.time.range, grain: d.time.grain ?? '' },
			compare: d.compare ?? '',
			sort: (d.sort ?? []).map((s) => ({ field: s.field, dir: s.dir })),
			limit: d.limit ?? 0,
			display: d.display ?? '',
		});
	};
	return canon(a) === canon(b);
};
