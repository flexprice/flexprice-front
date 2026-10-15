import { ReportCatalogEntry, ReportGrain, ReportQueryResult } from '@/types/dto/Reports';
import { inclusiveEnd, isBucketInProgress, metricIndexes } from './reportMath';

const cell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export const toCsv = (rows: string[][]): string => rows.map((r) => r.map(cell).join(',')).join('\r\n');

const changePct = (cur: string | undefined, prev: string | undefined, pct: string | undefined): string => {
	if (pct !== undefined && pct !== '') return pct;
	const c = Number(cur ?? 0);
	const p = Number(prev ?? 0);
	if (!p || !Number.isFinite(c) || !Number.isFinite(p)) return '';
	return (((c - p) / p) * 100).toFixed(2);
};

const at = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '') : '');

// Block spreadsheet formula injection.
export const csvSafe = (v: string) => (/^[=+\-@\t\r]/.test(v) && !Number.isFinite(Number(v)) ? `'${v}` : v);

// Every currency row, raw values, no formatting.
export const reportRowsCsv = (
	entry: ReportCatalogEntry,
	result: ReportQueryResult,
	grain: ReportGrain | '' | undefined,
	now: Date,
	measures?: { key: string; label: string }[],
): string => {
	const cols = (measures ?? [{ key: entry.key, label: entry.key }]).map((m) => ({ ...m, idx: metricIndexes(result, m.key) }));
	const ci = result.columns.findIndex((c) => c.name === 'currency');
	const dims = result.columns.map((c, i) => ({ c, i })).filter(({ c }) => c.role === 'dimension' && c.name !== 'currency');
	const bucket = dims.find(({ c }) => c.name === 'bucket');
	const hasPrev = cols.some((m) => m.idx.prev >= 0);
	const markProgress = !!bucket && !!grain;
	const prevHeaders = (label: string) => (measures ? [`${label} previous`, `${label} change_pct`] : ['previous', 'change_pct']);
	const header = [
		...dims.map(({ c }) => (c.name === 'bucket' ? 'period' : c.name)),
		...(ci >= 0 ? ['currency'] : []),
		...cols.flatMap((m) => [m.label, ...(hasPrev ? prevHeaders(m.label) : [])].map(csvSafe)),
		...(markProgress ? ['in_progress'] : []),
	];
	const rows = result.rows.map((r) => [
		...dims.map(({ c, i }) => (c.name === 'bucket' ? at(r, i).slice(0, 10) : csvSafe(at(r, i)))),
		...(ci >= 0 ? [at(r, ci)] : []),
		...cols.flatMap(({ idx }) => [
			at(r, idx.current),
			...(hasPrev ? [at(r, idx.prev), changePct(r[idx.current], r[idx.prev], idx.pct >= 0 ? r[idx.pct] : undefined)] : []),
		]),
		...(markProgress && bucket ? [String(isBucketInProgress(at(r, bucket.i), grain, now))] : []),
	]);
	return toCsv([header, ...rows]);
};

export interface SummaryTile {
	entry: ReportCatalogEntry;
	data: ReportQueryResult | undefined;
}

export const summaryCsv = (tiles: SummaryTile[], range: string): string => {
	const [from, to] = range.split('..');
	const header = ['report', 'from', 'to', 'currency', 'value', 'previous', 'change_pct'];
	const rows = tiles.flatMap(({ entry, data }) => {
		if (!data) return [];
		const idx = metricIndexes(data, entry.key);
		const ci = data.columns.findIndex((c) => c.name === 'currency');
		return data.rows.map((r) => [
			entry.key,
			from ?? '',
			to ? inclusiveEnd(to) : '',
			at(r, ci),
			at(r, idx.current),
			at(r, idx.prev),
			idx.prev >= 0 ? changePct(r[idx.current], r[idx.prev], idx.pct >= 0 ? r[idx.pct] : undefined) : '',
		]);
	});
	return toCsv([header, ...rows]);
};

export const csvFilename = (name: string, range: string): string => {
	const [from, to] = range.split('..');
	return `${name}_${from}_${to ? inclusiveEnd(to) : ''}.csv`;
};

export const downloadCsv = (filename: string, csv: string) => {
	const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
};
