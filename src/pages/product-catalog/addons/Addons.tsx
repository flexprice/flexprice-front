import { AddButton, Loader, Page, ShortPagination, Spacer } from '@/components/atoms';
import { AddonTable, ApiDocsContent, AddonDrawer, QueryBuilder } from '@/components/molecules';
import { EmptyPage } from '@/components/organisms';
import Addon from '@/models/Addon';
import usePagination from '@/hooks/usePagination';
import GUIDES from '@/constants/guides';
import { useState, useEffect, useMemo } from 'react';
import AddonApi from '@/api/AddonApi';
import toast from 'react-hot-toast';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
} from '@/types/common/QueryBuilder';
import { ADDON_TYPE } from '@/models/Addon';
import useFilterSorting from '@/hooks/useFilterSorting';
import { useQueryWithEmptyState } from '@/hooks/useQueryWithEmptyState';
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
	{
		field: 'type',
		label: 'Type',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.ARRAY],
		dataType: DataType.ARRAY,
		options: [
			{ value: ADDON_TYPE.ONETIME, label: 'One Time' },
			{ value: ADDON_TYPE.MULTIPLE, label: 'Multiple' },
		],
	},
];

const AddonsPage = () => {
	const { limit, offset, page, reset } = usePagination();
	const [activeAddon, setActiveAddon] = useState<Addon | null>(null);
	const [addonDrawerOpen, setAddonDrawerOpen] = useState(false);

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

	const fetchAddons = async () => {
		return await AddonApi.GetAddonsByFilter({
			limit: limit,
			offset: offset,
			filters: sanitizedFilters,
			sort: sanitizedSorts,
		});
	};

	useEffect(() => {
		reset();
	}, [sanitizedFilters, sanitizedSorts]);

	const {
		data: addonsData,
		isLoading,
		probeData,
		isError,
		error,
	} = useQueryWithEmptyState({
		main: {
			queryKey: ['fetchAddons', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: fetchAddons,
		},
		probe: {
			queryKey: ['fetchAddons', 'probe', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: async () => {
				return await AddonApi.GetAddonsByFilter({
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
		return !isLoading && probeData?.items.length === 0 && addonsData?.items.length === 0;
	}, [isLoading, probeData, addonsData]);

	const handleOnAdd = () => {
		setActiveAddon(null);
		setAddonDrawerOpen(true);
	};

	if (isError) {
		const err = error as any;
		toast.error(err?.error?.message || 'Error fetching addons');
		return null;
	}

	if (showEmptyPage) {
		return (
			<div className='space-y-6'>
				<AddonDrawer data={activeAddon} open={addonDrawerOpen} onOpenChange={setAddonDrawerOpen} refetchQueryKeys={['fetchAddons']} />
				<EmptyPage
					onAddClick={handleOnAdd}
					emptyStateCard={{
						heading: 'Add your first addon',
						description: 'Create your first addon to define additional services customers can purchase.',
						buttonLabel: 'Create Addon',
						buttonAction: handleOnAdd,
					}}
					tutorials={GUIDES.features.tutorials}
					heading='Addons'
					tags={['Addons']}
				/>
			</div>
		);
	}

	return (
		<Page heading='Addons' headingCTA={<AddButton label='Add Addon' onClick={handleOnAdd} />}>
			<AddonDrawer data={activeAddon} open={addonDrawerOpen} onOpenChange={setAddonDrawerOpen} refetchQueryKeys={['fetchAddons']} />
			<ApiDocsContent tags={['Addons']} />
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
						<AddonTable
							data={(addonsData?.items || []) as Addon[]}
							onEdit={(addon: Addon) => {
								setActiveAddon(addon);
								setAddonDrawerOpen(true);
							}}
						/>
						<Spacer className='!h-4' />
						<ShortPagination unit='Addons' totalItems={addonsData?.pagination.total ?? 0} />
					</>
				)}
			</div>
		</Page>
	);
};
export default AddonsPage;
