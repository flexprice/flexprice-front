import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Card } from '@/components/atoms';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { CustomerUsageChart } from '@/components/molecules';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/molecules/Table/Table';
import { UsageAnalyticItem, WindowSize } from '@/models';
import { DashboardAnalyticsRequest } from '@/types';
import { formatNumber, getCurrencySymbol } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from './EmptyState';
import TimePeriodSelector from './TimePeriodSelector';
import { CustomerPortalTimePeriod, DEFAULT_TIME_PERIOD, calculateTimeRange } from './constants';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

const EXPAND_ALL_SVG = '/assets/svg/expand-all-svgrepo-com.svg';
const COLLAPSE_ALL_SVG = '/assets/svg/collapse-all-svgrepo-com.svg';
const CHEVRON_UP_SVG = '/assets/svg/chevron-up-svgrepo-com.svg';
const CHEVRON_DOWN_SVG = '/assets/svg/chevron-down-svgrepo-com.svg';
import { cn } from '@/lib/utils';

const SORT_TOTAL_USAGE = 'total_usage' as const;
const SORT_TOTAL_COST = 'total_cost' as const;

const UsageAnalyticsTab = () => {
	const { t } = useTranslation('customer-portal');
	const [selectedPeriod, setSelectedPeriod] = useState<CustomerPortalTimePeriod>(DEFAULT_TIME_PERIOD);
	const periodLabel = t(`timePeriod.${selectedPeriod}`);

	// Prepare analytics params based on selected period (expand price so group-by works)
	const analyticsParams: DashboardAnalyticsRequest | null = useMemo(() => {
		const timeRange = calculateTimeRange(selectedPeriod);

		return {
			window_size: WindowSize.DAY,
			start_time: timeRange.start_time,
			end_time: timeRange.end_time,
			expand: ['price'],
		};
	}, [selectedPeriod]);

	// Debounced API parameters with 300ms delay
	const [debouncedParams, setDebouncedParams] = useState<DashboardAnalyticsRequest | null>(null);

	useEffect(() => {
		if (analyticsParams) {
			const timeoutId = setTimeout(() => {
				setDebouncedParams(analyticsParams);
			}, 300);

			return () => clearTimeout(timeoutId);
		} else {
			setDebouncedParams(null);
		}
	}, [analyticsParams]);

	// Fetch usage analytics
	const {
		data: usageData,
		isLoading: usageLoading,
		error: usageError,
	} = useQuery({
		queryKey: ['portal-usage-analytics', debouncedParams],
		queryFn: async () => {
			if (!debouncedParams) {
				throw new Error('API parameters not available');
			}
			return await CustomerPortalApi.getAnalytics(debouncedParams);
		},
		enabled: !!debouncedParams,
	});

	useEffect(() => {
		if (usageError) {
			toast.error(t('errors.loadUsageAnalytics'));
		}
	}, [usageError, t]);

	return (
		<div className='space-y-6'>
			{/* Usage Chart */}
			<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
				<div className='flex items-center justify-between mb-4'>
					<h3 className='text-base font-medium text-zinc-950'>{t('usage.title')}</h3>
					<TimePeriodSelector selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />
				</div>
				{usageLoading ? (
					<div className='space-y-4'>
						<Skeleton className='h-64 w-full' />
					</div>
				) : usageData ? (
					<CustomerUsageChart data={usageData} />
				) : (
					<div className='py-8'>
						<EmptyState
							title={t('usageAnalytics.noDataTitle')}
							description={t('usageAnalytics.noDataDescription', { period: periodLabel })}
						/>
					</div>
				)}
			</Card>

			{/* Usage Breakdown Table */}
			<Card className='bg-white border border-[#E9E9E9] rounded-xl overflow-hidden'>
				<div className='p-6'>
					<h3 className='text-base font-medium text-zinc-950'>{t('usage.breakdownTitle')}</h3>
				</div>
				{usageLoading ? (
					<div className='space-y-4 p-6'>
						<Skeleton className='h-8 w-full' />
						<Skeleton className='h-8 w-full' />
						<Skeleton className='h-8 w-full' />
					</div>
				) : usageData && usageData.items && usageData.items.length > 0 ? (
					<UsageBreakdownTable items={usageData.items} />
				) : (
					<div className='py-8'>
						<EmptyState
							title={t('usageAnalytics.noDataTitle')}
							description={t('usageAnalytics.noDataDescription', { period: periodLabel })}
						/>
					</div>
				)}
			</Card>
		</div>
	);
};

const UNGROUPED_KEY = '__ungrouped__';

interface GroupBucket {
	groupKey: string;
	groupName: string;
	items: UsageAnalyticItem[];
}

function renderTotalUsagePortal(row: UsageAnalyticItem) {
	const useDisplayValue = row.total_usage_display !== '' && row.total_usage_display != null;
	const displayNum = useDisplayValue
		? Number(parseFloat((row.total_usage_display || '0').replace(/,/g, '')))
		: Number(row.total_usage) || 0;
	const isSingular = displayNum === 1;
	const unitLabel = row.reporting_unit
		? isSingular
			? (row.reporting_unit.unit_singular ?? row.reporting_unit.unit_plural ?? '')
			: (row.reporting_unit.unit_plural ?? row.reporting_unit.unit_singular ?? '')
		: row.unit
			? Number(row.total_usage) === 1
				? row.unit
				: (row.unit_plural ?? row.unit)
			: '';
	const suffix = unitLabel ? ` ${unitLabel}` : '';
	const formattedUsage = useDisplayValue ? formatNumber(displayNum, displayNum % 1 === 0 ? 0 : 2) : formatNumber(Number(row.total_usage));
	return (
		<span>
			{formattedUsage}
			{suffix}
		</span>
	);
}

function renderTotalCostPortal(row: UsageAnalyticItem) {
	const cost = Number(row.total_cost);
	if (cost === 0 || !row.currency) return '-';
	const currency = getCurrencySymbol(row.currency);
	return (
		<span>
			{currency}
			{formatNumber(cost, 2)}
		</span>
	);
}

const UsageBreakdownTable: React.FC<{ items: UsageAnalyticItem[] }> = ({ items }) => {
	const { t } = useTranslation('customer-portal');
	const [sortField, setSortField] = useState<'total_usage' | 'total_cost'>('total_cost');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
	const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(() => new Set());
	const hasInitializedExpand = useRef(false);

	const sortedItems = useMemo(() => {
		const sorted = [...items];
		const mult = sortDirection === 'asc' ? 1 : -1;
		sorted.sort((a, b) => {
			const va = sortField === 'total_usage' ? Number(a.total_usage) : Number(a.total_cost);
			const vb = sortField === 'total_usage' ? Number(b.total_usage) : Number(b.total_cost);
			return (va - vb) * mult;
		});
		return sorted;
	}, [items, sortDirection, sortField]);

	const { groupedBuckets, ungroupedItems } = useMemo(() => {
		const map = new Map<string, GroupBucket>();
		for (const item of sortedItems) {
			const group = item.price?.group;
			const groupKey = group?.id ?? UNGROUPED_KEY;
			const groupName = group?.name ?? t('usageBreakdown.noGroup');
			if (!map.has(groupKey)) map.set(groupKey, { groupKey, groupName, items: [] });
			map.get(groupKey)!.items.push(item);
		}
		const ungrouped = map.get(UNGROUPED_KEY)?.items ?? [];
		const grouped = Array.from(map.values())
			.filter((b) => b.groupKey !== UNGROUPED_KEY)
			.sort((a, b) => a.groupName.localeCompare(b.groupName));
		return { groupedBuckets: grouped, ungroupedItems: ungrouped };
	}, [sortedItems, t]);

	useEffect(() => {
		if (groupedBuckets.length > 0 && !hasInitializedExpand.current) {
			hasInitializedExpand.current = true;
			setExpandedGroupIds(new Set(groupedBuckets.map((b) => b.groupKey)));
		}
	}, [groupedBuckets]);

	const hasGroups = groupedBuckets.length > 0;
	const allExpanded = hasGroups && groupedBuckets.every((b) => expandedGroupIds.has(b.groupKey));
	const toggleExpandAll = () => {
		setExpandedGroupIds(allExpanded ? new Set() : new Set(groupedBuckets.map((b) => b.groupKey)));
	};
	const toggleGroup = (groupKey: string) => {
		setExpandedGroupIds((prev) => {
			const next = new Set(prev);
			if (next.has(groupKey)) next.delete(groupKey);
			else next.add(groupKey);
			return next;
		});
	};

	const renderSortableHeader = (field: 'total_usage' | 'total_cost', label: string) => {
		const isActive = sortField === field;
		return (
			<button
				type='button'
				className={cn(
					'group -ms-1 inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-start transition-colors',
					isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
				)}
				onClick={() => {
					if (sortField !== field) {
						setSortField(field);
						setSortDirection('desc');
					} else {
						setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
					}
				}}>
				<span className='leading-none'>{label}</span>
				{sortDirection === 'asc' && isActive ? (
					<ChevronUp className='h-3.5 w-3.5 shrink-0 text-gray-900' />
				) : isActive ? (
					<ChevronDown className='h-3.5 w-3.5 shrink-0 text-gray-900' />
				) : (
					<ChevronsUpDown className='h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-gray-500' />
				)}
			</button>
		);
	};

	return (
		<div className='px-6 pb-6'>
			{hasGroups && (
				<div className='flex justify-end mb-4'>
					<button
						type='button'
						onClick={toggleExpandAll}
						className='inline-flex items-center justify-center text-gray-600 hover:text-gray-900'
						aria-label={allExpanded ? t('usageBreakdown.collapseAllAria') : t('usageBreakdown.expandAllAria')}>
						<img src={allExpanded ? COLLAPSE_ALL_SVG : EXPAND_ALL_SVG} alt='' className='h-4 w-4' />
					</button>
				</div>
			)}
			<div>
				<Table>
					<TableHeader className='h-10 border-b border-gray-200'>
						<TableRow className='border-b border-gray-200'>
							<TableHead className='pl-0 font-semibold text-gray-700 text-[13px]'>{t('usageBreakdown.feature')}</TableHead>
							<TableHead className='font-semibold text-gray-700 text-[13px]'>
								{renderSortableHeader(SORT_TOTAL_USAGE, t('usageBreakdown.totalUsage'))}
							</TableHead>
							<TableHead className='font-semibold text-gray-700 text-[13px]'>
								{renderSortableHeader(SORT_TOTAL_COST, t('usageBreakdown.totalCost'))}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{groupedBuckets.map((bucket) => {
							const isExpanded = expandedGroupIds.has(bucket.groupKey);
							const aggregateCost = bucket.items.reduce((s, i) => s + Number(i.total_cost), 0);
							const firstCurrency = bucket.items[0]?.currency;
							return (
								<React.Fragment key={bucket.groupKey}>
									<TableRow
										role='button'
										tabIndex={0}
										onClick={() => bucket.items.length > 0 && toggleGroup(bucket.groupKey)}
										onKeyDown={(e) => {
											if ((e.key === 'Enter' || e.key === ' ') && bucket.items.length > 0) {
												e.preventDefault();
												toggleGroup(bucket.groupKey);
											}
										}}
										className={cn(
											'h-10 align-middle border-b border-gray-200 bg-white cursor-pointer hover:bg-gray-50/50',
											bucket.items.length === 0 && 'border-b-0',
											bucket.items.length === 0 && 'cursor-default',
										)}>
										<TableCell className='pl-0 py-2.5 align-middle'>
											<div className='inline-flex items-center gap-2 text-start'>
												<span className='font-semibold text-gray-900 text-[13px]'>{bucket.groupName}</span>
												{bucket.items.length > 0 ? (
													<img src={isExpanded ? CHEVRON_UP_SVG : CHEVRON_DOWN_SVG} alt='' className='h-4 w-4 shrink-0' aria-hidden />
												) : null}
											</div>
										</TableCell>
										<TableCell className='py-2.5 font-normal text-gray-700 text-[13px]'>{t('usageBreakdown.cellEmDash')}</TableCell>
										<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>
											{firstCurrency ? (
												<>
													{getCurrencySymbol(firstCurrency)}
													{formatNumber(aggregateCost, 2)}
												</>
											) : (
												t('usageBreakdown.cellEmDash')
											)}
										</TableCell>
									</TableRow>
									{isExpanded &&
										bucket.items.map((row, childIndex) => (
											<TableRow
												key={`${bucket.groupKey}:${row.feature_id ?? row.price_id ?? row.meter_id ?? childIndex}`}
												className='h-10 align-middle border-b border-gray-200 bg-white hover:bg-gray-50/50'>
												<TableCell className='py-2.5 pl-0 font-normal text-gray-700 text-[13px] align-middle'>
													<span>{row.name || row.feature?.name || row.event_name || t('usageBreakdown.unknownRow')}</span>
												</TableCell>
												<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>{renderTotalUsagePortal(row)}</TableCell>
												<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>{renderTotalCostPortal(row)}</TableCell>
											</TableRow>
										))}
								</React.Fragment>
							);
						})}
						{ungroupedItems.map((row, index) => (
							<TableRow
								key={`ungrouped:${row.feature_id ?? row.price_id ?? row.meter_id ?? index}`}
								className='h-10 align-middle border-b border-gray-200 bg-white hover:bg-gray-50/50'>
								<TableCell className='pl-0 py-2.5 font-normal text-gray-700 text-[13px]'>
									<span>{row.name || row.feature?.name || row.event_name || t('usageBreakdown.unknownRow')}</span>
								</TableCell>
								<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>{renderTotalUsagePortal(row)}</TableCell>
								<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>{renderTotalCostPortal(row)}</TableCell>
							</TableRow>
						))}
						{items.length === 0 && (
							<TableRow className='bg-white'>
								<TableCell colSpan={3} className='pl-0 py-4 font-normal text-gray-500 text-[13px]'>
									{t('usageBreakdown.cellEmpty')}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
};

export default UsageAnalyticsTab;
