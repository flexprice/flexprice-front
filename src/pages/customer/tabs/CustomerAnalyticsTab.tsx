import { useEffect, useState, useMemo } from 'react';
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
import { CustomerUsageChart, FlexpriceTable, RedirectCell, type ColumnData } from '@/components/molecules';
import { UsageAnalyticItem, PRICE_ENTITY_TYPE } from '@/models';
import { formatNumber } from '@/utils';
import { MetricCard, CostDataTable } from '@/components/molecules';
import { getCurrencySymbol } from '@/utils';
import { PriceTooltip } from '@/components/molecules/PriceTooltip';
import { Skeleton } from '@/components/ui';
import { ENTITY_STATUS } from '@/models/base';
import { RouteNames } from '@/core/routes/Routes';
import { PremiumFeatureIcon } from '@/components/molecules/PremiumFeature/PremiumFeature';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

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

const UsageDataTable: React.FC<{ items: UsageAnalyticItem[] }> = ({ items }) => {
	type UsageSortField = 'total_usage' | 'total_cost';
	type SortDirection = 'asc' | 'desc';

	const [sortField, setSortField] = useState<UsageSortField>('total_cost');
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
			switch (sortField) {
				case 'total_usage': {
					const valueA = a.total_usage ?? 0;
					const valueB = b.total_usage ?? 0;
					return (valueA - valueB) * directionMultiplier;
				}
				case 'total_cost': {
					const valueA = a.total_cost ?? 0;
					const valueB = b.total_cost ?? 0;
					return (valueA - valueB) * directionMultiplier;
				}
				default:
					return 0;
			}
		});

		return sorted;
	}, [items, sortDirection, sortField]);

	const renderSortableHeader = (field: UsageSortField, label: string) => {
		const isActive = sortField === field;
		return (
			<button
				type='button'
				className={`group -ml-1 inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-left transition-colors ${
					isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
				}`}
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

	// Define table columns
	const columns: ColumnData<UsageAnalyticItem>[] = [
		{
			title: 'Feature',
			render: (row: UsageAnalyticItem) => {
				if (row.feature_id) {
					return (
						<RedirectCell target='_blank' redirectUrl={`${RouteNames.featureDetails}/${row.feature_id}`}>
							{row.name}
						</RedirectCell>
					);
				}
				return <span>{row.name || row.name || 'Unknown'}</span>;
			},
		},
		{
			title: renderSortableHeader('total_usage', 'Total Usage'),
			render: (row: UsageAnalyticItem) => {
				if (row.total_usage_display !== '' && row.total_usage_display != null && row.reporting_unit != null) {
					const displayNum = Number(parseFloat((row.total_usage_display || '0').replace(/,/g, '')));
					const isSingular = displayNum === 1;
					const reportingUnitLabel = isSingular
						? (row.reporting_unit.unit_singular ?? row.reporting_unit.unit_plural ?? '')
						: (row.reporting_unit.unit_plural ?? row.reporting_unit.unit_singular ?? '');
					const suffix = reportingUnitLabel ? ` ${reportingUnitLabel}` : '';
					return (
						<span>
							{row.total_usage_display}
							{suffix}
						</span>
					);
				}
				const unit = row.unit ? ` ${row.total_usage === 1 ? row.unit : (row.unit_plural ?? row.unit)}` : '';
				return (
					<span>
						{formatNumber(row.total_usage)}
						{unit}
					</span>
				);
			},
		},
		{
			title: renderSortableHeader('total_cost', 'Total Cost'),
			render: (row: UsageAnalyticItem) => {
				if (row.total_cost === 0 || !row.currency) return '-';
				const currency = getCurrencySymbol(row.currency);
				const isSubscriptionOverride = row.price?.entity_type === PRICE_ENTITY_TYPE.SUBSCRIPTION;
				return (
					<div className='flex items-center gap-2'>
						<span>
							{currency}
							{formatNumber(row.total_cost, 2)}
						</span>
						{row.price && <PriceTooltip data={row.price} isSubscriptionOverride={isSubscriptionOverride} />}
					</div>
				);
			},
		},
	];

	// Prepare data for the table
	const tableData = sortedItems.map((item) => ({
		...item,
		// Ensure we have all required fields for the table
		id: item.feature_id || item.source || 'unknown',
	}));

	return (
		<>
			<h1 className='text-lg font-medium text-gray-900 mb-4'>Usage Breakdown</h1>
			<FlexpriceTable columns={columns} data={tableData} showEmptyRow />
		</>
	);
};

export default CustomerAnalyticsTab;
