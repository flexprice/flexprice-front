import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/molecules';
import { ReportCatalogEntry, ReportQueryResult } from '@/types/dto/Reports';
import DeltaChip from './DeltaChip';
import { deltaDisplay, formatValue, metricIndexes, totalsFor } from './reportMath';

interface Props {
	entry: ReportCatalogEntry;
	result: ReportQueryResult;
	currency: string;
}

const ReportTable = ({ entry, result, currency }: Props) => {
	const { t } = useTranslation('settings');
	const idx = metricIndexes(result, entry.key);
	const ci = result.columns.findIndex((c) => c.name === 'currency');
	const dimCols = result.columns.map((c, i) => ({ c, i })).filter(({ c }) => c.role === 'dimension' && c.name !== 'currency');
	const rows = result.rows.filter((r) => ci < 0 || !currency || r[ci] === currency);
	const hasPrev = idx.prev >= 0;
	const fmt = (v: string | undefined) => formatValue(Number(v ?? 0), entry.value_type, currency);
	const total = totalsFor(result, entry.key, currency);
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
						<TableHead className='text-right'>{entry.name}</TableHead>
						{hasPrev && <TableHead className='text-right'>{t('insightsTools.revenue.reports.previous')}</TableHead>}
						{hasPrev && <TableHead className='text-right'>{t('insightsTools.revenue.reports.change')}</TableHead>}
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((r, n) => (
						<TableRow key={n}>
							{dimCols.map(({ c, i }) => (
								<TableCell key={c.name}>{c.name === 'bucket' ? r[i].slice(0, 10) : r[i]}</TableCell>
							))}
							<TableCell className='text-right tabular-nums'>{fmt(r[idx.current])}</TableCell>
							{hasPrev && <TableCell className='text-right tabular-nums'>{fmt(r[idx.prev])}</TableCell>}
							{hasPrev && (
								<TableCell className='text-right'>
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
							<TableCell className='text-right font-medium tabular-nums'>
								{formatValue(total.current, entry.value_type, currency)}
							</TableCell>
							{hasPrev && (
								<TableCell className='text-right tabular-nums'>{formatValue(total.prev ?? 0, entry.value_type, currency)}</TableCell>
							)}
							{hasPrev && (
								<TableCell className='text-right'>
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
