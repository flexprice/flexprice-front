import { AddButton, Page, ShortPagination, Spacer } from '@/components/atoms';
import { QueryBuilder } from '@/components/molecules';
import EmptyPage from '@/components/organisms/EmptyPage/EmptyPage';
import { RouteNames } from '@/core/routes/Routes';
import GUIDES from '@/constants/guides';
import usePagination from '@/hooks/usePagination';
import PriceUnitApi from '@/api/PriceUnitApi';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
} from '@/types/common/QueryBuilder';
import { ENTITY_STATUS } from '@/models/base';
import useFilterSorting from '@/hooks/useFilterSorting';
import { useQueryWithEmptyState } from '@/hooks/useQueryWithEmptyState';
import { PriceUnitResponse } from '@/types/dto/PriceUnit';
import PriceUnitsTable from './components/PriceUnitsTable';
import PriceUnitDrawer from './components/PriceUnitDrawer';

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
		field: 'code',
		label: 'Code',
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
			{ value: ENTITY_STATUS.PUBLISHED, label: 'Active' },
			{ value: ENTITY_STATUS.ARCHIVED, label: 'Inactive' },
		],
	},
];

export const PriceUnitsPage: React.FC = () => {
	const { limit, offset, page, reset } = usePagination();
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [selectedPriceUnit, setSelectedPriceUnit] = useState<PriceUnitResponse | null>(null);

	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		initialFilters: [
			{
				field: 'name',
				operator: FilterOperator.CONTAINS,
				valueString: '',
				dataType: DataType.STRING,
				id: 'initial-name',
			},
			{
				field: 'status',
				operator: FilterOperator.IS_ANY_OF,
				valueArray: [ENTITY_STATUS.PUBLISHED],
				dataType: DataType.ARRAY,
				id: 'initial-status',
			},
		],
		initialSorts: [
			{
				field: 'updated_at',
				label: 'Updated At',
				direction: SortDirection.DESC,
			},
		],
		debounceTime: 500,
	});

	const fetchPriceUnits = async () => {
		return await PriceUnitApi.search({
			limit: limit,
			offset: offset,
			filters: sanitizedFilters,
			sort: sanitizedSorts,
		});
	};

	useEffect(() => {
		reset();
	}, [sanitizedFilters, sanitizedSorts, reset]);

	const {
		isLoading,
		isError,
		data: priceUnitData,
		probeData,
	} = useQueryWithEmptyState({
		main: {
			queryKey: ['fetchPriceUnits', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: fetchPriceUnits,
		},
		probe: {
			queryKey: ['fetchPriceUnits', 'probe', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: async () => {
				return await PriceUnitApi.search({
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

	const handleCreateNew = () => {
		setSelectedPriceUnit(null);
		setIsDrawerOpen(true);
	};

	// show empty page when no price units and no search query
	const showEmptyPage = useMemo(() => {
		return !isLoading && probeData?.items.length === 0 && priceUnitData?.items.length === 0;
	}, [isLoading, probeData, priceUnitData]);

	// Handle error state
	if (isError) {
		toast.error('Error fetching price units');
		return null;
	}

	// Render empty state when no price units and no search query
	if (showEmptyPage) {
		return (
			<EmptyPage
				heading='Price Units'
				tags={['Price Units']}
				tutorials={GUIDES.priceUnits?.tutorials}
				emptyStateCard={{
					heading: 'Add your first price unit',
					description: 'Create your first price unit to define custom pricing units.',
					buttonLabel: 'Create Price Unit',
					buttonAction: handleCreateNew,
				}}
				onAddClick={handleCreateNew}
			/>
		);
	}

	return (
		<Page
			heading='Price Units'
			headingCTA={
				<div className='flex justify-between items-center gap-2'>
					<Link to={`${RouteNames.priceUnits}/create`}>
						<AddButton label='Add Price Unit' />
					</Link>
				</div>
			}>
			<div>
				<QueryBuilder
					filterOptions={filterOptions}
					filters={filters}
					onFilterChange={setFilters}
					sortOptions={sortingOptions}
					onSortChange={setSorts}
					selectedSorts={sorts}
				/>
				<PriceUnitsTable data={priceUnitData?.items || []} />
				<Spacer className='!h-4' />
				<ShortPagination unit='Price Units' totalItems={priceUnitData?.pagination.total ?? 0} />
			</div>

			<PriceUnitDrawer
				data={selectedPriceUnit || undefined}
				open={isDrawerOpen}
				onOpenChange={setIsDrawerOpen}
				trigger={<AddButton label='Add Price Unit' />}
			/>
		</Page>
	);
};
