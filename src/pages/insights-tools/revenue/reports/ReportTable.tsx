import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/molecules';
import { ReportCatalogEntry, ReportGrain, ReportQueryResult } from '@/types/dto/Reports';
import DeltaChip from './DeltaChip';
import { ValueFormat, currenciesOf, deltaDisplay, formatValue, isBucketInProgress, metricIndexes, rowsFor, totalsFor } from './reportMath';

export interface TableMeasure {
	key: string;
	label: string;
	valueType: ValueFormat;
}

interface Props {
	entry: ReportCatalogEntry;
	result: ReportQueryResult;
	currency: string;
	grain?: ReportGrain | '';
	now: Date;
	measures?: TableMeasure[];
}

const ReportTable = ({ entry, result, currency, grain, now, measures }: Props) => {
	const { t } = useTranslation('settings');
	const dimCols = result.columns.map((c, i) => ({ c, i })).filter(({ c }) => c.role === 'dimension' && c.name !== 'currency');
	const cur = currency || currenciesOf(result)[0] || '';
	const rows = rowsFor(result, cur);
	const cols = (measures ?? [{ key: entry.key, label: entry.name, valueType: entry.value_type }]).map((m) => ({
		...m,
		idx: metricIndexes(result, m.key),
		total: totalsFor(result, m.key, cur),
	}));
	const hasPrev = cols.some((m) => m.idx.prev >= 0);
	const daysLabel = (v: string) => t('insightsTools.revenue.reports.daysUnit', { value: v });
	const fmt = (v: number, type: ValueFormat) => formatValue(v, type, cur, daysLabel);
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
						{cols.map((m) => (
							<Fragment key={m.key}>
								<TableHead className='text-end'>{m.label}</TableHead>
								{hasPrev && <TableHead className='text-end'>{t('insightsTools.revenue.reports.previous')}</TableHead>}
								{hasPrev && <TableHead className='text-end'>{t('insightsTools.revenue.reports.change')}</TableHead>}
							</Fragment>
						))}
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
							{cols.map(({ key, idx, valueType }) => (
								<Fragment key={key}>
									<TableCell className='text-end tabular-nums'>{fmt(Number(r[idx.current] ?? 0), valueType)}</TableCell>
									{hasPrev && <TableCell className='text-end tabular-nums'>{fmt(Number(r[idx.prev] ?? 0), valueType)}</TableCell>}
									{hasPrev && (
										<TableCell className='text-end'>
											<DeltaChip
												display={deltaDisplay(
													r[idx.current],
													r[idx.prev],
													idx.pct >= 0 ? r[idx.pct] : undefined,
													entry.improvement === 'higher',
												)}
											/>
										</TableCell>
									)}
								</Fragment>
							))}
						</TableRow>
					))}
					{showTotal && (
						<TableRow>
							<TableCell colSpan={Math.max(dimCols.length, 1)} className='font-medium'>
								{t('insightsTools.revenue.reports.total')}
							</TableCell>
							{cols.map(({ key, total, valueType }) => (
								<Fragment key={key}>
									<TableCell className='text-end font-medium tabular-nums'>{fmt(total.current, valueType)}</TableCell>
									{hasPrev && <TableCell className='text-end tabular-nums'>{fmt(total.prev ?? 0, valueType)}</TableCell>}
									{hasPrev && (
										<TableCell className='text-end'>
											<DeltaChip
												display={deltaDisplay(String(total.current), String(total.prev ?? 0), undefined, entry.improvement === 'higher')}
											/>
										</TableCell>
									)}
								</Fragment>
							))}
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
};

export default ReportTable;
