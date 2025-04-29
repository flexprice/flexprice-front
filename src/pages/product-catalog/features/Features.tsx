import { AddButton, Input, Loader, Page, ShortPagination, Spacer } from '@/components/atoms';
import { ApiDocsContent, FeatureTable, FilterState } from '@/components/molecules';
import EmptyPage from '@/components/organisms/EmptyPage/EmptyPage';
import { RouteNames } from '@/core/routes/Routes';
import GUIDES from '@/core/constants/guides';
import usePagination from '@/hooks/usePagination';
import FeatureApi from '@/utils/api_requests/FeatureApi';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { useState } from 'react';

const FeaturesPage = () => {
	const { limit, offset, page } = usePagination();
	const [filters, setfilters] = useState<FilterState>({
		searchQuery: '',
		sortBy: '',
		sortDirection: 'asc',
	});

	// Add debounce to search query
	const [debouncedSearchQuery] = useDebounce(filters.searchQuery, 300);

	const fetchFeatures = async () => {
		return await FeatureApi.getAllFeatures({
			limit,
			offset,
			name_contains: debouncedSearchQuery,
		});
	};
	const navigate = useNavigate();

	const {
		data: featureData,
		isLoading,
		isError,
		isFetching,
	} = useQuery({
		queryKey: ['fetchFeatures', page, debouncedSearchQuery],
		queryFn: fetchFeatures,
	});

	// Handle error state
	if (isError) {
		toast.error('Error fetching features');
		return null;
	}

	// Render empty state when no features and no search query
	if (!isLoading && featureData?.items.length === 0 && !filters.searchQuery) {
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
					<Input
						className='min-w-[400px]'
						suffix={<Search className='size-[14px] text-gray-500' />}
						placeholder='Search by Name or lookup key'
						value={filters.searchQuery}
						onChange={(e) => setfilters({ ...filters, searchQuery: e })}
						size='sm'
					/>
					<Link to={RouteNames.createFeature}>
						<AddButton />
					</Link>
				</div>
			}>
			<ApiDocsContent tags={['Features']} />
			<div>
				{filters.searchQuery && isFetching ? (
					<div className='flex justify-center py-4'>
						<Loader />
					</div>
				) : (
					<>
						<FeatureTable data={featureData?.items || []} />
						<Spacer className='!h-4' />
						<ShortPagination unit='Features' totalItems={featureData?.pagination.total ?? 0} />
					</>
				)}
			</div>
		</Page>
	);
};

export default FeaturesPage;
