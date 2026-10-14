import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Select } from '@/components/atoms';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomReport, Dataset, DatasetDefinition } from '@/types/dto/Reports';
import CustomReportActions from '../CustomReportActions';
import ReportChart, { chartSupported } from '../ReportChart';
import ReportTable from '../ReportTable';
import { csvBaseName } from '../customReports';
import { csvFilename, downloadCsv, reportRowsCsv } from '../reportCsv';
import { currenciesOf } from '../reportMath';
import { useDatasetRun } from '../useReports';
import { isDatasetDefinition, resolveDefinition, sameDatasetDefinition, validateBuilder } from './builderModel';
import { datasetEntry, measureColumns, withDimLabels } from './datasetView';
import ReportBuilder from './ReportBuilder';

const PREVIEW_DEBOUNCE_MS = 400;

interface Props {
	datasets: Dataset[];
	value: DatasetDefinition;
	onChange: (def: DatasetDefinition) => void;
	custom?: CustomReport;
	now: Date;
	onSaved: (id: string) => void;
	onDeleted: () => void;
}

const BuilderPanel = ({ datasets, value, onChange, custom, now, onSaved, onDeleted }: Props) => {
	const { t } = useTranslation('settings', { keyPrefix: 'insightsTools.revenue.reports' });
	const ds = datasets.find((d) => d.key === value.dataset);
	const valid = !!ds && validateBuilder(ds, value).length === 0;
	const [staleOnOpen] = useState(() => !!custom && !valid);
	const resolved = useMemo(() => (valid ? resolveDefinition(value, now) : undefined), [valid, value, now]);
	const [query, setQuery] = useState<DatasetDefinition>();
	useEffect(() => {
		const timer = window.setTimeout(() => setQuery(resolved), PREVIEW_DEBOUNCE_MS);
		return () => window.clearTimeout(timer);
	}, [resolved]);
	const run = useDatasetRun(query);
	const [pickedCurrency, setPickedCurrency] = useState('');

	const measures = ds ? measureColumns(ds, value, run.data, t) : [];
	const entry = ds && datasetEntry(ds, value, measures);
	const shown = run.data && withDimLabels(run.data);
	const currencies = run.data ? currenciesOf(run.data) : [];
	const currency = currencies.includes(pickedCurrency) ? pickedCurrency : (currencies[0] ?? '');
	const grain = value.time.grain || undefined;
	const dirty = !!custom && isDatasetDefinition(custom.definition) && !sameDatasetDefinition(value, custom.definition);
	const showChart =
		!!entry && !!shown && value.display !== 'table' && !(value.time.grain && value.dimensions?.length) && chartSupported(entry, shown);

	return (
		<>
			<div className='flex items-start justify-between gap-2'>
				<div className='flex flex-col'>
					<h2 className='text-lg font-semibold'>{custom?.name ?? t('builder.newReport')}</h2>
					<span className='text-sm text-muted-foreground'>{t('builder.listSubtitle', { dataset: ds?.label ?? value.dataset })}</span>
				</div>
				<div className='flex flex-wrap items-center justify-end gap-2'>
					<CustomReportActions
						custom={custom}
						definition={valid ? value : undefined}
						dirty={dirty}
						onSaved={onSaved}
						onDeleted={onDeleted}
					/>
					<Button
						type='button'
						variant='outline'
						size='sm'
						disabled={!run.data?.rows.length || !query || !entry || run.isFetching}
						onClick={() =>
							run.data &&
							query &&
							entry &&
							downloadCsv(
								csvFilename(csvBaseName(custom?.name || 'custom_report', 'custom_report'), query.time.range),
								reportRowsCsv(entry, run.data, grain, now, measures),
							)
						}>
						<Download className='h-4 w-4' />
						{t('downloadCsv')}
					</Button>
				</div>
			</div>
			{staleOnOpen && !valid && (
				<div role='status' className='rounded-md border border-amber-200 bg-amber-50 p-3 text-sm'>
					{t('needsEdit')}
				</div>
			)}
			<ReportBuilder datasets={datasets} value={value} onChange={onChange} />
			{valid && entry && (
				<div className='flex flex-col gap-4 border-t pt-4'>
					{currencies.length > 1 && (
						<Select
							className='w-32'
							label={t('currency')}
							value={currency}
							options={currencies.map((c) => ({ value: c, label: c.toUpperCase() }))}
							onChange={(v) => v && setPickedCurrency(v)}
						/>
					)}
					{!run.data && !run.isError && <Skeleton className='h-72 w-full' />}
					{run.isError && (
						<div role='alert' className='flex flex-col gap-1 rounded-md border border-red-200 bg-red-50 p-4 text-sm'>
							<span className='font-medium'>{t('errorTitle')}</span>
							<span>{(run.error as Error)?.message}</span>
						</div>
					)}
					{shown && shown.rows.length === 0 && <span className='text-sm text-muted-foreground'>{t('noData')}</span>}
					{shown && shown.rows.length > 0 && (
						<div className={run.isFetching ? 'flex flex-col gap-4 opacity-60' : 'flex flex-col gap-4'}>
							{value.display !== 'table' && !showChart && <span className='text-xs text-muted-foreground'>{t('unsupportedShape')}</span>}
							{showChart && (
								<ReportChart entry={entry} result={shown} currency={currency} grain={grain} now={now} valueType={measures[0]?.valueType} />
							)}
							<ReportTable entry={entry} result={shown} currency={currency} grain={grain} now={now} measures={measures} />
							{query?.limit && shown.rows.length === query.limit && (
								<span className='text-xs text-muted-foreground'>
									{t('builder.topN', { count: query.limit, measure: measures[0]?.label })}
								</span>
							)}
						</div>
					)}
				</div>
			)}
		</>
	);
};

export default BuilderPanel;
