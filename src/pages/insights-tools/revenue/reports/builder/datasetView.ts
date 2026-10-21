import { Dataset, DatasetDefinition, ReportCatalogEntry, ReportQueryResult } from '@/types/dto/Reports';
import type { TableMeasure } from '../ReportTable';
import { Translate, measureLabel } from './builderModel';

export const measureColumns = (ds: Dataset, def: DatasetDefinition, result: ReportQueryResult | undefined, t: Translate): TableMeasure[] =>
	def.measures.map((m, i) => {
		const key = `m${i}`;
		const counted = m.agg === 'count' || m.agg === 'count_distinct';
		const money = !counted && !!ds.fields.find((f) => f.key === m.field)?.money;
		return {
			key,
			label: result?.meta.measure_labels?.[key] || measureLabel(ds, m, t),
			valueType: counted ? 'count' : money ? 'money' : 'number',
		};
	});

// Built-in chart renders m0 only.
export const datasetEntry = (ds: Dataset, def: DatasetDefinition, measures: TableMeasure[]): ReportCatalogEntry => ({
	key: measures[0]?.key ?? 'm0',
	name: measures[0]?.label ?? '',
	description: ds.description,
	category: 'billing',
	// Ratio skips summed totals.
	kind: 'ratio',
	value_type: measures[0]?.valueType === 'money' ? 'money' : 'count',
	improvement: 'higher',
	shapes: [],
	default_shape: def.time.grain ? 'timeseries' : 'breakdown',
	dimensions: ds.fields.filter((f) => f.group).map((f) => ({ key: f.key, label: f.label })),
	grains: [],
	supports_compare: false,
});

// Shows names instead of ids.
export const withDimLabels = (result: ReportQueryResult): ReportQueryResult => {
	const names = result.columns.map((c) => c.name);
	const labelOf = new Map(names.map((n, i) => [i, names.indexOf(`${n}_label`)] as const).filter(([, j]) => j >= 0));
	if (!labelOf.size) return result;
	const dropped = new Set(labelOf.values());
	const keep = (_: unknown, i: number) => !dropped.has(i);
	return {
		...result,
		columns: result.columns.filter(keep),
		rows: result.rows.map((r) =>
			r
				.map((v, i) => {
					const j = labelOf.get(i);
					return j !== undefined && r[j] ? r[j] : v;
				})
				.filter(keep),
		),
	};
};
