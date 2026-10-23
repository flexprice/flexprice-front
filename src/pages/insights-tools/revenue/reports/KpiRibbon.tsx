import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueries } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Select } from '@/components/atoms';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportCatalogEntry, ReportQueryResult } from '@/types/dto/Reports';
import DeltaChip from './DeltaChip';
import {
	currenciesOf,
	deltaDisplay,
	formatValue,
	isToDatePreset,
	metricIndexes,
	RANGE_PRESETS,
	RangePreset,
	rangeForPreset,
} from './reportMath';
import { csvFilename, downloadCsv, summaryCsv } from './reportCsv';
import { reportRunOptions } from './useReports';

const DEFAULT_CURRENCY = 'usd';
const HEADLINES = ['invoice_total', 'total_receivables', 'active_customers', 'arpu'];

const Tile = ({
	entry,
	data,
	isLoading,
	currency,
	toDate,
}: {
	entry: ReportCatalogEntry;
	data: ReportQueryResult | undefined;
	isLoading: boolean;
	currency: string;
	toDate: boolean;
}) => {
	const { t } = useTranslation('settings');
	const ci = data ? data.columns.findIndex((c) => c.name === 'currency') : -1;
	const row = data ? (ci < 0 ? data.rows[0] : data.rows.find((r) => r[ci] === currency)) : undefined;
	const cur = currency || DEFAULT_CURRENCY;
	const idx = data ? metricIndexes(data, entry.key) : { current: -1, prev: -1, pct: -1 };
	const daysLabel = (v: string) => t('insightsTools.revenue.reports.daysUnit', { value: v });
	return (
		<Card className='flex flex-col gap-2 p-4'>
			<span className='text-sm text-muted-foreground'>{entry.name}</span>
			{isLoading ? (
				<Skeleton className='h-7 w-28' />
			) : (
				<span className='text-2xl font-semibold tabular-nums'>
					{row && idx.current >= 0 ? formatValue(Number(row[idx.current] ?? 0), entry.value_type, cur, daysLabel) : '—'}
				</span>
			)}
			{toDate && entry.kind !== 'snapshot' && (
				<span className='-mt-1 text-xs text-muted-foreground'>{t('insightsTools.revenue.reports.toDate')}</span>
			)}
			{entry.kind === 'snapshot' ? (
				<span className='text-xs text-muted-foreground'>{t('insightsTools.revenue.reports.pointInTime')}</span>
			) : (
				row &&
				idx.current >= 0 && (
					<DeltaChip
						display={deltaDisplay(
							row[idx.current],
							idx.prev >= 0 ? row[idx.prev] : undefined,
							idx.pct >= 0 ? row[idx.pct] : undefined,
							entry.improvement === 'higher',
						)}
					/>
				)
			)}
		</Card>
	);
};

interface RibbonProps {
	entries: ReportCatalogEntry[];
	now: Date;
}

const KpiRibbon = ({ entries, now }: RibbonProps) => {
	const { t } = useTranslation('settings');
	const [preset, setPreset] = useState<RangePreset>('this_month');
	const [picked, setPicked] = useState('');
	const tiles = HEADLINES.map((k) => entries.find((e) => e.key === k)).filter((e): e is ReportCatalogEntry => !!e);
	const range = rangeForPreset(preset, now);
	const results = useQueries({
		queries: tiles.map((e) =>
			reportRunOptions(e.key, {
				shape: 'scalar',
				range,
				...(e.supports_compare && e.kind !== 'snapshot' ? { compare: 'previous_period' as const } : {}),
			}),
		),
	});
	if (tiles.length === 0) return null;
	const currencies = [...new Set(results.flatMap((r) => (r.data ? currenciesOf(r.data) : [])))];
	const currency = currencies.includes(picked) ? picked : (currencies[0] ?? '');
	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-wrap items-end gap-4'>
				<Select
					label={t('insightsTools.revenue.reports.summaryPeriod')}
					value={preset}
					options={RANGE_PRESETS.map((p) => ({ value: p, label: t(`insightsTools.revenue.reports.presets.${p}`) }))}
					onChange={(v) => v && setPreset(v as RangePreset)}
				/>
				{currencies.length > 0 && (
					<Select
						label={t('insightsTools.revenue.reports.summaryCurrency')}
						value={currency}
						options={currencies.map((c) => ({ value: c, label: c.toUpperCase() }))}
						onChange={(v) => v && setPicked(v)}
					/>
				)}
				<Button
					type='button'
					variant='outline'
					size='sm'
					disabled={results.some((r) => r.isFetching) || !results.some((r) => r.data?.rows.length)}
					onClick={() =>
						downloadCsv(
							csvFilename('summary', range),
							summaryCsv(
								tiles.map((entry, i) => ({ entry, data: results[i].data })),
								range,
							),
						)
					}>
					<Download className='h-4 w-4' />
					{t('insightsTools.revenue.reports.downloadSummary')}
				</Button>
			</div>
			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
				{tiles.map((e, i) => (
					<Tile
						key={e.key}
						entry={e}
						data={results[i].data}
						isLoading={results[i].isLoading || results[i].isPlaceholderData}
						currency={currency}
						toDate={isToDatePreset(preset)}
					/>
				))}
			</div>
		</div>
	);
};

export default KpiRibbon;
