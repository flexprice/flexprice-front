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
import { RedirectCell, MetricCard, CostDataTable } from '@/components/molecules';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/molecules/Table/Table';
import { UsageAnalyticItem, PRICE_ENTITY_TYPE } from '@/models';
import { formatNumber, formatCurrencyAmount, getCurrencySymbol } from '@/utils';
import { PriceTooltip } from '@/components/molecules/PriceTooltip';
import { Skeleton } from '@/components/ui';
import { ENTITY_STATUS } from '@/models/base';
import { RouteNames } from '@/core/routes/Routes';
import { PremiumFeatureIcon } from '@/components/molecules/PremiumFeature/PremiumFeature';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

const EXPAND_ALL_SVG = '/assets/svg/expand-all-svgrepo-com.svg';
const COLLAPSE_ALL_SVG = '/assets/svg/collapse-all-svgrepo-com.svg';
const CHEVRON_UP_SVG = '/assets/svg/chevron-up-svgrepo-com.svg';
const CHEVRON_DOWN_SVG = '/assets/svg/chevron-down-svgrepo-com.svg';
import { cn } from '@/lib/utils';
import { Checkbox as UiCheckbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import { mergeUsageAndCostAnalytics, type MergedUsageAnalyticRow } from '@/utils/analytics/mergeUsageAndCostAnalytics';

const CustomerAnalyticsTab = () => {
	const { t } = useTranslation('customers');
	const { id: customerId } = useParams();
	const { updateBreadcrumb } = useBreadcrumbsStore();

	// Filter states
	const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>([]);
	const [includeChildren, setIncludeChildren] = useState(false);
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

		if (includeChildren) {
			params.include_children = true;
		}

		return params;
	}, [customer?.external_id, selectedFeatures, startDate, endDate, includeChildren]);

	// Prepare Cost API parameters
	const costApiParams: GetCostAnalyticsRequest | null = useMemo(() => {
		if (!customer?.external_id) {
			return null;
		}

		const params: GetCostAnalyticsRequest = {
			external_customer_id: customer.external_id,
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

		if (includeChildren) {
			params.include_children = true;
		}

		return params;
	}, [customer?.external_id, selectedFeatures, startDate, endDate, includeChildren]);

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
				expand: ['price'],
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
		updateBreadcrumb(4, t('detail.tabs.analytics'));
	}, [updateBreadcrumb, t]);

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

	const { mergedUsageItems, unmatchedCostItems } = useMemo(() => {
		if (!filteredUsageData?.items) {
			return { mergedUsageItems: [], unmatchedCostItems: costData?.cost_analytics ?? [] };
		}

		return mergeUsageAndCostAnalytics(filteredUsageData.items, costData?.cost_analytics ?? []);
	}, [filteredUsageData, costData?.cost_analytics]);

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
					<div key={i} className='bg-surface border border-line p-[25px] rounded-md'>
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
			<h3 className='text-lg font-medium flex items-center gap-2 text-content mb-8 mt-1'>
				<span>{t('tabPanels.analytics.heading')}</span>
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
								label={t('tabPanels.analytics.featuresLabel')}
								placeholder={t('tabPanels.analytics.featuresPlaceholder')}
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
								placeholder={t('tabPanels.analytics.startDatePlaceholder')}
								label={t('tabPanels.analytics.startDateLabel')}
								maxDate={maxStartDate}
							/>
						</div>

						{/* End Date Picker */}
						<div className='min-w-[200px]'>
							<DatePicker
								date={endDate}
								setDate={handleEndDateChange}
								placeholder={t('tabPanels.analytics.endDatePlaceholder')}
								label={t('tabPanels.analytics.endDateLabel')}
								minDate={minEndDate}
							/>
						</div>
						<div className='ml-auto min-w-[200px]'>
							<div className='mb-1 w-full text-start text-sm text-content-zinc-tertiary'>{t('tabPanels.analytics.options')}</div>
							<label
								htmlFor='include-children'
								className={cn(
									'flex h-10 w-full items-center gap-2 rounded-[6px] border border-input bg-background px-3',
									'cursor-pointer select-none',
								)}>
								<UiCheckbox id='include-children' checked={includeChildren} onCheckedChange={(v) => setIncludeChildren(Boolean(v))} />
								<span className='text-sm font-medium text-content-zinc-bold'>{t('tabPanels.analytics.includeChildren')}</span>
							</label>
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
												<MetricCard title={t('tabPanels.analytics.metricRevenue')} value={totalRevenue} currency={costData.currency} />
												<MetricCard title={t('tabPanels.analytics.metricCost')} value={totalCost} currency={costData.currency} />
												<MetricCard
													title={t('tabPanels.analytics.metricMargin')}
													value={margin}
													currency={costData.currency}
													showChangeIndicator={true}
													isNegative={margin < 0}
												/>
												<MetricCard
													title={t('tabPanels.analytics.metricMarginPercent')}
													value={marginPercent}
													isPercent={true}
													showChangeIndicator={true}
													isNegative={marginPercent < 0}
												/>
											</>
										);
									})()}
								{featureCustomAnalytics.map((item) => (
									<MetricCard
										key={item.id}
										title={t('tabPanels.analytics.metricCpm')}
										value={parseFloat(item.value) || 0}
										currency={usageData?.currency ?? 'usd'}
									/>
								))}
							</div>
						</div>
					)}

					{/* Usage Chart */}
					{/* {filteredUsageData && (
						<div className=''>
							<CustomerUsageChart data={filteredUsageData} />
						</div>
					)} */}

					{/* Usage Data Table */}
					{filteredUsageData != null && (
						<div className='!mt-10'>
							<UsageDataTable items={mergedUsageItems} />
						</div>
					)}

					{/* Cost Data Table — only unmatched cost analytics (no usage meter match) */}
					{unmatchedCostItems.length > 0 && (
						<div className='pt-9'>
							<CostDataTable items={unmatchedCostItems} />
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
	items: MergedUsageAnalyticRow[];
}

/** API sort field keys — not user-visible copy */
const USAGE_BREAKDOWN_SORT_FIELDS = {
	totalUsage: 'total_usage',
	revenue: 'total_cost',
	cogs: 'cogs',
	margin: 'margin',
} as const;

/** Unique key for a usage row (same feature can appear multiple times under different prices/meters). */
function usageRowKey(row: UsageAnalyticItem, fallbackIndex: number): string {
	return row.sub_line_item_id ?? ([row.price_id, row.meter_id, row.feature_id].filter(Boolean).join(':') || `row-${fallbackIndex}`);
}

/** Renders only the child rows of a group so expanding/collapsing doesn't re-render the whole table. */
const GroupChildRows = React.memo(function GroupChildRows({ bucket, isExpanded }: { bucket: GroupBucket; isExpanded: boolean }) {
	const { t } = useTranslation('customers');
	if (!isExpanded || bucket.items.length === 0) return null;
	return (
		<>
			{bucket.items.map((row, childIndex) => (
				<TableRow
					key={usageRowKey(row, childIndex)}
					className='h-10 align-middle border-b border-line bg-surface hover:bg-surface-subtle/50 transition-colors'>
					<TableCell className='py-2.5 pl-4 font-normal text-content-secondary text-[13px] align-middle'>
						{row.feature_id ? (
							<RedirectCell target='_blank' redirectUrl={`${RouteNames.featureDetails}/${row.feature_id}`}>
								{row.name}
							</RedirectCell>
						) : (
							<span>{row.name || t('tabPanels.common.unknown')}</span>
						)}
					</TableCell>
					<TableCell className='py-2.5 font-normal text-content-tertiary text-[13px]'>{renderTotalUsage(row)}</TableCell>
					<TableCell className='py-2.5 font-normal text-content-tertiary text-[13px]'>{renderRevenue(row)}</TableCell>
					<TableCell className='py-2.5 font-normal text-content-tertiary text-[13px]'>{renderCogs(row)}</TableCell>
					<TableCell className='py-2.5 font-normal text-content-tertiary text-[13px]'>{renderMargin(row)}</TableCell>
				</TableRow>
			))}
		</>
	);
});

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
	const formattedUsage = useDisplayValue ? formatNumber(displayNum, displayNum % 1 === 0 ? 0 : 2) : formatNumber(Number(row.total_usage));
	return (
		<span>
			{formattedUsage}
			{suffix}
		</span>
	);
}

function renderRevenue(row: UsageAnalyticItem) {
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

function renderCurrencyAmount(amount: number | null, currency?: string, options?: { showSign?: boolean }) {
	if (amount == null || !currency) return '-';
	return <span>{formatCurrencyAmount(amount, currency, { showSign: options?.showSign })}</span>;
}

function renderCogs(row: MergedUsageAnalyticRow) {
	return renderCurrencyAmount(row.cogs, row.currency);
}

function renderMargin(row: MergedUsageAnalyticRow) {
	return renderCurrencyAmount(row.margin, row.currency, { showSign: true });
}

function getUsageSortValue(row: MergedUsageAnalyticRow, field: 'total_usage' | 'total_cost' | 'cogs' | 'margin'): number {
	if (field === 'total_usage') return Number(row.total_usage);
	if (field === 'total_cost') return Number(row.total_cost);
	return Number(row[field] ?? Number.NEGATIVE_INFINITY);
}

const UsageDataTable: React.FC<{ items: MergedUsageAnalyticRow[] }> = ({ items }) => {
	const { t } = useTranslation('customers');
	type UsageSortField = 'total_usage' | 'total_cost' | 'cogs' | 'margin';
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
		sorted.sort((a, b) => (getUsageSortValue(a, sortField) - getUsageSortValue(b, sortField)) * directionMultiplier);
		return sorted;
	}, [items, sortDirection, sortField]);

	// Group by feature's group (top-level group or feature.group from API); fallback to price.group for backward compat
	const { groupedBuckets, ungroupedItems } = useMemo(() => {
		const map = new Map<string, GroupBucket>();
		for (const item of sortedItems) {
			const group = item.group ?? item.feature?.group ?? item.price?.group;
			const groupKey = group?.id ?? UNGROUPED_KEY;
			const groupName = group?.name ?? 'No group';
			if (!map.has(groupKey)) {
				map.set(groupKey, { groupKey, groupName, items: [] });
			}
			map.get(groupKey)!.items.push(item);
		}
		const ungrouped = map.get(UNGROUPED_KEY)?.items ?? [];
		const grouped = Array.from(map.values())
			.filter((b) => b.groupKey !== UNGROUPED_KEY)
			.sort((a, b) => a.groupName.localeCompare(b.groupName));
		return { groupedBuckets: grouped, ungroupedItems: ungrouped };
	}, [sortedItems]);

	const allExpanded = groupedBuckets.length > 0 && groupedBuckets.every((b) => expandedGroupIds.has(b.groupKey));
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

	const hasInitializedExpand = useRef(false);
	useEffect(() => {
		if (groupedBuckets.length > 0 && !hasInitializedExpand.current) {
			hasInitializedExpand.current = true;
			setExpandedGroupIds(new Set(groupedBuckets.map((b) => b.groupKey)));
		}
	}, [groupedBuckets]);

	const hasGroups = groupedBuckets.length > 0;

	const renderSortableHeader = (field: UsageSortField, label: string) => {
		const isActive = sortField === field;
		return (
			<button
				type='button'
				className={cn(
					'group -ml-1 inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-left transition-colors',
					isActive ? 'text-content' : 'text-content-muted hover:text-content-secondary',
				)}
				onClick={() => handleSortToggle(field)}>
				<span className='leading-none'>{label}</span>
				{sortDirection === 'asc' && isActive ? (
					<ChevronUp className='h-3.5 w-3.5 shrink-0 text-content' />
				) : isActive ? (
					<ChevronDown className='h-3.5 w-3.5 shrink-0 text-content' />
				) : (
					<ChevronsUpDown className='h-3.5 w-3.5 shrink-0 text-content-subtle group-hover:text-content-muted' />
				)}
			</button>
		);
	};

	return (
		<>
			<div className='flex items-center justify-between mb-4'>
				<h1 className='text-lg font-medium text-content'>{t('tabPanels.analytics.usageBreakdown')}</h1>
				{hasGroups && (
					<button
						type='button'
						onClick={toggleExpandAll}
						className='inline-flex items-center justify-center text-content-tertiary hover:text-content'
						aria-label={allExpanded ? t('tabPanels.analytics.collapseAll') : t('tabPanels.analytics.expandAll')}>
						<img src={allExpanded ? COLLAPSE_ALL_SVG : EXPAND_ALL_SVG} alt='' className='h-4 w-4' />
					</button>
				)}
			</div>

			<div className='rounded-md border border-line bg-surface overflow-hidden shadow-sm'>
				<Table>
					<TableHeader className='h-10 bg-surface-subtle border-b border-line rounded-t-md'>
						<TableRow className='rounded-t-md border-b border-line'>
							<TableHead className='rounded-tl-md pl-4 font-semibold text-content-secondary text-[13px]'>
								{t('usageTable.columns.feature')}
							</TableHead>
							<TableHead className='font-semibold text-content-secondary text-[13px]'>
								{renderSortableHeader(USAGE_BREAKDOWN_SORT_FIELDS.totalUsage, t('tabPanels.analytics.totalUsage'))}
							</TableHead>
							<TableHead className='font-semibold text-content-secondary text-[13px]'>
								{renderSortableHeader(USAGE_BREAKDOWN_SORT_FIELDS.revenue, t('tabPanels.analytics.metricRevenue'))}
							</TableHead>
							<TableHead className='font-semibold text-content-secondary text-[13px]'>
								{renderSortableHeader(USAGE_BREAKDOWN_SORT_FIELDS.cogs, t('tabPanels.analytics.cogs'))}
							</TableHead>
							<TableHead className='rounded-tr-md font-semibold text-content-secondary text-[13px]'>
								{renderSortableHeader(USAGE_BREAKDOWN_SORT_FIELDS.margin, t('tabPanels.analytics.metricMargin'))}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{groupedBuckets.map((bucket) => {
							const isExpanded = expandedGroupIds.has(bucket.groupKey);
							const aggregateRevenue = bucket.items.reduce((sum, i) => sum + Number(i.total_cost), 0);
							const aggregateCogs = bucket.items.reduce((sum, i) => sum + (i.cogs ?? 0), 0);
							const aggregateMargin = bucket.items.reduce((sum, i) => sum + (i.margin ?? 0), 0);
							const hasCogs = bucket.items.some((i) => i.cogs != null);
							const hasMargin = bucket.items.some((i) => i.margin != null);
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
											'h-10 align-middle border-b border-line bg-surface cursor-pointer hover:bg-surface-subtle/50 transition-colors',
											bucket.items.length === 0 && 'border-b-0',
											bucket.items.length === 0 && 'cursor-default',
										)}>
										<TableCell className='pl-4 py-2.5 align-middle'>
											<div className='inline-flex items-center gap-2 text-left'>
												<span className='font-semibold text-content text-[13px]'>{bucket.groupName}</span>
												{bucket.items.length > 0 ? (
													<img src={isExpanded ? CHEVRON_UP_SVG : CHEVRON_DOWN_SVG} alt='' className='h-4 w-4 shrink-0' aria-hidden />
												) : null}
											</div>
										</TableCell>
										<TableCell className='py-2.5 font-normal text-content-secondary text-[13px]'>—</TableCell>
										<TableCell className='py-2.5 font-normal text-content-tertiary text-[13px]'>
											{renderCurrencyAmount(aggregateRevenue, firstCurrency)}
										</TableCell>
										<TableCell className='py-2.5 font-normal text-content-tertiary text-[13px]'>
											{hasCogs ? renderCurrencyAmount(aggregateCogs, firstCurrency) : '—'}
										</TableCell>
										<TableCell className='py-2.5 font-normal text-content-tertiary text-[13px]'>
											{hasMargin ? renderCurrencyAmount(aggregateMargin, firstCurrency, { showSign: true }) : '—'}
										</TableCell>
									</TableRow>
									<GroupChildRows bucket={bucket} isExpanded={isExpanded} />
								</React.Fragment>
							);
						})}
						{ungroupedItems.map((row, index) => (
							<TableRow
								key={`ungrouped:${usageRowKey(row, index)}`}
								className='h-10 align-middle border-b border-line bg-surface hover:bg-surface-subtle/50 transition-colors'>
								<TableCell className='pl-4 py-2.5 font-normal text-content-secondary text-[13px]'>
									{row.feature_id ? (
										<RedirectCell target='_blank' redirectUrl={`${RouteNames.featureDetails}/${row.feature_id}`}>
											{row.name}
										</RedirectCell>
									) : (
										<span>{row.name || t('tabPanels.common.unknown')}</span>
									)}
								</TableCell>
								<TableCell className='py-2.5 font-normal text-content-tertiary text-[13px]'>{renderTotalUsage(row)}</TableCell>
								<TableCell className='py-2.5 font-normal text-content-tertiary text-[13px]'>{renderRevenue(row)}</TableCell>
								<TableCell className='py-2.5 font-normal text-content-tertiary text-[13px]'>{renderCogs(row)}</TableCell>
								<TableCell className='py-2.5 font-normal text-content-tertiary text-[13px]'>{renderMargin(row)}</TableCell>
							</TableRow>
						))}
						{items.length === 0 && (
							<TableRow className='bg-surface'>
								<TableCell colSpan={5} className='pl-4 py-4 font-normal text-content-muted text-[13px]'>
									{t('tabPanels.analytics.tableEmpty')}
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
