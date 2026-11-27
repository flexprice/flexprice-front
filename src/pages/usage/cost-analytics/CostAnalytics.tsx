import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useBreadcrumbsStore } from '@/store';
import { Page, Input, DateRangePicker, FeatureMultiSelect, Loader } from '@/components/atoms';
import CostSheetApi from '@/api/CostSheetApi';
import toast from 'react-hot-toast';
import { GetCostAnalyticsRequest } from '@/types';
import { Feature } from '@/models';
import { ApiDocsContent, MetricCard } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { CostDataTable } from '@/components/molecules';
import { AlertTriangle } from 'lucide-react';

const CostAnalyticsPage: React.FC = () => {
	const { t } = useTranslation('developers');
	const { updateBreadcrumb } = useBreadcrumbsStore();

	// Filter states
	const [customerId, setCustomerId] = useState<string>('');
	const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>([]);
	const [fetchedFeatures, setFetchedFeatures] = useState<Feature[]>([]);
	const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 30)));
	const [endDate, setEndDate] = useState<Date>(new Date());

	// Prepare API parameters
	const apiParams: GetCostAnalyticsRequest | null = useMemo(() => {
		const params: GetCostAnalyticsRequest = {
			expand: ['meter', 'price'],
		};

		if (customerId.trim()) {
			params.external_customer_id = customerId.trim();
		}

		if (selectedFeatures.length > 0) {
			params.feature_ids = selectedFeatures.map((feature) => feature.id);
		} else if (fetchedFeatures.length > 0) {
			// Here if the features are not selected, we should give first 10 features
			params.feature_ids = fetchedFeatures.slice(0, 10).map((feature) => feature.id);
		}

		if (startDate) {
			params.start_time = startDate.toISOString();
		}

		if (endDate) {
			params.end_time = endDate.toISOString();
		}

		return params;
	}, [customerId, selectedFeatures, fetchedFeatures, startDate, endDate]);

	// Debounced API parameters with 300ms delay
	const [debouncedApiParams, setDebouncedApiParams] = useState<GetCostAnalyticsRequest | null>(null);

	useEffect(() => {
		if (apiParams) {
			const timeoutId = setTimeout(() => {
				setDebouncedApiParams(apiParams);
			}, 300);

			return () => clearTimeout(timeoutId);
		} else {
			setDebouncedApiParams(null);
		}
	}, [apiParams]);

	const {
		data: costData,
		isLoading: costLoading,
		error: costError,
	} = useQuery({
		queryKey: ['cost-analytics', debouncedApiParams],
		queryFn: async () => {
			if (!debouncedApiParams) {
				throw new Error('API parameters not available');
			}
			return await CostSheetApi.GetCostAnalytics(debouncedApiParams);
		},
		enabled: !!debouncedApiParams,
	});

	useEffect(() => {
		updateBreadcrumb(1, 'Analytics');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (costError) {
		toast.error('Error fetching cost data');
	}

	const handleDateRangeChange = ({ startDate: newStartDate, endDate: newEndDate }: { startDate?: Date; endDate?: Date }) => {
		if (newStartDate) {
			setStartDate(newStartDate);
		}
		if (newEndDate) {
			setEndDate(newEndDate);
		}
	};

	return (
		<Page heading={t('usage.costAnalytics.pageTitle')}>
			<ApiDocsContent tags={API_DOCS_TAGS.Costs} />
			<div className='space-y-6'>
				{/* Filters Section */}
				<div className='grid grid-cols-1 md:grid-cols-3 gap-3 w-full'>
					<div>
						<FeatureMultiSelect
							label={t('usage.costAnalytics.featuresLabel')}
							placeholder={t('usage.costAnalytics.selectFeaturesPlaceholder')}
							values={selectedFeatures.map((f) => f.id)}
							onChange={setSelectedFeatures}
							onFeaturesFetched={setFetchedFeatures}
							className='text-sm'
						/>
					</div>
					<div>
						<Input
							label={t('usage.costAnalytics.customerIdLabel')}
							placeholder={t('usage.costAnalytics.externalCustomerIdPlaceholder')}
							value={customerId}
							onChange={setCustomerId}
							className='text-sm'
						/>
					</div>
					<div>
						<DateRangePicker
							startDate={startDate}
							endDate={endDate}
							onChange={handleDateRangeChange}
							placeholder={t('usage.costAnalytics.selectDateRangePlaceholder')}
							title={t('usage.costAnalytics.dateRangeTitle')}
							className='w-full'
							popoverClassName='w-full'
							popoverTriggerClassName='w-full'
						/>
					</div>
				</div>

				{/* Single Loader at Page Level */}
				{costLoading ? (
					<div className='flex items-center justify-center py-12'>
						<Loader />
					</div>
				) : (
					costData && (
						<>
							{/* Summary Metrics */}
							<div className='pt-9'>
								{(() => {
									const costUnavailable = !!costData.cost_unavailable_reason;
									const totalRevenue = parseFloat(costData.total_revenue || '0');
									const totalCost = costUnavailable ? null : parseFloat(costData.total_cost || '0');
									const margin = costUnavailable ? null : parseFloat(costData.margin || '0');
									const marginPercent = costUnavailable ? null : parseFloat(costData.margin_percent || '0');

									return (
										<div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
											<MetricCard title={t('usage.costAnalytics.revenueMetric')} value={totalRevenue} currency={costData.currency} />
											<MetricCard title={t('usage.costAnalytics.costMetric')} value={totalCost} currency={costData.currency} />
											<MetricCard
												title={t('usage.costAnalytics.marginMetric')}
												value={margin}
												currency={costData.currency}
												showChangeIndicator={margin != null}
												isNegative={margin != null && margin < 0}
											/>
											<MetricCard
												title={t('usage.costAnalytics.marginPercentMetric')}
												value={marginPercent}
												isPercent={true}
												showChangeIndicator={marginPercent != null}
												isNegative={marginPercent != null && marginPercent < 0}
											/>
										</div>
									);
								})()}
								{costData.cost_unavailable_reason && (
									<div className='mt-3 flex items-start gap-2 rounded-md border border-warning-line bg-warning-muted p-3'>
										<AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-warning-bright' />
										<p className='text-sm text-warning-deep'>{costData.cost_unavailable_reason}</p>
									</div>
								)}
							</div>

							{/* Cost Data Table */}
							<div className='pt-9'>
								<CostDataTable items={costData.cost_analytics} />
							</div>
						</>
					)
				)}
			</div>
		</Page>
	);
};

export default CostAnalyticsPage;
