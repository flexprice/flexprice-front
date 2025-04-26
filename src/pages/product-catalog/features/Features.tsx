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
import { useState } from 'react';
import { FilterCondition, FilterField, FilterFieldType, FilterOperator, ALLOWED_OPERATORS_PER_TYPE } from '@/types/common/QueryBuilder';
import { QueryBuilder } from '@/components/molecules';
import { SortDirection, SortOption } from '@/components/molecules/QueryBuilder/QueryBuilder';

const sortingOptions: SortOption[] = [
	{
		key: 'name',
		label: 'Name',
		direction: SortDirection.ASC,
	},
	{
		key: 'createdAt',
		label: 'Created At',
		direction: SortDirection.DESC,
	},
	{
		key: 'updatedAt',
		label: 'Updated At',
		direction: SortDirection.DESC,
	},
	{
		key: 'isActive',
		label: 'Status',
		direction: SortDirection.DESC,
	},
];

const filterOptions: FilterField[] = [
	{
		field: 'isActive',
		label: 'Status',
		fieldType: FilterFieldType.SELECT,
		operators: [FilterOperator.EQUAL, FilterOperator.NOT_EQUAL],
		options: ['Active', 'Inactive'],
	},
	{
		field: 'name',
		label: 'Name',
		fieldType: FilterFieldType.INPUT,
		operators: ALLOWED_OPERATORS_PER_TYPE[FilterFieldType.INPUT],
	},
	{
		field: 'createdAt',
		label: 'Created At',
		fieldType: FilterFieldType.DATEPICKER,
		operators: ALLOWED_OPERATORS_PER_TYPE[FilterFieldType.DATEPICKER],
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
					fields={filterOptions}
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
