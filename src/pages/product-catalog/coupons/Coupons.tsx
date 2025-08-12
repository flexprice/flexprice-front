import { AddButton, Page, ShortPagination, Spacer } from '@/components/atoms';
import { ApiDocsContent, CouponTable, CouponDrawer } from '@/components/molecules';
import EmptyPage from '@/components/organisms/EmptyPage/EmptyPage';
import GUIDES from '@/constants/guides';
import usePagination from '@/hooks/usePagination';
import CouponApi from '@/api/CouponApi';
import toast from 'react-hot-toast';
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
import { QueryBuilder } from '@/components/molecules';
import { COUPON_TYPE } from '@/types/common/Coupon';
import useFilterSorting from '@/hooks/useFilterSorting';
import { useQueryWithEmptyState } from '@/hooks/useQueryWithEmptyState';
import { Coupon } from '@/models/Coupon';
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
			{ value: COUPON_TYPE.FIXED, label: 'Fixed Amount' },
			{ value: COUPON_TYPE.PERCENTAGE, label: 'Percentage' },
		],
	},
];

const CouponsPage = () => {
	const { limit, offset, page, reset } = usePagination();
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

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

	const fetchCoupons = async () => {
		return await CouponApi.getCouponsByFilters({
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
		isLoading,
		isError,
		data: couponData,
		probeData,
	} = useQueryWithEmptyState({
		main: {
			queryKey: ['fetchCoupons', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: fetchCoupons,
		},
		probe: {
			queryKey: ['fetchCoupons', 'probe', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: async () => {
				return await CouponApi.getCouponsByFilters({
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

	// show empty page when no coupons and no search query
	const showEmptyPage = useMemo(() => {
		return !isLoading && probeData?.items.length === 0 && couponData?.items.length === 0;
	}, [isLoading, probeData, couponData]);

	const handleCreateCoupon = () => {
		setSelectedCoupon(null);
		setIsDrawerOpen(true);
	};

	// Handle error state
	if (isError) {
		toast.error('Error fetching coupons');
		return null;
	}

	// Render empty state when no coupons and no search query
	if (showEmptyPage) {
		return (
			<EmptyPage
				heading='Coupon'
				tags={['Coupons']}
				tutorials={GUIDES.features.tutorials}
				emptyStateCard={{
					heading: 'Add your first coupon',
					description: 'Create your first coupon to offer discounts to customers.',
					buttonLabel: 'Create Coupon',
					buttonAction: handleCreateCoupon,
				}}
				onAddClick={handleCreateCoupon}>
				<CouponDrawer data={selectedCoupon} open={isDrawerOpen} onOpenChange={setIsDrawerOpen} refetchQueryKeys={['fetchCoupons']} />
			</EmptyPage>
		);
	}

	return (
		<>
			<Page
				heading='Coupons'
				headingCTA={
					<div className='flex justify-between items-center gap-2'>
						<AddButton label='Add Coupon' onClick={handleCreateCoupon} />
					</div>
				}>
				<ApiDocsContent tags={['Coupons']} />
				<div>
					<QueryBuilder
						filterOptions={filterOptions}
						filters={filters}
						onFilterChange={setFilters}
						sortOptions={sortingOptions}
						onSortChange={setSorts}
						selectedSorts={sorts}
					/>
					<CouponTable data={couponData?.items || []} />
					<Spacer className='!h-4' />
					<ShortPagination unit='Coupons' totalItems={couponData?.pagination.total ?? 0} />
				</div>
			</Page>
			<CouponDrawer data={selectedCoupon} open={isDrawerOpen} onOpenChange={setIsDrawerOpen} refetchQueryKeys={['fetchCoupons']} />
		</>
	);
};

export default CouponsPage;
