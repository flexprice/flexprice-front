import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useBreadcrumbsStore } from '@/store';
import { FeatureMultiSelect, DatePicker } from '@/components/atoms';
import CustomerApi from '@/api/CustomerApi';
import toast from 'react-hot-toast';
import EventsApi from '@/api/EventsApi';
import CostSheetApi from '@/api/CostSheetApi';
import FeatureApi from '@/api/FeatureApi';
import { Feature } from '@/models';
import { GetUsageAnalyticsRequest, GetCostAnalyticsRequest } from '@/types';
import { WindowSize } from '@/models';
import { CustomerUsageChart, RedirectCell } from '@/components/molecules';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/molecules/Table/Table';
import { UsageAnalyticItem, PRICE_ENTITY_TYPE } from '@/models';
import { formatNumber } from '@/utils';
import { MetricCard, CostDataTable } from '@/components/molecules';
import { getCurrencySymbol } from '@/utils';
import { PriceTooltip } from '@/components/molecules/PriceTooltip';
import { Skeleton } from '@/components/ui';
import { ENTITY_STATUS } from '@/models/base';
import { RouteNames } from '@/core/routes/Routes';
import { PremiumFeatureIcon } from '@/components/molecules/PremiumFeature/PremiumFeature';
import { ChevronDown, ChevronUp, ChevronsUpDown, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const CustomerAnalyticsTab = () => {
	const { id: customerId } = useParams();
	const { updateBreadcrumb } = useBreadcrumbsStore();

	// Filter states
	const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>([]);
	const [startDate, setStartDate] = useState<Date | undefined>(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1);
	});
	const [endDate, setEndDate] = useState<Date | undefined>(new Date());

	const { data: customer, error: customerError } = useQuery({
		queryKey: ['customer', customerId],
		queryFn: async () => {
			return await CustomerApi.getCustomerById(customerId!);
		},
		enabled: !!customerId,
	});

	// Prepare Usage API parameters
	const usageApiParams: GetUsageAnalyticsRequest | null = useMemo(() => {
		if (!customer?.external_id) {
			return null;
		}

		const params: GetUsageAnalyticsRequest = {
			external_customer_id: customer.external_id,
			window_size: WindowSize.DAY,
		};

		if (selectedFeatures.length > 0) {
			params.feature_ids = selectedFeatures.map((f) => f.id);
		}

		if (startDate) {
			params.start_time = startDate.toISOString();
		}

		if (endDate) {
			params.end_time = endDate.toISOString();
		}

		return params;
	}, [customer?.external_id, selectedFeatures, startDate, endDate]);

	// Prepare Cost API parameters
	const costApiParams: GetCostAnalyticsRequest | null = useMemo(() => {
		if (!customer?.external_id) {
			return null;
		}

		const params: GetCostAnalyticsRequest = {
			external_customer_id: customer.external_id,
			expand: ['meter', 'price'],
		};

		if (selectedFeatures.length > 0) {
			params.feature_ids = selectedFeatures.map((feature) => feature.id);
		}

		if (startDate) {
			params.start_time = startDate.toISOString();
		}

		if (endDate) {
			params.end_time = endDate.toISOString();
		}

		return params;
	}, [customer?.external_id, selectedFeatures, startDate, endDate]);

	// Debounced API parameters with 300ms delay
	const [debouncedUsageParams, setDebouncedUsageParams] = useState<GetUsageAnalyticsRequest | null>(null);
	const [debouncedCostParams, setDebouncedCostParams] = useState<GetCostAnalyticsRequest | null>(null);

	useEffect(() => {
		if (usageApiParams) {
			const timeoutId = setTimeout(() => {
				setDebouncedUsageParams(usageApiParams);
			}, 300);

			return () => clearTimeout(timeoutId);
		} else {
			setDebouncedUsageParams(null);
		}
	}, [usageApiParams]);

	useEffect(() => {
		if (costApiParams) {
			const timeoutId = setTimeout(() => {
				setDebouncedCostParams(costApiParams);
			}, 300);

			return () => clearTimeout(timeoutId);
		} else {
			setDebouncedCostParams(null);
		}
	}, [costApiParams]);

	const {
		data: usageData,
		isLoading: usageLoading,
		error: usageError,
	} = useQuery({
		queryKey: ['usage', customerId, debouncedUsageParams],
		queryFn: async () => {
			if (!debouncedUsageParams) {
				throw new Error('API parameters not available');
			}

			const sanitizedParams = {
				...debouncedUsageParams,
				expand: ['meter', 'price'],
			};
			return await EventsApi.getUsageAnalytics(sanitizedParams);
		},
		enabled: !!debouncedUsageParams,
	});

	const {
		data: costData,
		isLoading: costLoading,
		error: costError,
	} = useQuery({
		queryKey: ['cost-analytics', customerId, debouncedCostParams],
		queryFn: async () => {
			const sanitizedParams = {
				...debouncedCostParams,
				expand: ['meter', 'price'],
			};
			return await CostSheetApi.GetCostAnalytics(sanitizedParams);
		},
		enabled: !!debouncedCostParams,
	});

	// Check if features are loading (same query key as FeatureMultiSelect uses)
	const { isLoading: featuresLoading } = useQuery({
		queryKey: ['fetchFeatures2'],
		queryFn: async () => {
			return await FeatureApi.listFeatures({
				status: ENTITY_STATUS.PUBLISHED,
				limit: 1000,
			});
		},
	});

	useEffect(() => {
		updateBreadcrumb(4, 'Analytics');
	}, [updateBreadcrumb]);

	useEffect(() => {
		if (customerError) {
			toast.error('Error fetching customer data');
		}
	}, [customerError]);

	useEffect(() => {
		if (usageError) {
			toast.error('Error fetching usage data');
		}
	}, [usageError]);

	useEffect(() => {
		if (costError) {
			toast.error('Error fetching cost data');
		}
	}, [costError]);

	// Filter zero-value features from usage data for chart
	const filteredUsageData = useMemo(() => {
		if (!usageData?.items) return null;
		const filteredItems = usageData.items.filter((item) => item.total_usage > 0);
		if (filteredItems.length === 0) {
			return {
				...usageData,
				items: [],
			};
		}
		return {
			...usageData,
			items: filteredItems,
		};
	}, [usageData]);

	// Check if revenue metrics should be displayed
	const hasRevenueData = useMemo(() => {
		if (!costData) return false;
		const totalRevenue = parseFloat(costData.total_revenue || '0');
		const totalCost = parseFloat(costData.total_cost || '0');
		const margin = parseFloat(costData.margin || '0');
		return totalRevenue > 0 || totalCost > 0 || Math.abs(margin) > 0;
	}, [costData]);

	// Custom analytics of type "feature" from usage API (for 5th+ metric boxes)
	const featureCustomAnalytics = useMemo(() => {
		if (!usageData?.custom_analytics) return [];
		return usageData.custom_analytics.filter((item) => item.type === 'feature');
	}, [usageData?.custom_analytics]);

	const handleStartDateChange = (date: Date | undefined) => {
		setStartDate(date);
		if (date && endDate && endDate <= date) {
			const newEndDate = new Date(date);
			newEndDate.setDate(newEndDate.getDate() + 1);
			setEndDate(newEndDate);
		}
	};

	const handleEndDateChange = (date: Date | undefined) => {
		setEndDate(date);
		if (date && startDate && startDate >= date) {
			const newStartDate = new Date(date);
			newStartDate.setDate(newStartDate.getDate() - 1);
			setStartDate(newStartDate);
		}
	};

	const minEndDate = startDate ? new Date(new Date(startDate).setDate(startDate.getDate() + 1)) : undefined;

	const maxStartDate = endDate ? new Date(new Date(endDate).setDate(endDate.getDate() - 1)) : undefined;

	const isLoading = usageLoading || costLoading;

	// Skeleton Components
	const RevenueMetricsSkeleton = () => (
		<div className='pt-9'>
			<div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className='bg-white border border-[#E5E7EB] p-[25px] rounded-md'>
						<Skeleton className='h-5 w-20 mb-3' />
						<Skeleton className='h-7 w-24' />
					</div>
				))}
			</div>
		</div>
	);

	const ChartSkeleton = () => (
		<div className='space-y-4'>
			<Skeleton className='h-6 w-32' />
			<Skeleton className='h-[400px] w-full' />
		</div>
	);

	const TableSkeleton = () => (
		<div className='space-y-4'>
			<Skeleton className='h-6 w-40' />
			<div className='space-y-2'>
				<Skeleton className='h-12 w-full' />
				<Skeleton className='h-12 w-full' />
				<Skeleton className='h-12 w-full' />
			</div>
		</div>
	);

	return (
		<div className='space-y-6'>
			<h3 className='text-lg font-medium flex items-center gap-2 text-gray-900 mb-8 mt-1'>
				<span>Analytics</span>
				<PremiumFeatureIcon />
			</h3>

			<div className='flex flex-wrap items-end gap-8'>
				{featuresLoading ? (
					<>
						<div className='flex-1 min-w-[200px] max-w-md'>
							<div className='w-full'>
								<Skeleton className='h-5 w-20 mb-1' />
								<Skeleton className='h-10 w-full' />
							</div>
						</div>
						<div>
							<Skeleton className='h-5 w-24 mb-1' />
							<Skeleton className='h-10 w-[280px]' />
						</div>
					</>
				) : (
					<>
						<div className='flex-1 min-w-[200px] max-w-md'>
							<FeatureMultiSelect
								label='Features'
								placeholder='Select features'
								values={selectedFeatures.map((f) => f.id)}
								onChange={setSelectedFeatures}
								className='text-sm'
							/>
						</div>
						{/* Start Date Picker */}
						<div className='min-w-[200px]'>
							<DatePicker
								date={startDate}
								setDate={handleStartDateChange}
								placeholder='Select start date'
								label='Start Date'
								maxDate={maxStartDate}
							/>
						</div>

						{/* End Date Picker */}
						<div className='min-w-[200px]'>
							<DatePicker
								date={endDate}
								setDate={handleEndDateChange}
								placeholder='Select end date'
								label='End Date'
								minDate={minEndDate}
							/>
						</div>
					</>
				)}
			</div>

			{/* Skeletons for Loading State */}
			{isLoading ? (
				<>
					{costLoading && <RevenueMetricsSkeleton />}
					{usageLoading && <ChartSkeleton />}
					{usageLoading && (
						<div className='!mt-10'>
							<TableSkeleton />
						</div>
					)}
					{costLoading && (
						<div className='pt-9'>
							<TableSkeleton />
						</div>
					)}
				</>
			) : (
				<>
					{/* Summary Metrics - Revenue tiles (same structure as CostAnalytics) + custom_analytics (type: feature) from usage API */}
					{((hasRevenueData && costData) || featureCustomAnalytics.length > 0) && (
						<div className='pt-9'>
							<div
								className={
									(costData ? 4 : 0) + featureCustomAnalytics.length >= 5
										? 'grid grid-cols-2 md:grid-cols-5 gap-2 min-w-0'
										: 'grid grid-cols-2 md:grid-cols-4 gap-3'
								}>
								{costData &&
									(() => {
										const totalRevenue = parseFloat(costData.total_revenue || '0');
										const totalCost = parseFloat(costData.total_cost || '0');
										const margin = parseFloat(costData.margin || '0');
										const marginPercent = parseFloat(costData.margin_percent || '0');
										return (
											<>
												<MetricCard title='Revenue' value={totalRevenue} currency={costData.currency} />
												<MetricCard title='Cost' value={totalCost} currency={costData.currency} />
												<MetricCard
													title='Margin'
													value={margin}
													currency={costData.currency}
													showChangeIndicator={true}
													isNegative={margin < 0}
												/>
												<MetricCard
													title='Margin %'
													value={marginPercent}
													isPercent={true}
													showChangeIndicator={true}
													isNegative={marginPercent < 0}
												/>
											</>
										);
									})()}
								{featureCustomAnalytics.map((item) => (
									<MetricCard key={item.id} title={`CPM`} value={parseFloat(item.value) || 0} currency={usageData?.currency ?? 'usd'} />
								))}
							</div>
						</div>
					)}

					{/* Usage Chart */}
					{filteredUsageData && (
						<div className=''>
							<CustomerUsageChart data={filteredUsageData} />
						</div>
					)}

					{/* Usage Data Table */}
					{filteredUsageData && filteredUsageData.items.length > 0 && (
						<div className='!mt-10'>
							<UsageDataTable items={filteredUsageData.items} />
						</div>
					)}

					{/* Cost Data Table */}
					{costData && costData.cost_analytics && costData.cost_analytics.length > 0 && (
						<div className='pt-9'>
							<CostDataTable items={costData.cost_analytics} />
						</div>
					)}
				</>
			)}
		</div>
	);
};

const UNGROUPED_KEY = '__ungrouped__';

interface GroupBucket {
	groupKey: string;
	groupName: string;
	items: UsageAnalyticItem[];
}

function renderTotalUsage(row: UsageAnalyticItem) {
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

function renderTotalCost(row: UsageAnalyticItem) {
	const cost = Number(row.total_cost);
	if (cost === 0 || !row.currency) return '-';
	const currency = getCurrencySymbol(row.currency);
	const isSubscriptionOverride = row.price?.entity_type === PRICE_ENTITY_TYPE.SUBSCRIPTION;
	return (
		<div className='flex items-center gap-2'>
			<span>
				{currency}
				{formatNumber(cost, 2)}
			</span>
			{row.price && <PriceTooltip data={row.price} isSubscriptionOverride={isSubscriptionOverride} />}
		</div>
	);
}

const UsageDataTable: React.FC<{ items: UsageAnalyticItem[] }> = ({ items }) => {
	type UsageSortField = 'total_usage' | 'total_cost';
	type SortDirection = 'asc' | 'desc';

	const [sortField, setSortField] = useState<UsageSortField>('total_cost');
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
	const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(() => new Set());

	const handleSortToggle = (field: UsageSortField) => {
		if (sortField !== field) {
			setSortField(field);
			setSortDirection('desc');
			return;
		}
		setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
	};

	const sortedItems = useMemo(() => {
		const sorted = [...items];
		const directionMultiplier = sortDirection === 'asc' ? 1 : -1;
		sorted.sort((a, b) => {
			const valueA = sortField === 'total_usage' ? Number(a.total_usage) : Number(a.total_cost);
			const valueB = sortField === 'total_usage' ? Number(b.total_usage) : Number(b.total_cost);
			return (valueA - valueB) * directionMultiplier;
		});
		return sorted;
	}, [items, sortDirection, sortField]);

	const { groupedBuckets, ungroupedItems } = useMemo(() => {
		const map = new Map<string, GroupBucket>();
		for (const item of sortedItems) {
			const group = item.price?.group;
			const groupKey = group?.id ?? UNGROUPED_KEY;
			const groupName = group?.name ?? 'No group';
			if (!map.has(groupKey)) {
				map.set(groupKey, { groupKey, groupName, items: [] });
			}
			map.get(groupKey)!.items.push(item);
		}
		const buckets = Array.from(map.values());
		const ungrouped = map.get(UNGROUPED_KEY)?.items ?? [];
		const grouped = buckets.filter((b) => b.groupKey !== UNGROUPED_KEY).sort((a, b) => a.groupName.localeCompare(b.groupName));
		return { groupedBuckets: grouped, ungroupedItems: ungrouped };
	}, [sortedItems]);

	// Expand all / collapse all: only for real groups
	const allExpanded = groupedBuckets.length > 0 && groupedBuckets.every((b) => expandedGroupIds.has(b.groupKey));
	const toggleExpandAll = () => {
		if (allExpanded) {
			setExpandedGroupIds(new Set());
		} else {
			setExpandedGroupIds(new Set(groupedBuckets.map((b) => b.groupKey)));
		}
	};

	const toggleGroup = (groupKey: string) => {
		setExpandedGroupIds((prev) => {
			const next = new Set(prev);
			if (next.has(groupKey)) next.delete(groupKey);
			else next.add(groupKey);
			return next;
		});
	};

	// Default: all groups expanded on first load
	const hasInitializedExpand = useRef(false);
	useEffect(() => {
		if (groupedBuckets.length > 0 && !hasInitializedExpand.current) {
			hasInitializedExpand.current = true;
			setExpandedGroupIds(new Set(groupedBuckets.map((b) => b.groupKey)));
		}
	}, [groupedBuckets]);

	const renderSortableHeader = (field: UsageSortField, label: string) => {
		const isActive = sortField === field;
		return (
			<button
				type='button'
				className={cn(
					'group -ml-1 inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-left transition-colors',
					isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
				)}
				onClick={() => handleSortToggle(field)}>
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

	const hasGroups = groupedBuckets.length > 0;

	return (
		<>
			<div className='flex items-center justify-between mb-4'>
				<h1 className='text-lg font-medium text-gray-900'>Usage Breakdown</h1>
				{hasGroups && (
					<button type='button' onClick={toggleExpandAll} className='text-sm text-gray-600 hover:text-gray-900'>
						{allExpanded ? 'Collapse all' : 'Expand all'}
					</button>
				)}
			</div>

			<div className='rounded-md border border-gray-200 bg-white overflow-hidden shadow-sm'>
				<Table>
					<TableHeader className='h-10 bg-gray-50 border-b border-gray-200 rounded-t-md'>
						<TableRow className='rounded-t-md border-b border-gray-200'>
							<TableHead className='rounded-tl-md pl-4 font-semibold text-gray-700 text-[13px]'>Feature</TableHead>
							<TableHead className='font-semibold text-gray-700 text-[13px]'>
								{renderSortableHeader('total_usage', 'Total Usage')}
							</TableHead>
							<TableHead className='rounded-tr-md font-semibold text-gray-700 text-[13px]'>
								{renderSortableHeader('total_cost', 'Total Cost')}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{/* Group rows + child rows with exact tree structure (connector lines + indent) */}
						{groupedBuckets.map((bucket) => {
							const isExpanded = expandedGroupIds.has(bucket.groupKey);
							const aggregateCost = bucket.items.reduce((sum, i) => sum + Number(i.total_cost), 0);
							const firstCurrency = bucket.items[0]?.currency;
							return (
								<React.Fragment key={bucket.groupKey}>
									{/* Group header row – grey box, square icon, bold text */}
									<TableRow
										className={cn(
											'h-10 align-middle border-b border-gray-200 bg-gray-100',
											'hover:bg-gray-100 transition-colors',
											bucket.items.length === 0 && 'border-b-0',
										)}>
										<TableCell className='pl-4 py-2.5 align-middle'>
											<button
												type='button'
												onClick={() => toggleGroup(bucket.groupKey)}
												className='inline-flex items-center gap-3 text-left'>
												{bucket.items.length > 0 ? (
													<span
														className={cn(
															'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm',
															'border border-gray-300 bg-white text-gray-900',
															'hover:bg-gray-50 transition-colors',
														)}
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
									{/* Child rows: vertical ends at last child; horizontal branch right; white box */}
									{isExpanded &&
										bucket.items.map((row, childIndex) => {
											const isLastChild = childIndex === bucket.items.length - 1;
											return (
												<TableRow
													key={row.feature_id || row.price_id || row.name || Math.random()}
													className='h-10 align-middle border-b border-gray-200 bg-white hover:bg-gray-50/50 transition-colors'>
													<TableCell className='py-2.5 pl-4 font-normal text-gray-700 text-[13px] align-middle relative'>
														{/* Vertical stops at last child (half row); horizontal branches right */}
														<span
															className={cn('absolute left-6 w-px bg-gray-300', isLastChild ? 'top-0 h-1/2' : 'top-0 bottom-0')}
															aria-hidden
														/>
														<span className='absolute left-6 top-1/2 h-px w-6 -translate-y-px bg-gray-300' aria-hidden />
														<div className='pl-10 relative z-10'>
															{row.feature_id ? (
																<RedirectCell target='_blank' redirectUrl={`${RouteNames.featureDetails}/${row.feature_id}`}>
																	{row.name}
																</RedirectCell>
															) : (
																<span>{row.name || 'Unknown'}</span>
															)}
														</div>
													</TableCell>
													<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>{renderTotalUsage(row)}</TableCell>
													<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>{renderTotalCost(row)}</TableCell>
												</TableRow>
											);
										})}
								</React.Fragment>
							);
						})}
						{/* Ungrouped items: white box, no indent */}
						{ungroupedItems.map((row) => (
							<TableRow
								key={row.feature_id || row.price_id || row.name || row.meter_id || Math.random()}
								className='h-10 align-middle border-b border-gray-200 bg-white hover:bg-gray-50/50 transition-colors'>
								<TableCell className='pl-4 py-2.5 font-normal text-gray-700 text-[13px]'>
									{row.feature_id ? (
										<RedirectCell target='_blank' redirectUrl={`${RouteNames.featureDetails}/${row.feature_id}`}>
											{row.name}
										</RedirectCell>
									) : (
										<span>{row.name || 'Unknown'}</span>
									)}
								</TableCell>
								<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>{renderTotalUsage(row)}</TableCell>
								<TableCell className='py-2.5 font-normal text-gray-600 text-[13px]'>{renderTotalCost(row)}</TableCell>
							</TableRow>
						))}
						{/* Empty state */}
						{items.length === 0 && (
							<TableRow className='bg-white'>
								<TableCell colSpan={3} className='pl-4 py-4 font-normal text-gray-500 text-[13px]'>
									--
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</>
	);
};

export default CustomerAnalyticsTab;
