import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Page, Select } from '@/components/atoms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { RedirectCell, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/molecules';
import { getCurrencySymbol } from '@/utils';
import { cn } from '@/lib/utils';
import RevenueDashboardApi from '@/api/RevenueDashboardApi';
import { RouteNames } from '@/core/routes/Routes';
import { useTranslation } from 'react-i18next';
import type { RevenueDashboardGraphPoint } from '@/types/dto/RevenueDashboard';

type RevenueFilterValue = 'this_month' | 'this_quarter' | 'this_year' | 'last_month' | 'last_quarter' | 'last_year';

const UTC_SHORT_DATE = {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	timeZone: 'UTC',
} as const satisfies Intl.DateTimeFormatOptions;

const getDateRangeForPeriod = (period: RevenueFilterValue) => {
	const now = new Date();
	const y = now.getUTCFullYear();
	const m = now.getUTCMonth();

	// 1st of the given month at 00:00:00.000Z
	const utc1st = (year: number, month: number) => new Date(Date.UTC(year, month, 1));

	switch (period) {
		case 'this_month':
			return { start: utc1st(y, m), end: utc1st(y, m + 1) };
		case 'last_month':
			return { start: utc1st(y, m - 1), end: utc1st(y, m) };
		case 'this_quarter': {
			const qStart = Math.floor(m / 3) * 3;
			return { start: utc1st(y, qStart), end: utc1st(y, qStart + 3) };
		}
		case 'last_quarter': {
			const qStart = Math.floor(m / 3) * 3;
			return { start: utc1st(y, qStart - 3), end: utc1st(y, qStart) };
		}
		case 'this_year':
			return { start: utc1st(y, 0), end: utc1st(y + 1, 0) };
		case 'last_year':
			return { start: utc1st(y - 1, 0), end: utc1st(y, 0) };
		default:
			return { start: utc1st(y, m), end: utc1st(y, m + 1) };
	}
};

const formatCurrency = (value: number | null, currency: string, naLabel: string) => {
	if (value == null) return naLabel;
	return `${getCurrencySymbol(currency)} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const formatDecimal = (value: number | null, naLabel: string) => {
	if (value == null) return naLabel;
	return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatInteger = (value: number | null, naLabel: string) => {
	if (value == null) return naLabel;
	return value.toLocaleString();
};

const toNumberOrNull = (value: unknown): number | null => {
	if (value == null) return null;
	const numeric = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(numeric) ? numeric : null;
};

const GRAPH_ELIGIBLE: RevenueFilterValue[] = ['this_quarter', 'last_quarter', 'this_year', 'last_year'];
const PAGE_SIZE = 20;

const Revenue = () => {
	const { t } = useTranslation('settings');
	const { i18n } = useTranslation();
	const naLabel = i18n.t('labels.notApplicable', { ns: 'common' });
	const unknownLabel = i18n.t('labels.unknown', { ns: 'common' });
	const FILTER_OPTIONS = useMemo(
		() =>
			[
				{ value: 'this_month' as const, label: t('insightsTools.revenue.filterThisMonth') },
				{ value: 'this_quarter' as const, label: t('insightsTools.revenue.filterThisQuarter') },
				{ value: 'this_year' as const, label: t('insightsTools.revenue.filterThisYear') },
				{ value: 'last_month' as const, label: t('insightsTools.revenue.filterLastMonth') },
				{ value: 'last_quarter' as const, label: t('insightsTools.revenue.filterLastQuarter') },
				{ value: 'last_year' as const, label: t('insightsTools.revenue.filterLastYear') },
			] satisfies { value: RevenueFilterValue; label: string }[],
		[t],
	);
	const [selectedFilter, setSelectedFilter] = useState<RevenueFilterValue>('this_quarter');
	const [selectedCurrency, setSelectedCurrency] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [search, setSearch] = useState('');
	const { start, end } = useMemo(() => getDateRangeForPeriod(selectedFilter), [selectedFilter]);

	const showGraph = GRAPH_ELIGIBLE.includes(selectedFilter) && selectedCurrency !== '';
	const window_size: 'MONTH' | undefined = showGraph ? 'MONTH' : undefined;

	const handleFilterChange = (value: RevenueFilterValue) => {
		setSelectedFilter(value);
		setSelectedCurrency(''); // re-run auto-select for the new period
		setCurrentPage(1);
		setSearch('');
	};

	const handleSearch = (value: string) => {
		setSearch(value);
		setCurrentPage(1);
	};

	// Single revenue query — returns items (each with their currency) and per-currency summaries.
	const { data, isLoading } = useQuery({
		queryKey: ['revenue-dashboard', selectedFilter],
		queryFn: () =>
			RevenueDashboardApi.getRevenueDashboard({
				period_start: start.toISOString(),
				period_end: end.toISOString(),
				customer_ids: [],
				window_size,
			}),
	});

	// Available currencies come directly from the response (no separate call).
	const availableCurrencies = useMemo(() => Object.keys(data?.summaries ?? {}).sort(), [data?.summaries]);

	// Auto-select the first currency once data lands (or after period change resets selection).
	useEffect(() => {
		if (availableCurrencies.length > 0 && selectedCurrency === '') {
			setSelectedCurrency(availableCurrencies[0]);
		}
	}, [availableCurrencies, selectedCurrency]);

	// Filter items to the selected currency on the frontend.
	const allItems = data?.items ?? [];
	const items = useMemo(
		() => (selectedCurrency === '' ? allItems : allItems.filter((row) => (row.currency || '').toLowerCase() === selectedCurrency)),
		[allItems, selectedCurrency],
	);

	const filteredItems = search.trim()
		? items.filter((row) => (row.customer_name || row.external_customer_id || '').toLowerCase().includes(search.trim().toLowerCase()))
		: items;
	const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
	const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
	const hasRows = items.length > 0;
	const showGlobalEmpty = !isLoading && !hasRows;

	// Summary for the selected currency, picked from the summaries map.
	const summary = selectedCurrency !== '' ? data?.summaries?.[selectedCurrency] : undefined;
	const showVoiceColumns = summary != null && (summary.cpm != null || summary.voice_minutes != null);

	const normalizedSummary = {
		netRevenue: toNumberOrNull(summary?.total_revenue),
		fixedContractRevenue: toNumberOrNull(summary?.total_fixed_revenue),
		usageRevenue: toNumberOrNull(summary?.total_usage_revenue),
		totalMinutes: toNumberOrNull(summary?.voice_minutes),
		cpm: toNumberOrNull(summary?.cpm),
		currency: selectedCurrency,
	};

	const graph = data?.graph;
	const currencyOptions = useMemo(
		() => availableCurrencies.map((c) => ({ value: c.toLowerCase(), label: c.toUpperCase() })),
		[availableCurrencies],
	);
	const graphCharts = useMemo(() => {
		const charts: { key: 'total_revenue' | 'voice_minutes'; title: string; type: 'currency' | 'minutes' }[] = [];
		if (!showGraph || !graph) return charts;
		if ((graph.total_revenue ?? []).length > 0) {
			charts.push({ key: 'total_revenue', title: t('insightsTools.revenue.metricNetRevenue'), type: 'currency' });
		}
		if ((graph.voice_minutes ?? []).length > 0) {
			charts.push({ key: 'voice_minutes', title: t('insightsTools.revenue.metricVoiceMinutes'), type: 'minutes' });
		}
		return charts;
	}, [showGraph, graph, t]);

	return (
		<Page
			heading={t('insightsTools.revenue.pageHeading')}
			headingCTA={
				<div className='flex items-center gap-2'>
					<div className='w-[220px]'>
						<Select options={FILTER_OPTIONS} value={selectedFilter} onChange={(value) => handleFilterChange(value as RevenueFilterValue)} />
					</div>
					{currencyOptions.length > 0 && (
						<div className='w-[100px]'>
							<Select
								options={currencyOptions}
								value={selectedCurrency}
								onChange={(value) => {
									setSelectedCurrency(value as string);
									setCurrentPage(1);
									setSearch('');
								}}
							/>
						</div>
					)}
				</div>
			}>
			<div className='space-y-6 pt-3'>
				<div className='relative'>
					<div className={showGlobalEmpty ? 'blur-[3px] select-none pointer-events-none' : ''}>
						{selectedCurrency === '' ? (
							// No currency selected yet (or no data) — show per-currency summaries from the "summaries" map.
							isLoading || showGlobalEmpty ? (
								<div className='rounded-xl border border-gray-200 bg-white overflow-hidden'>
									<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
										<MetricTile
											title={t('insightsTools.revenue.metricNetRevenue')}
											value=''
											loading
											loadingLabel={t('insightsTools.revenue.loadingEllipsis')}
										/>
										<MetricTile
											title={t('insightsTools.revenue.metricContractRevenue')}
											value=''
											loading
											loadingLabel={t('insightsTools.revenue.loadingEllipsis')}
										/>
										<MetricTile
											title={t('insightsTools.revenue.metricUsageRevenue')}
											value=''
											loading
											loadingLabel={t('insightsTools.revenue.loadingEllipsis')}
											isLast
										/>
									</div>
								</div>
							) : (
								<div className='space-y-3'>
									{Object.entries(data?.summaries ?? {})
										.sort(([a], [b]) => a.localeCompare(b))
										.map(([cur, sum]) => (
											<div key={cur}>
												<p className='text-xs font-medium text-gray-400 uppercase tracking-wide px-1 mb-1'>{cur}</p>
												<div className='rounded-xl border border-gray-200 bg-white overflow-hidden'>
													<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
														<MetricTile
															title={t('insightsTools.revenue.metricNetRevenue')}
															value={formatCurrency(toNumberOrNull(sum.total_revenue), cur, naLabel)}
															loading={false}
															loadingLabel={t('insightsTools.revenue.loadingEllipsis')}
														/>
														<MetricTile
															title={t('insightsTools.revenue.metricContractRevenue')}
															value={formatCurrency(toNumberOrNull(sum.total_fixed_revenue), cur, naLabel)}
															loading={false}
															loadingLabel={t('insightsTools.revenue.loadingEllipsis')}
														/>
														<MetricTile
															title={t('insightsTools.revenue.metricUsageRevenue')}
															value={formatCurrency(toNumberOrNull(sum.total_usage_revenue), cur, naLabel)}
															loading={false}
															loadingLabel={t('insightsTools.revenue.loadingEllipsis')}
															isLast
														/>
													</div>
												</div>
											</div>
										))}
								</div>
							)
						) : (
							// Single currency selected — show summary tiles for that currency.
							<div className='rounded-xl border border-gray-200 bg-white overflow-hidden'>
								<div className={`grid grid-cols-1 sm:grid-cols-2 ${showVoiceColumns ? 'lg:grid-cols-5' : 'lg:grid-cols-3'}`}>
									<MetricTile
										title={t('insightsTools.revenue.metricNetRevenue')}
										value={formatCurrency(normalizedSummary.netRevenue, normalizedSummary.currency, naLabel)}
										loading={isLoading}
										loadingLabel={t('insightsTools.revenue.loadingEllipsis')}
									/>
									<MetricTile
										title={t('insightsTools.revenue.metricContractRevenue')}
										value={formatCurrency(normalizedSummary.fixedContractRevenue, normalizedSummary.currency, naLabel)}
										loading={isLoading}
										loadingLabel={t('insightsTools.revenue.loadingEllipsis')}
									/>
									<MetricTile
										title={t('insightsTools.revenue.metricUsageRevenue')}
										value={formatCurrency(normalizedSummary.usageRevenue, normalizedSummary.currency, naLabel)}
										loading={isLoading}
										loadingLabel={t('insightsTools.revenue.loadingEllipsis')}
										isLast={!showVoiceColumns}
									/>
									{showVoiceColumns && (
										<MetricTile
											title={t('insightsTools.revenue.metricVoiceMinutes')}
											value={formatInteger(normalizedSummary.totalMinutes, naLabel)}
											loading={isLoading}
											loadingLabel={t('insightsTools.revenue.loadingEllipsis')}
										/>
									)}
									{showVoiceColumns && (
										<MetricTile
											title={t('insightsTools.revenue.metricCostPerMinute')}
											value={formatDecimal(normalizedSummary.cpm, naLabel)}
											loading={isLoading}
											loadingLabel={t('insightsTools.revenue.loadingEllipsis')}
											isLast
										/>
									)}
								</div>
							</div>
						)}
					</div>

					{showGlobalEmpty && (
						<div className='absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-md bg-white/45'>
							<div className='text-center max-w-sm px-4'>
								<h3 className='text-xl font-semibold text-zinc-900'>{t('insightsTools.revenue.emptyRangeTitle')}</h3>
								<p className='text-sm text-zinc-600 mt-2'>{t('insightsTools.revenue.emptyRangeBody')}</p>
								<Button onClick={() => setSelectedFilter('this_quarter')} className='mt-4'>
									{t('insightsTools.revenue.viewLatestData')}
								</Button>
							</div>
						</div>
					)}
				</div>

				{showGraph && (isLoading || graphCharts.length > 0) && (
					<div className='pt-2'>
						<div className={`grid grid-cols-1 gap-4 ${graphCharts.length === 1 ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}>
							{isLoading
								? [0, 1].map((i) => (
										<Card key={i} className='shadow-sm border border-gray-200'>
											<CardHeader className='pb-2'>
												<Skeleton className='h-4 w-32' />
											</CardHeader>
											<CardContent>
												<Skeleton className='h-56 w-full' />
											</CardContent>
										</Card>
									))
								: graphCharts.map((chart) => (
										<RevenueBarChart key={chart.key} title={chart.title} data={graph![chart.key]!} type={chart.type} />
									))}
						</div>
					</div>
				)}

				<div className='pt-8'>
					<div className='rounded-md border border-gray-200 bg-white overflow-hidden shadow-sm'>
						<div className='flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white'>
							<div className='relative flex items-center w-64'>
								<Search className='absolute left-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none' />
								<Input
									placeholder={t('insightsTools.revenue.searchCustomersPlaceholder')}
									value={search}
									onChange={(e) => handleSearch(e.target.value)}
									className='pl-8 h-8 text-[13px] border-gray-200 bg-gray-50 focus:bg-white placeholder:text-gray-400'
								/>
							</div>
							<div className='flex items-center gap-4'>
								{search.trim() && (
									<p className='text-[12px] text-gray-400'>
										{filteredItems.length === 1
											? i18n.t('search.resultsCountSingular', { ns: 'common', count: filteredItems.length })
											: i18n.t('search.resultsCountPlural', { ns: 'common', count: filteredItems.length })}
									</p>
								)}
								<p className='text-[12px] text-gray-400'>
									{start.toLocaleDateString(undefined, UTC_SHORT_DATE)}
									{' – '}
									{end.toLocaleDateString(undefined, UTC_SHORT_DATE)}
								</p>
							</div>
						</div>
						<Table>
							<TableHeader className='h-10 bg-gray-50 border-b border-gray-200 rounded-t-md'>
								<TableRow className='rounded-t-md border-b border-gray-200'>
									<TableHead className='rounded-tl-md pl-4 font-semibold text-gray-700 text-[13px]'>
										{t('insightsTools.revenue.colCustomer')}
									</TableHead>
									{selectedCurrency === '' && (
										<TableHead className='font-semibold text-gray-700 text-[13px]'>{t('insightsTools.revenue.colCurrency')}</TableHead>
									)}
									<TableHead className='font-semibold text-gray-700 text-[13px]'>{t('insightsTools.revenue.metricNetRevenue')}</TableHead>
									<TableHead className='font-semibold text-gray-700 text-[13px]'>
										{t('insightsTools.revenue.metricContractRevenue')}
									</TableHead>
									<TableHead className={`font-semibold text-gray-700 text-[13px] ${!showVoiceColumns ? 'rounded-tr-md' : ''}`}>
										{t('insightsTools.revenue.metricUsageRevenue')}
									</TableHead>
									{showVoiceColumns && (
										<TableHead className='font-semibold text-gray-700 text-[13px]'>
											{t('insightsTools.revenue.metricVoiceMinutes')}
										</TableHead>
									)}
									{showVoiceColumns && (
										<TableHead className='rounded-tr-md font-semibold text-gray-700 text-[13px]'>
											{t('insightsTools.revenue.metricCostPerMinute')}
										</TableHead>
									)}
								</TableRow>
							</TableHeader>
							<TableBody>
								{pagedItems.map((row) => {
									const rowCurrency = row.currency || selectedCurrency;
									return (
										<TableRow
											key={`${row.customer_id}:${row.currency}`}
											className='h-10 align-middle border-b border-gray-200 bg-white hover:bg-gray-50/50 transition-colors'>
											<TableCell className='py-2.5 pl-4 font-normal text-gray-700 text-[13px] align-middle'>
												<RedirectCell redirectUrl={`${RouteNames.customers}/${row.customer_id}`} allowRedirect={Boolean(row.customer_id)}>
													{row.customer_name || row.external_customer_id || unknownLabel}
												</RedirectCell>
											</TableCell>
											<TableCell className='py-2.5 font-semibold text-gray-700 text-[13px]'>
												{formatCurrency(
													toNumberOrNull(row.total_revenue) ??
														(toNumberOrNull(row.total_usage_revenue) ?? 0) + (toNumberOrNull(row.total_fixed_revenue) ?? 0),
													rowCurrency,
													naLabel,
												)}
											</TableCell>
											<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>
												{formatCurrency(toNumberOrNull(row.total_fixed_revenue), rowCurrency, naLabel)}
											</TableCell>
											<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>
												{formatCurrency(toNumberOrNull(row.total_usage_revenue), rowCurrency, naLabel)}
											</TableCell>
											{showVoiceColumns && (
												<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>
													{formatInteger(toNumberOrNull(row.voice_minutes), naLabel)}
												</TableCell>
											)}
											{showVoiceColumns && (
												<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>
													{formatDecimal(toNumberOrNull(row.cpm), naLabel)}
												</TableCell>
											)}
										</TableRow>
									);
								})}
								{pagedItems.length === 0 && (
									<TableRow className='bg-white'>
										<TableCell
											colSpan={showVoiceColumns ? 6 : selectedCurrency === '' ? 5 : 4}
											className='pl-4 py-4 font-normal text-gray-500 text-[13px]'>
											{search.trim() ? t('insightsTools.revenue.noSearchMatches') : i18n.t('labels.na', { ns: 'common' })}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
					{filteredItems.length > 0 && totalPages > 1 && (
						<div className='flex items-center justify-between py-4'>
							<p className='text-sm text-gray-500 font-light'>
								{i18n.t('pagination.showingRange', {
									ns: 'common',
									start: (currentPage - 1) * PAGE_SIZE + 1,
									end: Math.min(currentPage * PAGE_SIZE, filteredItems.length),
									total: filteredItems.length,
									unit: i18n.t('pagination.unitCustomers', { ns: 'common' }),
								})}
							</p>
							<div className='flex items-center space-x-2'>
								<Button
									type='button'
									variant='outline'
									size='icon'
									onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									disabled={currentPage === 1}
									className={cn('size-8', currentPage === 1 && 'text-gray-300 cursor-not-allowed')}>
									<ChevronLeft className='h-4 w-4' />
								</Button>
								<Button
									type='button'
									variant='outline'
									size='icon'
									onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
									disabled={currentPage === totalPages}
									className={cn('size-8', currentPage === totalPages && 'text-gray-300 cursor-not-allowed')}>
									<ChevronRight className='h-4 w-4' />
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>
		</Page>
	);
};

const MetricTile = ({
	title,
	value,
	loading = false,
	loadingLabel,
	isLast = false,
}: {
	title: string;
	value: string;
	loading?: boolean;
	loadingLabel: string;
	isLast?: boolean;
}) => {
	return (
		<div
			className={`px-5 py-4 min-h-[104px] flex flex-col ${!isLast ? 'lg:border-r lg:border-gray-200' : ''} border-b sm:border-b-0 border-gray-200`}>
			<p className='text-[12px] leading-4 text-zinc-600 whitespace-normal break-words'>{title}</p>
			<p className='mt-4 text-[22px] leading-[1.2] font-medium text-zinc-900'>{loading ? loadingLabel : value}</p>
		</div>
	);
};

const RevenueBarChart = ({ title, data, type }: { title: string; data: RevenueDashboardGraphPoint[]; type: 'currency' | 'minutes' }) => {
	const chartData = data.map((point) => ({
		label: point.label,
		value: toNumberOrNull(point.value) ?? 0,
	}));

	const formatYAxis = (val: number) => {
		if (type === 'currency') {
			if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
			if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
			return `$${val.toLocaleString()}`;
		}
		if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
		if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
		return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
	};

	const formatTooltip = (val: number) => {
		if (type === 'currency') {
			return [`$ ${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, title];
		}
		return [val.toLocaleString(undefined, { maximumFractionDigits: 2 }), title];
	};

	return (
		<Card className='shadow-sm border border-gray-200 bg-white'>
			<CardHeader className='pb-2 pt-5 px-5'>
				<CardTitle className='text-sm font-medium text-zinc-600'>{title}</CardTitle>
			</CardHeader>
			<CardContent className='px-5 pb-5'>
				<ResponsiveContainer width='100%' height={220}>
					<BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
						<CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' vertical={false} />
						<XAxis dataKey='label' tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#71717a' }} tickMargin={8} />
						<YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#71717a' }} tickFormatter={formatYAxis} width={64} />
						<Tooltip
							cursor={false}
							formatter={formatTooltip}
							contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 13 }}
						/>
						<Bar dataKey='value' fill='#22c55e' radius={[4, 4, 0, 0]} maxBarSize={48} />
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
};

export default Revenue;
