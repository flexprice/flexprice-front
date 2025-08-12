import { AddButton, Loader, Page, ShortPagination, Spacer } from '@/components/atoms';
import { PlansTable, ApiDocsContent, PlanDrawer, QueryBuilder } from '@/components/molecules';
import { Plan } from '@/models/Plan';
import usePagination from '@/hooks/usePagination';
import { EmptyPage } from '@/components/organisms';
import GUIDES from '@/constants/guides';
import { useState, useEffect, useMemo } from 'react';
import { PlanApi } from '@/api/PlanApi';
import { useQueryWithEmptyState } from '@/hooks/useQueryWithEmptyState';
import useFilterSorting from '@/hooks/useFilterSorting';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
} from '@/types/common/QueryBuilder';
import toast from 'react-hot-toast';
import { ENTITY_STATUS } from '@/models/base';

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
		field: 'lookup_key',
		label: 'Lookup Key',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
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
	{
		field: 'created_at',
		label: 'Created At',
		fieldType: FilterFieldType.DATEPICKER,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
		dataType: DataType.DATE,
	},
];

const PlansPage = () => {
	const { limit, offset, page, reset } = usePagination();
	const [activePlan, setActivePlan] = useState<Plan | null>(null);
	const [planDrawerOpen, setPlanDrawerOpen] = useState(false);

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
				field: 'lookup_key',
				operator: FilterOperator.CONTAINS,
				valueString: '',
				dataType: DataType.STRING,
				id: 'initial-lookup_key',
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
		debounceTime: 300,
	});

	useEffect(() => {
		reset();
	}, [sanitizedFilters, sanitizedSorts]);

	const fetchPlans = async () => {
		return await PlanApi.getPlansByFilter({
			limit,
			offset,
			filters: sanitizedFilters,
			sort: sanitizedSorts,
		});
	};

	const {
		data: plansData,
		isLoading,
		probeData,
		isError,
		error,
	} = useQueryWithEmptyState({
		main: {
			queryKey: ['fetchPlans', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: fetchPlans,
		},
		probe: {
			queryKey: ['fetchPlans', 'probe', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: async () => {
				return await PlanApi.getPlansByFilter({
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

	const showEmptyPage = useMemo(() => {
		return !isLoading && probeData?.items.length === 0 && plansData?.items.length === 0;
	}, [isLoading, probeData, plansData]);

	const handleOnAdd = () => {
		setActivePlan(null);
		setPlanDrawerOpen(true);
	};

	if (isError) {
		const err = error as any;
		toast.error(err?.error?.message || 'Error fetching plans');
		return null;
	}

	if (showEmptyPage) {
		return (
			<div className='space-y-6'>
				<PlanDrawer data={activePlan} open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlans']} />
				<EmptyPage
					onAddClick={handleOnAdd}
					emptyStateCard={{
						heading: 'Set Up Your First Plan',
						description: 'Create a plan to display pricing and start billing customers.',
						buttonLabel: 'Create Plan',
						buttonAction: handleOnAdd,
					}}
					tutorials={GUIDES.plans.tutorials}
					heading='Pricing Plans'
					tags={['Plans']}
				/>
			</div>
		);
	}
	return (
		<Page heading='Plans' headingCTA={<AddButton label='Add Plan' onClick={handleOnAdd} />}>
			<PlanDrawer data={activePlan} open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlans']} />
			<ApiDocsContent tags={['Plans']} />
			<div className='space-y-6'>
				<QueryBuilder
					filterOptions={filterOptions}
					filters={filters}
					onFilterChange={setFilters}
					sortOptions={sortingOptions}
					onSortChange={setSorts}
					selectedSorts={sorts}
				/>

				{isLoading ? (
					<div className='flex justify-center items-center min-h-[200px]'>
						<Loader />
					</div>
				) : (
					<>
						<PlansTable
							data={(plansData?.items || []) as Plan[]}
							onEdit={(plan) => {
								setActivePlan(plan);
								setPlanDrawerOpen(true);
							}}
						/>
						<Spacer className='!h-4' />
						<ShortPagination unit='Pricing Plans' totalItems={plansData?.pagination.total ?? 0} />
					</>
				)}
			</div>
		</Page>
	);
};

export default PlansPage;
