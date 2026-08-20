import { AddButton, ActionButton, StatusChip, Page } from '@/components/atoms';
import { ApiDocsContent, PriceUnitDrawer } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { ColumnData } from '@/components/molecules/Table';
import { PriceUnit } from '@/models/PriceUnit';
import { QueryableDataArea } from '@/components/organisms';
import { useState, useMemo } from 'react';
import { PriceUnitApi } from '@/api/PriceUnitApi';
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
import formatDate from '@/utils/common/format_date';
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
		field: 'code',
		operator: FilterOperator.CONTAINS,
		valueString: '',
		dataType: DataType.STRING,
		id: 'initial-code',
	},
	{
		field: 'status',
		operator: FilterOperator.IN,
		valueArray: [ENTITY_STATUS.PUBLISHED],
		dataType: DataType.ARRAY,
		id: 'initial-status',
	},
];

const formatConversionRate = (rate: string): string => {
	if (!rate) return '-';
	const numRate = parseFloat(rate);
	if (isNaN(numRate)) return '-';
	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 8,
	}).format(numRate);
};

const PriceUnitsPage = () => {
	const { t } = useTranslation('catalog');
	const [activePriceUnit, setActivePriceUnit] = useState<PriceUnit | null>(null);
	const [priceUnitDrawerOpen, setPriceUnitDrawerOpen] = useState(false);

	const sortingOptions: SortOption[] = useMemo(
		() => [
			{
				field: 'name',
				label: t('priceUnits.listPage.sortLabels.name'),
				direction: SortDirection.ASC,
			},
			{
				field: 'code',
				label: t('priceUnits.listPage.sortLabels.code'),
				direction: SortDirection.ASC,
			},
			{
				field: 'created_at',
				label: t('priceUnits.listPage.sortLabels.createdAt'),
				direction: SortDirection.DESC,
			},
			{
				field: 'updated_at',
				label: t('priceUnits.listPage.sortLabels.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const filterOptions: FilterField[] = useMemo(
		() => [
			{
				field: 'name',
				label: t('priceUnits.listPage.filterLabels.name'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'code',
				label: t('priceUnits.listPage.filterLabels.code'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'base_currency',
				label: t('priceUnits.listPage.filterLabels.baseCurrency'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'status',
				label: t('priceUnits.listPage.filterLabels.status'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: ENTITY_STATUS.PUBLISHED, label: t('priceUnits.listPage.filterStatus.active') },
					{ value: ENTITY_STATUS.ARCHIVED, label: t('priceUnits.listPage.filterStatus.inactive') },
				],
			},
			{
				field: 'created_at',
				label: t('priceUnits.listPage.filterLabels.createdAt'),
				fieldType: FilterFieldType.DATEPICKER,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
				dataType: DataType.DATE,
			},
		],
		[t],
	);

	const initialSorts: SortOption[] = useMemo(
		() => [
			{
				field: 'updated_at',
				label: t('priceUnits.listPage.sortLabels.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const handleOnAdd = () => {
		setActivePriceUnit(null);
		setPriceUnitDrawerOpen(true);
	};

	const handleEdit = (priceUnit: PriceUnit) => {
		setActivePriceUnit(priceUnit);
		setPriceUnitDrawerOpen(true);
	};

	const columns: ColumnData<PriceUnit>[] = useMemo(
		() => [
			{
				fieldName: 'name',
				title: t('priceUnits.table.name'),
				fieldVariant: 'title',
			},
			{
				fieldName: 'code',
				title: t('priceUnits.table.code'),
			},
			{
				fieldName: 'symbol',
				title: t('priceUnits.table.symbol'),
			},
			{
				title: t('priceUnits.table.baseCurrency'),
				render: (row) => {
					return row?.base_currency?.toUpperCase() || '-';
				},
			},
			{
				title: t('priceUnits.table.conversionRate'),
				render: (row) => {
					return formatConversionRate(row?.conversion_rate || '');
				},
			},
			{
				title: t('priceUnits.table.status'),
				render: (row) => {
					const isActive = row?.status === ENTITY_STATUS.PUBLISHED;
					const label = isActive ? t('priceUnits.listPage.filterStatus.active') : t('priceUnits.listPage.filterStatus.inactive');
					return <StatusChip status={isActive ? 'Active' : 'Inactive'} label={label} />;
				},
			},
			{
				title: t('priceUnits.table.updatedAt'),
				render: (row) => {
					return formatDate(row?.updated_at);
				},
			},
			{
				fieldVariant: 'interactive',
				width: 56,
				render(row) {
					return (
						<ActionButton
							id={row?.id}
							copyId={{ entityType: 'Price Unit' }}
							deleteMutationFn={async () => {
								return await PriceUnitApi.DeletePriceUnit(row?.id);
							}}
							refetchQueryKey='fetchPriceUnits'
							entityName={row?.name}
							edit={{
								enabled: true,
								onClick: () => handleEdit(row),
							}}
							archive={{
								enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
							}}
						/>
					);
				},
			},
		],
		[t],
	);

	return (
		<Page className='max-w-none' heading={t('priceUnits.listPage.title')} headingCTA={<AddButton onClick={handleOnAdd} />}>
			<PriceUnitDrawer
				data={activePriceUnit}
				open={priceUnitDrawerOpen}
				onOpenChange={setPriceUnitDrawerOpen}
				refetchQueryKeys={['fetchPriceUnits']}
			/>
			<ApiDocsContent tags={API_DOCS_TAGS.PriceUnits} />
			<div className='space-y-6'>
				<QueryableDataArea<PriceUnit>
					queryConfig={{
						filterOptions,
						sortOptions: sortingOptions,
						initialFilters,
						initialSorts,
						debounceTime: 300,
					}}
					dataConfig={{
						queryKey: 'fetchPriceUnits',
						fetchFn: async (params) => PriceUnitApi.ListPriceUnitsByFilter(params),
						probeFetchFn: async (params) =>
							PriceUnitApi.ListPriceUnitsByFilter({
								...params,
								limit: 1,
								offset: 0,
								filters: [],
								sort: [],
							}),
					}}
					tableConfig={{
						columns,
						variant: 'card',
						tableClassName: 'table-fixed',
						showEmptyRow: true,
					}}
					paginationConfig={{
						unit: t('priceUnits.listPage.paginationUnit'),
					}}
					emptyStateConfig={{
						heading: t('priceUnits.listPage.emptyState.heading'),
						description: t('priceUnits.listPage.emptyState.description'),
						buttonLabel: t('priceUnits.listPage.emptyState.createButton'),
						buttonAction: handleOnAdd,
						tags: API_DOCS_TAGS.PriceUnits,
					}}
				/>
			</div>
		</Page>
	);
};

export default PriceUnitsPage;
