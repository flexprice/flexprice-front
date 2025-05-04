import { AddButton, Page, ShortPagination, Spacer } from '@/components/atoms';
import { ApiDocsContent, FeatureTable } from '@/components/molecules';
import EmptyPage from '@/components/organisms/EmptyPage/EmptyPage';
import { RouteNames } from '@/core/routes/Routes';
import GUIDES from '@/constants/guides';
import usePagination from '@/hooks/usePagination';
import FeatureApi from '@/api/FeatureApi';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
} from '@/types/common/QueryBuilder';
import { QueryBuilder } from '@/components/molecules';
import { BaseEntityStatus } from '@/types/common';
import { FeatureType } from '@/models/Feature';
import useFilterSorting from '@/hooks/useFilterSorting';

const sortingOptions: SortOption[] = [
	{
		field: 'name',
		label: 'Name',
		direction: SortDirection.ASC,
	},
	{
		field: 'created_at',
		label: 'Created At',
		direction: SortDirection.DESC,
	},
	{
		field: 'updated_at',
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
		field: 'created_at',
		label: 'Created At',
		fieldType: FilterFieldType.DATEPICKER,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
		dataType: DataType.DATE,
	},
	{
		field: 'status',
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
		fieldType: FilterFieldType.MULTI_SELECT,
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
	const { limit, offset, page, reset } = usePagination();

	// Add debounce to search query

	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		initialFilters: [],
		initialSorts: [],
		debounceTime: 500,
	});

	const fetchFeatures = async () => {
		return await FeatureApi.getFeaturesByFilter({
			limit,
			offset,
			filters: sanitizedFilters,
			sort: sanitizedSorts,
		});
	};
	const navigate = useNavigate();

	useEffect(() => {
		reset();
	}, [sanitizedFilters, sanitizedSorts]);

	const {
		data: featureData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchFeatures', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
		queryFn: fetchFeatures,
	});

	// Handle error state
	if (isError) {
		toast.error('Error fetching features');
		return null;
	}
	const showEmptyPage = !isLoading && featureData?.items.length === 0 && filters.length === 0 && sorts.length === 0;

	// Render empty state when no features and no search query

	if (showEmptyPage) {
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
					onSortChange={setSorts}
					selectedSorts={sorts}
				/>
				<FeatureTable data={featureData?.items || []} />
				<Spacer className='!h-4' />
				<ShortPagination unit='Features' totalItems={featureData?.pagination.total ?? 0} />
			</div>
		</Page>
	);
};
export default FeaturesPage;
