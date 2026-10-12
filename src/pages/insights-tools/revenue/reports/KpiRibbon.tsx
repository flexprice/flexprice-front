import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportCatalogEntry } from '@/types/dto/Reports';
import DeltaChip from './DeltaChip';
import { currenciesOf, deltaDisplay, formatValue, metricIndexes } from './reportMath';
import { useReportRun } from './useReports';

const DEFAULT_CURRENCY = 'usd';
const HEADLINES = ['invoice_total', 'total_receivables', 'active_customers', 'arpu'];

const Tile = ({ entry, range, currency }: { entry: ReportCatalogEntry; range: string; currency: string }) => {
	const { t } = useTranslation('settings');
	const compare = entry.supports_compare && entry.kind !== 'snapshot' ? ('previous_period' as const) : undefined;
	const { data, isLoading } = useReportRun(entry.key, { shape: 'scalar', range, ...(compare ? { compare } : {}) });
	const ci = data ? data.columns.findIndex((c) => c.name === 'currency') : -1;
	const chosen = currency || (data ? currenciesOf(data)[0] : '');
	const row = data ? (ci < 0 ? data.rows[0] : data.rows.find((r) => r[ci] === chosen)) : undefined;
	const cur = (row && ci >= 0 ? row[ci] : chosen) || DEFAULT_CURRENCY;
	const idx = data ? metricIndexes(data, entry.key) : { current: -1, prev: -1, pct: -1 };
	return (
		<Card className='flex flex-col gap-2 p-4'>
			<span className='text-sm text-muted-foreground'>{entry.name}</span>
			{isLoading ? (
				<Skeleton className='h-7 w-28' />
			) : (
				<span className='text-2xl font-semibold tabular-nums'>
					{row ? formatValue(Number(row[idx.current] ?? 0), entry.value_type, cur) : '—'}
				</span>
			)}
			{entry.kind === 'snapshot' ? (
				<span className='text-xs text-muted-foreground'>{t('insightsTools.revenue.reports.pointInTime')}</span>
			) : (
				row && (
					<DeltaChip
						display={deltaDisplay(
							row[idx.current],
							idx.prev >= 0 ? row[idx.prev] : undefined,
							idx.pct >= 0 ? row[idx.pct] : undefined,
							entry.higher_is_better,
						)}
					/>
				)
			)}
		</Card>
	);
};

const KpiRibbon = ({ entries, range, currency }: { entries: ReportCatalogEntry[]; range: string; currency: string }) => {
	const tiles = HEADLINES.map((k) => entries.find((e) => e.key === k)).filter((e): e is ReportCatalogEntry => !!e);
	if (tiles.length === 0) return null;
	return (
		<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
			{tiles.map((e) => (
				<Tile key={e.key} entry={e} range={range} currency={currency} />
			))}
		</div>
	);
};

export default KpiRibbon;
