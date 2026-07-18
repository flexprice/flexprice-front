import { AddButton, Page, ActionButton, Chip } from '@/components/atoms';
import { ApiDocsContent, CouponDrawer } from '@/components/molecules';
import { ColumnData } from '@/components/molecules/Table';
import { QueryableDataArea } from '@/components/organisms';
import { buildGuides } from '@/constants/guides';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import CouponApi from '@/api/CouponApi';
import { useState, useMemo } from 'react';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
	FilterCondition,
} from '@/types/common/QueryBuilder';
import { ENTITY_STATUS } from '@/models';
import { COUPON_TYPE } from '@/types/common/Coupon';
import { Coupon } from '@/models/Coupon';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import formatDate from '@/utils/common/format_date';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { useTranslation } from 'react-i18next';

const initialFilters: FilterCondition[] = [
	{
		field: 'name',
		operator: FilterOperator.CONTAINS,
		valueString: '',
		dataType: DataType.STRING,
		id: 'initial-name',
	},
	{
		field: 'status',
		operator: FilterOperator.IN,
		valueArray: [ENTITY_STATUS.PUBLISHED],
		dataType: DataType.ARRAY,
		id: 'initial-status',
	},
];

const CouponsPage = () => {
	const { t } = useTranslation('catalog');
	const { t: tGuide } = useTranslation('guides');
	const guides = useMemo(() => buildGuides(tGuide), [tGuide]);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
	const navigate = useNavigate();

	const sortingOptions: SortOption[] = useMemo(
		() => [
			{
				field: 'name',
				label: t('coupons.listPage.sortLabels.name'),
				direction: SortDirection.ASC,
			},
			{
				field: 'created_at',
				label: t('coupons.listPage.sortLabels.createdAt'),
				direction: SortDirection.DESC,
			},
			{
				field: 'updated_at',
				label: t('coupons.listPage.sortLabels.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const filterOptions: FilterField[] = useMemo(
		() => [
			{
				field: 'name',
				label: t('coupons.listPage.filterLabels.name'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'created_at',
				label: t('coupons.listPage.filterLabels.createdAt'),
				fieldType: FilterFieldType.DATEPICKER,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
				dataType: DataType.DATE,
			},
			{
				field: 'status',
				label: t('coupons.listPage.filterLabels.status'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: ENTITY_STATUS.PUBLISHED, label: t('coupons.listPage.filterStatus.active') },
					{ value: ENTITY_STATUS.ARCHIVED, label: t('coupons.listPage.filterStatus.inactive') },
				],
			},
			{
				field: 'type',
				label: t('coupons.listPage.filterLabels.type'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.ARRAY],
				dataType: DataType.ARRAY,
				options: [
					{ value: COUPON_TYPE.FIXED, label: t('coupons.drawer.fixedAmount') },
					{ value: COUPON_TYPE.PERCENTAGE, label: t('coupons.drawer.percentage') },
				],
			},
		],
		[t],
	);

	const initialSorts: SortOption[] = useMemo(
		() => [
			{
				field: 'updated_at',
				label: t('coupons.listPage.sortLabels.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const handleCreateCoupon = () => {
		setSelectedCoupon(null);
		setIsDrawerOpen(true);
	};

	const handleEdit = (coupon: Coupon) => {
		setSelectedCoupon(coupon);
		setIsDrawerOpen(true);
	};

	const columns: ColumnData<Coupon>[] = useMemo(
		() => [
			{
				fieldName: 'name',
				title: t('coupons.table.name'),
			},
			{
				title: t('coupons.table.type'),
				render: (row) => {
					const label = row.type === COUPON_TYPE.FIXED ? t('coupons.drawer.fixedAmount') : t('coupons.drawer.percentage');
					return <Chip variant='default' label={label} />;
				},
			},
			{
				title: t('coupons.table.discount'),
				render: (row) => {
					if (row.type === COUPON_TYPE.FIXED) {
						return row.amount_off ? `${getCurrencySymbol(row.currency)} ${row.amount_off}` : '-';
					} else {
						return row.percentage_off ? `${row.percentage_off}%` : '-';
					}
				},
			},
			{
				title: t('coupons.table.redemptions'),
				render: (row) => {
					const max = row.max_redemptions || '∞';
					const current = row.total_redemptions;
					return `${current}/${max}`;
				},
			},
			{
				title: t('coupons.table.status'),
				render: (row) => {
					const isActive = row.status === ENTITY_STATUS.PUBLISHED;
					const label = isActive ? t('coupons.table.statusActive') : t('coupons.table.statusInactive');
					return <Chip variant={isActive ? 'success' : 'default'} label={label} />;
				},
			},
			{
				title: t('coupons.table.updatedAt'),
				render: (row) => {
					return formatDate(row.updated_at);
				},
			},
			{
				fieldVariant: 'interactive',
				render: (row) => (
					<ActionButton
						id={row.id}
						copyId={{ entityType: 'Coupon' }}
						deleteMutationFn={(id) => CouponApi.deleteCoupon(id)}
						refetchQueryKey='fetchCoupons'
						entityName={t('coupons.table.entityName')}
						edit={{
							path: `${RouteNames.couponDetails}/${row.id}`,
							onClick: () => handleEdit(row),
						}}
						archive={{
							enabled: row.status === ENTITY_STATUS.PUBLISHED,
						}}
					/>
				),
			},
		],
		[t],
	);

	return (
		<>
			<Page
				heading={t('coupons.listPage.title')}
				headingCTA={
					<div className='flex justify-between items-center gap-2'>
						<AddButton onClick={handleCreateCoupon} />
					</div>
				}>
				<ApiDocsContent tags={API_DOCS_TAGS.Coupons} />
				<QueryableDataArea<Coupon>
					queryConfig={{
						filterOptions,
						sortOptions: sortingOptions,
						initialFilters,
						initialSorts,
						debounceTime: 500,
					}}
					dataConfig={{
						queryKey: 'fetchCoupons',
						fetchFn: async (params) => CouponApi.getCouponsByFilters(params),
						probeFetchFn: async (params) =>
							CouponApi.getCouponsByFilters({
								...params,
								limit: 1,
								offset: 0,
								filters: [],
								sort: [],
							}),
					}}
					tableConfig={{
						columns,
						onRowClick: (row) => {
							navigate(`${RouteNames.couponDetails}/${row.id}`);
						},
						showEmptyRow: true,
					}}
					paginationConfig={{
						unit: t('coupons.listPage.paginationUnit'),
					}}
					emptyStateConfig={{
						heading: t('coupons.listPage.emptyState.heading'),
						description: t('coupons.listPage.emptyState.description'),
						buttonLabel: t('coupons.listPage.emptyState.createButton'),
						buttonAction: handleCreateCoupon,
						tags: API_DOCS_TAGS.Coupons,
						tutorials: guides.coupons.tutorials,
					}}
				/>
			</Page>
			<CouponDrawer data={selectedCoupon} open={isDrawerOpen} onOpenChange={setIsDrawerOpen} refetchQueryKeys={['fetchCoupons']} />
		</>
	);
};

export default CouponsPage;
