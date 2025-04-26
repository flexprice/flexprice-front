import { AddButton, Page, ShortPagination, Spacer } from '@/components/atoms';
import { ApiDocsContent, FeatureTable } from '@/components/molecules';
import EmptyPage from '@/components/organisms/EmptyPage/EmptyPage';
import { RouteNames } from '@/core/routes/Routes';
import GUIDES from '@/core/constants/guides';
import usePagination from '@/hooks/usePagination';
import FeatureApi from '@/utils/api_requests/FeatureApi';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
	FilterCondition,
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	FilterOperator,
} from '@/types/common/QueryBuilder';
import { QueryBuilder } from '@/components/molecules';
import { SortDirection, SortOption } from '@/components/molecules/QueryBuilder/SortDropdown';
import { sanitizeFilterConditions, sanitizeSortConditions, convertToBackendPayload } from '@/types/formatters/QueryBuilder';
import { BaseEntityStatus } from '@/types/common';
import { FeatureType } from '@/models/Feature';
const sortingOptions: SortOption[] = [
	{
		field: 'name',
		label: 'Name',
		direction: SortDirection.ASC,
	},
	{
		field: 'createdAt',
		label: 'Created At',
		direction: SortDirection.DESC,
	},
	{
		field: 'updatedAt',
		label: 'Updated At',
		direction: SortDirection.DESC,
	},
];

const filterOptions: FilterField[] = [
	{
		field: 'name',
		label: 'Name',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'createdAt',
		label: 'Created At',
		fieldType: FilterFieldType.DATEPICKER,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
		dataType: DataType.DATE,
	},
	{
		field: 'Status',
		label: 'Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT_ANY_OF],
		dataType: DataType.ARRAY,
		options: [
			{ value: BaseEntityStatus.PUBLISHED, label: 'Active' },
			{ value: BaseEntityStatus.ARCHIVED, label: 'Inactive' },
		],
	},
	{
		field: 'type',
		label: 'Type',
		fieldType: FilterFieldType.SELECT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.ARRAY],
		dataType: DataType.ARRAY,
		options: [
			{ value: FeatureType.metered, label: 'Metered' },
			{ value: FeatureType.boolean, label: 'Boolean' },
			{ value: FeatureType.static, label: 'Static' },
		],
	},
];

const FeaturesPage = () => {
	const { limit, offset, page } = usePagination();


	// Add debounce to search query

	const [filters, setFilters] = useState<FilterCondition[]>([]);
	const [selectedSorts, setSelectedSorts] = useState<SortOption[]>([]);

	const fetchFeatures = async () => {
		return await FeatureApi.getAllFeatures({
			limit,
			offset,
		});
	};
	const navigate = useNavigate();

	useEffect(() => {
		const sanitizedFilters = sanitizeFilterConditions(filters);
		const sanitizedSorts = sanitizeSortConditions(selectedSorts);

		const backendPayload = convertToBackendPayload(sanitizedFilters, sanitizedSorts);
		console.log('backendPayload', backendPayload);
	}, [filters, selectedSorts]);

	const {
		data: featureData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchFeatures', page],
		queryFn: fetchFeatures,
	});

	// Handle error state
	if (isError) {
		toast.error('Error fetching features');
		return null;
	}

	// Render empty state when no features and no search query
	if (!isLoading && featureData?.items.length === 0) {
		return (
			<EmptyPage
				heading='Feature'
				onAddClick={() => navigate(RouteNames.createFeature)}
				tags={['Features']}
				tutorials={GUIDES.features.tutorials}
			/>
		);
	}

	return (
		<Page
			heading='Features'
			headingCTA={
				<div className='flex justify-between items-center gap-2'>
					<Link to={RouteNames.createFeature}>
						<AddButton />
					</Link>
				</div>
			}>
			<ApiDocsContent tags={['Features']} />
			<div>
				<QueryBuilder
					filterOptions={filterOptions}
					filters={filters}
					onFilterChange={setFilters}
					sortOptions={sortingOptions}
					onSortChange={setSelectedSorts}
					selectedSorts={selectedSorts}
				/>
				<FeatureTable data={featureData?.items || []} />
				<Spacer className='!h-4' />
				<ShortPagination unit='Features' totalItems={featureData?.pagination.total ?? 0} />
			</div >
		</Page >
	);
};

export default FeaturesPage;
