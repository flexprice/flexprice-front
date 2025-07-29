import { AddButton, Page, ShortPagination, Spacer } from '@/components/atoms';
import { ApiDocsContent, FeatureTable } from '@/components/molecules';
import EmptyPage from '@/components/organisms/EmptyPage/EmptyPage';
import { RouteNames } from '@/core/routes/Routes';
import GUIDES from '@/constants/guides';
import usePagination from '@/hooks/usePagination';
import FeatureApi from '@/api/FeatureApi';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { QueryBuilder } from '@/components/molecules';
import useFilterSorting from '@/hooks/useFilterSorting';
import { useQueryWithEmptyState } from '@/hooks/useQueryWithEmptyState';
import { featureFilterOptions, featureSortOptions, featureInitialFilters, featureInitialSorts } from '@/configs/entityFilterConfigs';

// Using centralized sorting options from entityFilterConfigs.ts
const sortingOptions = featureSortOptions;

// Using centralized filter options from entityFilterConfigs.ts
const filterOptions = featureFilterOptions;

const FeaturesPage = () => {
	const { limit, offset, page, reset } = usePagination();

	// Add debounce to search query

	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		initialFilters: featureInitialFilters,
		initialSorts: featureInitialSorts,
		debounceTime: 500,
	});

	const fetchFeatures = async () => {
		return await FeatureApi.getFeaturesByFilter({
			limit: limit,
			offset: offset,
			filters: sanitizedFilters,
			sort: sanitizedSorts,
		});
	};
	const navigate = useNavigate();

	useEffect(() => {
		reset();
	}, [sanitizedFilters, sanitizedSorts]);

	const {
		isLoading,
		isError,
		data: featureData,
		probeData,
	} = useQueryWithEmptyState({
		main: {
			queryKey: ['fetchFeatures', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: fetchFeatures,
		},
		probe: {
			queryKey: ['fetchFeatures', 'probe', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: async () => {
				return await FeatureApi.getFeaturesByFilter({
					limit: 1,
					offset: 0,
					filters: [],
					sort: [],
				});
			},
		},
		shouldProbe: (mainData) => {
			return mainData?.items.length === 0;
		},
	});

	// show empty page when no features and no search query
	const showEmptyPage = useMemo(() => {
		return !isLoading && probeData?.items.length === 0 && featureData?.items.length === 0;
	}, [isLoading, probeData, featureData]);

	// Handle error state
	if (isError) {
		toast.error('Error fetching features');
		return null;
	}

	// Render empty state when no features and no search query
	if (showEmptyPage) {
		return (
			<EmptyPage
				heading='Feature'
				tags={['Features']}
				tutorials={GUIDES.features.tutorials}
				emptyStateCard={{
					heading: 'Add your first feature',
					description: 'Create your first feature to define what customers pay for.',
					buttonLabel: 'Create Feature',
					buttonAction: () => navigate(RouteNames.createFeature),
				}}
				onAddClick={() => navigate(RouteNames.createFeature)}
			/>
		);
	}

	return (
		<Page
			heading='Features'
			headingCTA={
				<div className='flex justify-between items-center gap-2'>
					<Link to={RouteNames.createFeature}>
						<AddButton label='Add Feature' />
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
