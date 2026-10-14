import { CustomReportDefinition, ReportCatalogEntry } from '@/types/dto/Reports';
import { buildRequest, controlsForEntry, defaultControls, RANGE_PRESETS, RangePreset, ReportControls } from './reportMath';

export const effectiveControls = (c: ReportControls, currencies: string[]): ReportControls => ({
	...c,
	currency: currencies.includes(c.currency) ? c.currency : '',
});

export const toDefinition = (entry: ReportCatalogEntry, c: ReportControls, now: Date): CustomReportDefinition => {
	const req = buildRequest(entry, c, now);
	return {
		family: 'report',
		metrics: [entry.key],
		shape: req.shape,
		dimensions: req.dimensions,
		filters: req.filters,
		time: { range: c.preset, grain: req.grain ?? '' },
		compare: req.compare,
		currency: c.currency || undefined,
		display: c.view,
	};
};

export const fromDefinition = (entry: ReportCatalogEntry, def: CustomReportDefinition): { controls: ReportControls; valid: boolean } => {
	const base = defaultControls(entry);
	const preset = RANGE_PRESETS.find((p) => p === def.time.range) as RangePreset | undefined;
	const saved: ReportControls = {
		preset: preset ?? base.preset,
		grain: def.time.grain || '',
		currency: def.currency ?? '',
		groupBy: def.shape === 'breakdown' ? (def.dimensions?.[0] ?? '') : '',
		compare: def.compare ?? 'none',
		view: def.display ?? 'chart',
		filters: def.filters ?? [],
	};
	const controls = controlsForEntry(entry, saved);
	const valid =
		!!preset &&
		controls.preset === saved.preset &&
		controls.filters.length === saved.filters.length &&
		(!saved.groupBy || controls.groupBy === saved.groupBy) &&
		(!saved.grain || controls.grain === saved.grain);
	return { controls, valid };
};

const canon = (d: CustomReportDefinition) =>
	JSON.stringify({
		family: d.family,
		metrics: d.metrics,
		shape: d.shape,
		dimensions: d.dimensions ?? [],
		filters: (d.filters ?? []).map((f) => ({ field: f.field, op: f.op, value: f.value })),
		time: { range: d.time.range, grain: d.time.grain ?? '' },
		compare: d.compare ?? '',
		currency: d.currency ?? '',
		display: d.display ?? '',
	});

export const sameDefinition = (a: CustomReportDefinition, b: CustomReportDefinition) => canon(a) === canon(b);

export const csvBaseName = (name: string, fallback: string) =>
	name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '') || fallback;
