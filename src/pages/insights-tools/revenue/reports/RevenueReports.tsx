import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Page } from '@/components/atoms';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import KpiRibbon from './KpiRibbon';
import ReportChart, { chartSupported } from './ReportChart';
import ReportControlsBar from './ReportControlsBar';
import ReportList from './ReportList';
import ReportTable from './ReportTable';
import DeltaChip from './DeltaChip';
import {
	buildRequest,
	controlsForEntry,
	currenciesOf,
	defaultControls,
	deltaDisplay,
	formatValue,
	inclusiveEnd,
	ReportControls,
	totalsFor,
} from './reportMath';
import { csvFilename, downloadCsv, reportRowsCsv } from './reportCsv';
import { useReportCatalog, useReportRun } from './useReports';

const ErrorBox = ({ title, message }: { title: string; message?: string }) => (
	<div role='alert' className='flex flex-col gap-1 rounded-md border border-red-200 bg-red-50 p-4 text-sm'>
		<span className='font-medium'>{title}</span>
		<span>{message}</span>
	</div>
);

const RevenueReports = () => {
	const { t } = useTranslation('settings');
	const catalog = useReportCatalog();
	const entries = useMemo(() => catalog.data?.items ?? [], [catalog.data]);
	const [pickedKey, setPickedKey] = useState('');
	const [basisKey, setBasisKey] = useState('');
	const [picked, setPicked] = useState<ReportControls | null>(null);
	const [now, setNow] = useState(() => new Date());
	// Roll relative ranges at UTC midnight.
	useEffect(() => {
		const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
		const timer = window.setTimeout(() => setNow(new Date()), next - Date.now() + 1);
		return () => window.clearTimeout(timer);
	}, [now]);

	const selectedKey = pickedKey || entries[0]?.key || '';
	const parent = entries.find((e) => e.key === selectedKey);
	const variants = useMemo(() => entries.filter((e) => e.variant_of === parent?.key), [entries, parent]);
	const entry = variants.find((v) => v.key === basisKey) ?? parent;
	const basisOptions =
		parent && variants.length
			? [
					{ value: parent.key, label: parent.variant_label || t('insightsTools.revenue.reports.basisDefault') },
					...variants.map((v) => ({ value: v.key, label: v.variant_label || v.name })),
				]
			: [];
	const controls = picked ?? (entry ? defaultControls(entry) : null);
	const setControls = setPicked;
	const request = entry && controls ? buildRequest(entry, controls, now) : undefined;
	const run = useReportRun(entry?.key, request);
	const currencies = run.data ? currenciesOf(run.data) : [];
	const currency = controls && currencies.includes(controls.currency) ? controls.currency : (currencies[0] ?? '');
	const daysLabel = (v: string) => t('insightsTools.revenue.reports.daysUnit', { value: v });

	const select = (key: string) => {
		const next = entries.find((e) => e.key === key);
		if (!next) return;
		setPickedKey(key);
		setBasisKey('');
		setPicked(controlsForEntry(next, controls ?? defaultControls(next)));
	};

	const total = entry && run.data ? totalsFor(run.data, entry.key, currency) : undefined;
	const showChart = !!entry && !!run.data && controls?.view === 'chart' && chartSupported(entry, run.data);
	const { prev_from: pf, prev_to: pt } = run.data?.meta ?? {};
	const prevRange = `${pf?.slice(0, 10) ?? ''} – ${pt ? inclusiveEnd(pt) : ''}`;

	return (
		<Page heading={t('insightsTools.revenue.reports.title')}>
			<div className='flex flex-col gap-6'>
				<p className='text-sm text-muted-foreground'>{t('insightsTools.revenue.reports.subtitle')}</p>
				<KpiRibbon entries={entries} now={now} />
				<div className='flex flex-wrap gap-6'>
					<div className='w-full lg:w-72 lg:flex-none'>
						{catalog.isLoading ? (
							<Skeleton className='h-96 w-full' />
						) : (
							<ReportList entries={entries} selectedKey={selectedKey} onSelect={select} />
						)}
					</div>
					<Card className='flex min-w-0 flex-1 flex-col gap-4 p-6'>
						{catalog.isError ? (
							<ErrorBox title={t('insightsTools.revenue.reports.errorTitle')} message={(catalog.error as Error)?.message} />
						) : !entry || !controls ? (
							<span className='text-sm text-muted-foreground'>{t('insightsTools.revenue.reports.selectReport')}</span>
						) : (
							<>
								<div className='flex flex-col gap-1'>
									<div className='flex items-start justify-between gap-2'>
										<h2 className='text-lg font-semibold'>{entry.name}</h2>
										<Button
											type='button'
											variant='outline'
											size='sm'
											disabled={!run.data?.rows.length || !request || run.isFetching}
											onClick={() =>
												run.data &&
												request &&
												downloadCsv(csvFilename(entry.key, request.range), reportRowsCsv(entry, run.data, request.grain, now))
											}>
											<Download className='h-4 w-4' />
											{t('insightsTools.revenue.reports.downloadCsv')}
										</Button>
									</div>
									<p className='text-sm text-muted-foreground'>{entry.description}</p>
									{entry.kind === 'snapshot' && (
										<span className='text-xs text-muted-foreground'>{t('insightsTools.revenue.reports.pointInTime')}</span>
									)}
									{entry.kind === 'flow' && total && total.prev !== undefined && (
										<div
											className={run.isPlaceholderData ? 'flex items-center gap-2 text-sm opacity-60' : 'flex items-center gap-2 text-sm'}>
											<span className='font-medium tabular-nums'>{formatValue(total.current, entry.value_type, currency, daysLabel)}</span>
											<DeltaChip display={deltaDisplay(String(total.current), String(total.prev), undefined, entry.higher_is_better)} />
											<span className='text-muted-foreground'>
												{t('insightsTools.revenue.reports.vsPrevious', {
													value: formatValue(total.prev, entry.value_type, currency, daysLabel),
													range: prevRange,
												})}
											</span>
										</div>
									)}
								</div>
								<ReportControlsBar
									entry={entry}
									controls={controls}
									currencies={currencies}
									onChange={setControls}
									basis={basisOptions.length ? { options: basisOptions, value: entry.key, onPick: setBasisKey } : undefined}
								/>
								{run.isLoading && !run.data && <Skeleton className='h-72 w-full' />}
								{run.isError && <ErrorBox title={t('insightsTools.revenue.reports.errorTitle')} message={(run.error as Error)?.message} />}
								{run.data && run.data.rows.length === 0 && (
									<span className='text-sm text-muted-foreground'>{t('insightsTools.revenue.reports.noData')}</span>
								)}
								{run.data && run.data.rows.length > 0 && (
									<div className={run.isFetching ? 'flex flex-col gap-4 opacity-60' : 'flex flex-col gap-4'}>
										{controls.view === 'chart' && !showChart && (
											<span className='text-xs text-muted-foreground'>{t('insightsTools.revenue.reports.unsupportedShape')}</span>
										)}
										{showChart && <ReportChart entry={entry} result={run.data} currency={currency} grain={request?.grain} now={now} />}
										<ReportTable entry={entry} result={run.data} currency={currency} grain={request?.grain} now={now} />
									</div>
								)}
							</>
						)}
					</Card>
				</div>
			</div>
		</Page>
	);
};

export default RevenueReports;
