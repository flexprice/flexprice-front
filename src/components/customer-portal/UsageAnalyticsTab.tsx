import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { ChevronDown, ChevronUp, ChevronsUpDown, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const UsageAnalyticsTab = () => {
	const [selectedPeriod, setSelectedPeriod] = useState<CustomerPortalTimePeriod>(DEFAULT_TIME_PERIOD);

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
			toast.error('Failed to load usage analytics');
		}
	}, [usageError]);

	return (
		<div className='space-y-6'>
			{/* Usage Chart */}
			<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
				<div className='flex items-center justify-between mb-4'>
					<h3 className='text-base font-medium text-zinc-950'>Usage</h3>
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
						<EmptyState title='No usage data found' description={`Your usage from the last ${selectedPeriod} will appear here`} />
					</div>
				)}
			</Card>

			{/* Usage Breakdown Table */}
			<Card className='bg-white border border-[#E9E9E9] rounded-xl overflow-hidden'>
				<div className='p-6 border-b border-[#E9E9E9]'>
					<h3 className='text-base font-medium text-zinc-950'>Usage Breakdown</h3>
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
						<EmptyState title='No usage data found' description={`Your usage from the last ${selectedPeriod} will appear here`} />
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
	return (
		<span>
			{useDisplayValue ? row.total_usage_display : formatNumber(Number(row.total_usage))}
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
			const groupName = group?.name ?? 'No group';
			if (!map.has(groupKey)) map.set(groupKey, { groupKey, groupName, items: [] });
			map.get(groupKey)!.items.push(item);
		}
		const ungrouped = map.get(UNGROUPED_KEY)?.items ?? [];
		const grouped = Array.from(map.values())
			.filter((b) => b.groupKey !== UNGROUPED_KEY)
			.sort((a, b) => a.groupName.localeCompare(b.groupName));
		return { groupedBuckets: grouped, ungroupedItems: ungrouped };
	}, [sortedItems]);

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
					'group -ml-1 inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-left transition-colors',
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
					<button type='button' onClick={toggleExpandAll} className='text-sm text-gray-600 hover:text-gray-900'>
						{allExpanded ? 'Collapse all' : 'Expand all'}
					</button>
				</div>
			)}
			<div className='rounded-md border border-gray-200 bg-white overflow-hidden shadow-sm'>
				<Table>
					<TableHeader className='h-10 bg-gray-50 border-b border-gray-200 rounded-t-md'>
						<TableRow className='rounded-t-md border-b border-gray-200'>
							<TableHead className='rounded-tl-md pl-4 font-semibold text-gray-700 text-[13px]'>Feature</TableHead>
							<TableHead className='font-semibold text-gray-700 text-[13px]'>
								{renderSortableHeader('total_usage', 'Total Usage')}
							</TableHead>
							<TableHead className='font-semibold text-gray-700 text-[13px]'>Events</TableHead>
							<TableHead className='rounded-tr-md font-semibold text-gray-700 text-[13px]'>
								{renderSortableHeader('total_cost', 'Total Cost')}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{groupedBuckets.map((bucket) => {
							const isExpanded = expandedGroupIds.has(bucket.groupKey);
							const aggregateCost = bucket.items.reduce((s, i) => s + Number(i.total_cost), 0);
							const aggregateEvents = bucket.items.reduce((s, i) => s + Number(i.event_count ?? 0), 0);
							const firstCurrency = bucket.items[0]?.currency;
							return (
								<React.Fragment key={bucket.groupKey}>
									<TableRow
										className={cn('h-10 align-middle border-b border-gray-200 bg-gray-100', bucket.items.length === 0 && 'border-b-0')}>
										<TableCell className='pl-4 py-2.5 align-middle'>
											<button
												type='button'
												onClick={() => toggleGroup(bucket.groupKey)}
												className='inline-flex items-center gap-3 text-left'>
												{bucket.items.length > 0 ? (
													<span
														className='inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
														aria-label={isExpanded ? 'Collapse group' : 'Expand group'}>
														{isExpanded ? <Minus className='h-2.5 w-2.5 stroke-[2.5]' /> : <Plus className='h-2.5 w-2.5 stroke-[2.5]' />}
													</span>
												) : (
													<span className='w-5' />
												)}
												<span className='font-semibold text-gray-900 text-[13px]'>{bucket.groupName}</span>
											</button>
										</TableCell>
										<TableCell className='py-2.5 font-normal text-gray-700 text-[13px]'>—</TableCell>
										<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>
											{aggregateEvents > 0 ? formatNumber(aggregateEvents) : '—'}
										</TableCell>
										<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>
											{firstCurrency ? (
												<>
													{getCurrencySymbol(firstCurrency)}
													{formatNumber(aggregateCost, 2)}
												</>
											) : (
												'—'
											)}
										</TableCell>
									</TableRow>
									{isExpanded &&
										bucket.items.map((row, childIndex) => {
											const isLastChild = childIndex === bucket.items.length - 1;
											return (
												<TableRow
													key={row.feature_id || row.price_id || row.name || Math.random()}
													className='h-10 align-middle border-b border-gray-200 bg-white hover:bg-gray-50/50'>
													<TableCell className='py-2.5 pl-4 font-normal text-gray-700 text-[13px] align-middle relative'>
														<span
															className={cn('absolute left-6 w-px bg-gray-300', isLastChild ? 'top-0 h-1/2' : 'top-0 bottom-0')}
															aria-hidden
														/>
														<span className='absolute left-6 top-1/2 h-px w-6 -translate-y-px bg-gray-300' aria-hidden />
														<div className='pl-10 relative z-10'>
															<span>{row.name || row.feature?.name || row.event_name || 'Unknown'}</span>
														</div>
													</TableCell>
													<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>{renderTotalUsagePortal(row)}</TableCell>
													<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>
														{formatNumber(row.event_count ?? 0)}
													</TableCell>
													<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>{renderTotalCostPortal(row)}</TableCell>
												</TableRow>
											);
										})}
								</React.Fragment>
							);
						})}
						{ungroupedItems.map((row) => (
							<TableRow
								key={row.feature_id || row.price_id || row.name || row.meter_id || Math.random()}
								className='h-10 align-middle border-b border-gray-200 bg-white hover:bg-gray-50/50'>
								<TableCell className='pl-4 py-2.5 font-normal text-gray-700 text-[13px]'>
									<span>{row.name || row.feature?.name || row.event_name || 'Unknown'}</span>
								</TableCell>
								<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>{renderTotalUsagePortal(row)}</TableCell>
								<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>{formatNumber(row.event_count ?? 0)}</TableCell>
								<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>{renderTotalCostPortal(row)}</TableCell>
							</TableRow>
						))}
						{items.length === 0 && (
							<TableRow className='bg-white'>
								<TableCell colSpan={4} className='pl-4 py-4 font-normal text-gray-500 text-[13px]'>
									--
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
