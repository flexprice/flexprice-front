import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/molecules';
import { ReportCatalogEntry, ReportGrain, ReportQueryResult } from '@/types/dto/Reports';
import DeltaChip from './DeltaChip';
import { currenciesOf, deltaDisplay, formatValue, isBucketInProgress, metricIndexes, rowsFor, totalsFor } from './reportMath';

interface Props {
	entry: ReportCatalogEntry;
	result: ReportQueryResult;
	currency: string;
	grain?: ReportGrain | '';
	now: Date;
}

const ReportTable = ({ entry, result, currency, grain, now }: Props) => {
	const { t } = useTranslation('settings');
	const idx = metricIndexes(result, entry.key);
	const dimCols = result.columns.map((c, i) => ({ c, i })).filter(({ c }) => c.role === 'dimension' && c.name !== 'currency');
	const cur = currency || currenciesOf(result)[0] || '';
	const rows = rowsFor(result, cur);
	const hasPrev = idx.prev >= 0;
	const daysLabel = (v: string) => t('insightsTools.revenue.reports.daysUnit', { value: v });
	const fmt = (v: string | undefined) => formatValue(Number(v ?? 0), entry.value_type, cur, daysLabel);
	const total = totalsFor(result, entry.key, cur);
	const showTotal = entry.kind === 'flow' && rows.length > 1;

	return (
		<div className='overflow-x-auto'>
			<Table>
				<TableHeader>
					<TableRow>
						{dimCols.map(({ c }) => (
							<TableHead key={c.name}>
								{entry.dimensions.find((d) => d.key === c.name)?.label ?? (c.name === 'bucket' ? '' : c.name)}
							</TableHead>
						))}
						<TableHead className='text-end'>{entry.name}</TableHead>
						{hasPrev && <TableHead className='text-end'>{t('insightsTools.revenue.reports.previous')}</TableHead>}
						{hasPrev && <TableHead className='text-end'>{t('insightsTools.revenue.reports.change')}</TableHead>}
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((r, n) => (
						<TableRow key={n}>
							{dimCols.map(({ c, i }) => (
								<TableCell key={c.name}>
									{c.name === 'bucket' ? r[i].slice(0, 10) : r[i]}
									{c.name === 'bucket' && isBucketInProgress(r[i], grain, now) && (
										<span className='ms-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground'>
											{t('insightsTools.revenue.reports.inProgress')}
										</span>
									)}
								</TableCell>
							))}
							<TableCell className='text-end tabular-nums'>{fmt(r[idx.current])}</TableCell>
							{hasPrev && <TableCell className='text-end tabular-nums'>{fmt(r[idx.prev])}</TableCell>}
							{hasPrev && (
								<TableCell className='text-end'>
									<DeltaChip
										display={deltaDisplay(r[idx.current], r[idx.prev], idx.pct >= 0 ? r[idx.pct] : undefined, entry.higher_is_better)}
									/>
								</TableCell>
							)}
						</TableRow>
					))}
					{showTotal && (
						<TableRow>
							<TableCell colSpan={Math.max(dimCols.length, 1)} className='font-medium'>
								{t('insightsTools.revenue.reports.total')}
							</TableCell>
							<TableCell className='text-end font-medium tabular-nums'>
								{formatValue(total.current, entry.value_type, cur, daysLabel)}
							</TableCell>
							{hasPrev && (
								<TableCell className='text-end tabular-nums'>{formatValue(total.prev ?? 0, entry.value_type, cur, daysLabel)}</TableCell>
							)}
							{hasPrev && (
								<TableCell className='text-end'>
									<DeltaChip display={deltaDisplay(String(total.current), String(total.prev ?? 0), undefined, entry.higher_is_better)} />
								</TableCell>
							)}
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
};

export default ReportTable;
