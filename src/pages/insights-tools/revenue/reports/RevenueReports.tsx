import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Page } from '@/components/atoms';
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
	rangeForPreset,
	ReportControls,
	totalsFor,
} from './reportMath';
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
	const [picked, setPicked] = useState<ReportControls | null>(null);
	const now = useMemo(() => new Date(), []);

	const selectedKey = pickedKey || entries[0]?.key || '';
	const entry = entries.find((e) => e.key === selectedKey);
	const controls = picked ?? (entry ? defaultControls(entry) : null);
	const setControls = setPicked;
	const request = entry && controls ? buildRequest(entry, controls, now) : undefined;
	const run = useReportRun(entry?.key, request);
	const currencies = run.data ? currenciesOf(run.data) : [];
	const currency = controls?.currency || currencies[0] || '';

	const select = (key: string) => {
		const next = entries.find((e) => e.key === key);
		if (!next) return;
		setPickedKey(key);
		setPicked(controlsForEntry(next, controls ?? defaultControls(next)));
	};

	const total = entry && run.data ? totalsFor(run.data, entry.key, currency) : undefined;
	const showChart = !!entry && !!run.data && controls?.view === 'chart' && chartSupported(entry, run.data);
	const prevRange = `${run.data?.meta.prev_from?.slice(0, 10) ?? ''} – ${run.data?.meta.prev_to?.slice(0, 10) ?? ''}`;

	return (
		<Page heading={t('insightsTools.revenue.reports.title')}>
			<div className='flex flex-col gap-6'>
				<p className='text-sm text-muted-foreground'>{t('insightsTools.revenue.reports.subtitle')}</p>
				<KpiRibbon entries={entries} range={rangeForPreset(controls?.preset ?? 'last_90_days', now)} currency={currency} />
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
									<h2 className='text-lg font-semibold'>{entry.name}</h2>
									<p className='text-sm text-muted-foreground'>{entry.description}</p>
									{entry.kind === 'snapshot' && (
										<span className='text-xs text-muted-foreground'>{t('insightsTools.revenue.reports.pointInTime')}</span>
									)}
									{entry.kind === 'flow' && total && total.prev !== undefined && (
										<div className='flex items-center gap-2 text-sm'>
											<span className='font-medium tabular-nums'>{formatValue(total.current, entry.value_type, currency)}</span>
											<DeltaChip display={deltaDisplay(String(total.current), String(total.prev), undefined, entry.higher_is_better)} />
											<span className='text-muted-foreground'>
												{t('insightsTools.revenue.reports.vsPrevious', {
													value: formatValue(total.prev, entry.value_type, currency),
													range: prevRange,
												})}
											</span>
										</div>
									)}
								</div>
								<ReportControlsBar entry={entry} controls={controls} currencies={currencies} onChange={setControls} />
								{run.isLoading && <Skeleton className='h-72 w-full' />}
								{run.isError && <ErrorBox title={t('insightsTools.revenue.reports.errorTitle')} message={(run.error as Error)?.message} />}
								{run.data && run.data.rows.length === 0 && (
									<span className='text-sm text-muted-foreground'>{t('insightsTools.revenue.reports.noData')}</span>
								)}
								{run.data && run.data.rows.length > 0 && (
									<>
										{controls.view === 'chart' && !showChart && (
											<span className='text-xs text-muted-foreground'>{t('insightsTools.revenue.reports.unsupportedShape')}</span>
										)}
										{showChart && <ReportChart entry={entry} result={run.data} currency={currency} />}
										<ReportTable entry={entry} result={run.data} currency={currency} />
									</>
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
