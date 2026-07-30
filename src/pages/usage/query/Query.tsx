import React, { useState, useEffect, useMemo } from 'react';
import { Button, Page, Select } from '@/components/atoms';
import { ApiDocsContent, QueryBuilder } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import EventsApi from '@/api/EventsApi';
import { Skeleton } from '@/components/ui';
import { RefreshCw } from 'lucide-react';
import { FilterField, FilterFieldType, DEFAULT_OPERATORS_PER_DATA_TYPE, DataType, FilterOperator, SortDirection } from '@/types';
import useFilterSorting from '@/hooks/useFilterSorting';
import { TypedBackendFilter } from '@/types';
import { GetUsageByMeterPayload } from '@/types';
import { formatDateShort } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { Card, CardContent, ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui';
import { formatDateTime } from '@/utils';
import SelectFeature from '@/components/atoms/SelectFeature/SelectFeature';
import Feature, { FEATURE_TYPE } from '@/models/Feature';
import { useTranslation } from 'react-i18next';

// Helper function to convert sanitized filters to Usage API parameters
const convertFiltersToUsageParams = (filters: TypedBackendFilter[]): Partial<GetUsageByMeterPayload> => {
	const params: Partial<GetUsageByMeterPayload> = {};

	filters.forEach((filter) => {
		switch (filter.field) {
			case 'meter_id':
				if (filter.value.string) {
					params.meter_id = filter.value.string;
				}
				break;
			case 'external_customer_id':
				if (filter.value.string) {
					params.external_customer_id = filter.value.string;
				}
				break;
			case 'start_time':
				if (filter.value.date) {
					params.start_time = filter.value.date;
				}
				break;
			case 'end_time':
				if (filter.value.date) {
					params.end_time = filter.value.date;
				}
				break;
			case 'window_size':
				if (filter.value.string) {
					params.window_size = filter.value.string;
				}
				break;
		}
	});

	return params;
};

const getNext24HoursDate = (date: Date): Date => {
	const nextDate = new Date(date);
	nextDate.setHours(nextDate.getHours() + 23);
	nextDate.setMinutes(nextDate.getMinutes() + 59);
	return nextDate;
};

const WINDOW_SIZE_KEYS = ['MINUTE', '15MIN', '30MIN', 'HOUR', '3HOUR', '6HOUR', '12HOUR', 'DAY', 'WEEK'] as const;

// const sortingOptions: SortOption[] = [
// 	{
// 		field: 'window_size',
// 		label: 'Time Window',
// 		direction: SortDirection.ASC,
// 	},
// 	{
// 		field: 'value',
// 		label: 'Usage Value',
// 		direction: SortDirection.DESC,
// 	},
// ];

const QueryPage: React.FC = () => {
	const { t } = useTranslation('developers');
	const [usageData, setUsageData] = useState<any>(null);
	const [selectedMeter, setSelectedMeter] = useState<string | undefined>(undefined);
	const [selectedFeature, setSelectedFeature] = useState<Feature | undefined>(undefined);
	const [windowSize, setWindowSize] = useState<string>('MINUTE');

	const windowSizeOptions = useMemo(() => WINDOW_SIZE_KEYS.map((value) => ({ value, label: t(`usage.query.windowSizes.${value}`) })), [t]);

	const filterOptions: FilterField[] = useMemo(
		() => [
			{
				field: 'external_customer_id',
				label: t('usage.query.filters.customerId'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'start_time',
				label: t('usage.query.filters.startTime'),
				fieldType: FilterFieldType.DATEPICKER,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
				dataType: DataType.DATE,
			},
			{
				field: 'end_time',
				label: t('usage.query.filters.endTime'),
				fieldType: FilterFieldType.DATEPICKER,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
				dataType: DataType.DATE,
			},
		],
		[t],
	);

	// Move useMemo here
	const initialFilters = useMemo(() => {
		return [
			{
				field: 'external_customer_id',
				operator: FilterOperator.CONTAINS,
				valueString: '',
				dataType: DataType.STRING,
				id: 'initial-customer-id',
			},
			{
				field: 'start_time',
				operator: FilterOperator.AFTER,
				valueDate: new Date(new Date().setDate(new Date().getDate() - 7)),
				dataType: DataType.DATE,
				id: 'initial-start-time',
			},
			{
				field: 'end_time',
				operator: FilterOperator.BEFORE,
				valueDate: new Date(),
				dataType: DataType.DATE,
				id: 'initial-end-time',
			},
		];
	}, []);

	const initialSorts = useMemo(
		() => [
			{
				field: 'window_size',
				label: t('usage.query.sortTimeWindow'),
				direction: SortDirection.ASC,
			},
		],
		[t],
	);

	const { filters, sorts, setFilters, setSorts, sanitizedFilters } = useFilterSorting({
		initialFilters: initialFilters,
		initialSorts,
		debounceTime: 300,
	});

	// Convert sanitized filters to API parameters
	const apiParams = useMemo(() => {
		const filterParams = convertFiltersToUsageParams(sanitizedFilters);
		return {
			...filterParams,
			meter_id: filterParams.meter_id || selectedMeter,
			window_size: windowSize,
		};
	}, [sanitizedFilters, selectedMeter, windowSize]);

	const { mutate: fetchUsage, isPending } = useMutation({
		mutationKey: ['fetchUsage', apiParams],
		mutationFn: async () => {
			if (!apiParams.meter_id) {
				throw new Error('Meter ID is required');
			}

			// Convert dates to ISO strings and handle end time
			const payload: GetUsageByMeterPayload = {
				meter_id: apiParams.meter_id,
				external_customer_id: apiParams.external_customer_id,
				window_size: apiParams.window_size || 'DAY',
			};

			if (apiParams.start_time) {
				payload.start_time = new Date(apiParams.start_time).toISOString();
			}
			if (apiParams.end_time) {
				payload.end_time = getNext24HoursDate(new Date(apiParams.end_time)).toISOString();
			}

			return await EventsApi.getUsageByMeter(payload);
		},
		onSuccess: (data) => {
			setUsageData(data);
		},
		onError: (error: Error) => toast.error(error.message || 'Error fetching usage data'),
	});

	const resetFilters = () => {
		setFilters(initialFilters);
	};

	// Fetch usage when filters change
	useEffect(() => {
		if (apiParams.meter_id) {
			fetchUsage();
		}
	}, [apiParams, fetchUsage]);

	const formattedData = usageData?.results?.map((item: any) => ({
		date: apiParams.window_size === 'DAY' ? formatDateShort(item.window_size) : formatDateTime(item.window_size || ''),
		value: item.value,
	}));

	const chartConfig = useMemo(
		() =>
			({
				value: { label: t('usage.query.chartSeriesUsage'), color: 'hsl(var(--chart-1))' },
			}) satisfies ChartConfig,
		[t],
	);

	return (
		<Page heading={t('usage.query.pageTitle')}>
			<ApiDocsContent tags={API_DOCS_TAGS.Events} />
			<div className='bg-white rounded-md flex items-start gap-4'>
				<QueryBuilder
					filterOptions={filterOptions}
					filters={filters}
					onFilterChange={setFilters}
					// sortOptions={sortingOptions}
					onSortChange={setSorts}
					selectedSorts={sorts}
				/>
				{/* Move SelectFeature here, after QueryBuilder and before Refresh button */}
				<div className='flex flex-col justify-end min-w-[250px]'>
					<SelectFeature
						featureTypes={[FEATURE_TYPE.METERED]}
						label=''
						className='w-full rounded-xl max-h-9'
						onChange={(feature: Feature) => {
							if (feature) {
								setSelectedFeature(feature);
								setSelectedMeter(feature.meter_id);
							}
						}}
						value={selectedFeature?.id}
						placeholder={t('usage.query.selectMeteredFeaturePlaceholder')}
					/>
				</div>
				<div className='flex flex-col justify-end min-w-32'>
					<Select
						className='w-full rounded-xl max-h-9'
						onChange={(value) => setWindowSize(value)}
						value={windowSize}
						options={windowSizeOptions.map((option) => ({ label: option.label, value: option.value }))}
					/>
				</div>
				<Button variant='outline' onClick={resetFilters}>
					<RefreshCw />
				</Button>
			</div>

			{/* Chart Section */}
			<Card className='shadow-md'>
				<CardContent className='mt-6'>
					{isPending ? (
						<Skeleton className='h-48 mb-4' />
					) : (
						<ChartContainer className='!max-h-96 w-full' config={chartConfig}>
							<LineChart
								data={
									(formattedData ?? []).length > 0
										? formattedData
										: [
												{ date: formatDateShort(new Date().toISOString()), value: 2 },
												{ date: formatDateShort(new Date().toISOString()), value: 4 },
												{ date: formatDateShort(new Date().toISOString()), value: 8 },
												{ date: formatDateShort(new Date().toISOString()), value: 10 },
											]
								}
								margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
								<CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
								<XAxis dataKey='date' tickLine={false} axisLine={false} tickMargin={10} className='text-gray-500' />
								<YAxis tickLine={false} axisLine={false} className='text-gray-500' />

								{(formattedData?.length ?? 0) > 0 ? (
									<>
										<RechartsTooltip
											itemStyle={{ zIndex: 999, backgroundColor: '#fff' }}
											labelFormatter={(value) => `${value}`}
											content={<ChartTooltipContent />}
											cursor={{ stroke: '#ccc' }}
											contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', zIndex: 999 }}
											wrapperStyle={{ backgroundColor: 'white', borderStyle: 'ridge', paddingLeft: '10px', paddingRight: '10px' }}
										/>
										<Line
											type='monotone'
											dataKey='value'
											stroke='#18181B'
											strokeWidth={1}
											dot={apiParams.window_size === 'DAY' ? { r: 2, fill: '#18181B' } : false}
											activeDot={apiParams.window_size === 'DAY' ? { r: 3, strokeWidth: 1 } : false}
										/>
									</>
								) : (
									<Line
										type='monotone'
										dataKey='value'
										strokeWidth={0}
										dot={{ r: 0, fill: '#18181B' }}
										activeDot={{ r: 0, strokeWidth: 0 }}
									/>
								)}
							</LineChart>
						</ChartContainer>
					)}
				</CardContent>
			</Card>
		</Page>
	);
};

export default QueryPage;
