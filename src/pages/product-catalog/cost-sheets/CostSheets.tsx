import { AddButton, Page, ActionButton, Chip, Tooltip } from '@/components/atoms';
import { ApiDocsContent, CostSheetDrawer } from '@/components/molecules';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import { ColumnData } from '@/components/molecules/Table';
import { QueryableDataArea } from '@/components/organisms';
import CostSheet from '@/models/CostSheet';
import { buildGuides } from '@/constants/guides';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { useState, useMemo } from 'react';
import CostSheetApi from '@/api/CostSheetApi';
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
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
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
		field: 'status',
		operator: FilterOperator.IN,
		valueArray: [ENTITY_STATUS.PUBLISHED],
		dataType: DataType.ARRAY,
		id: 'initial-status',
	},
];

const CostSheetsPage = () => {
	const { t } = useTranslation('catalog');
	const { t: tGuide } = useTranslation('guides');
	const guides = useMemo(() => buildGuides(tGuide), [tGuide]);
	const [activeCostSheet, setActiveCostSheet] = useState<CostSheet | null>(null);
	const [costSheetDrawerOpen, setCostSheetDrawerOpen] = useState(false);
	const navigate = useNavigate();
	const { can, isLoading: permissionsLoading } = useCurrentUserPermissions();
	const canWriteCostSheet = can('costsheet', 'write');
	// Controls stay disabled during the loading window rather than gated behind a page-level
	// Loader — but disabled, not optimistically enabled: treating "still loading" as "granted"
	// let unauthorized users click through and only get rejected server-side. The denial
	// tooltip itself only shows once loading has actually finished and settled to false, so
	// authorized users don't see a false "denied" flash while roles are still being fetched.
	const writeControlsDisabled = permissionsLoading || !canWriteCostSheet;
	const writeDeniedReason = !permissionsLoading && !canWriteCostSheet ? t('costSheets.writeDeniedTooltip') : undefined;

	const sortingOptions: SortOption[] = useMemo(
		() => [
			{
				field: 'name',
				label: t('costSheets.listPage.sortLabels.name'),
				direction: SortDirection.ASC,
			},
			{
				field: 'created_at',
				label: t('costSheets.listPage.sortLabels.createdAt'),
				direction: SortDirection.DESC,
			},
			{
				field: 'updated_at',
				label: t('costSheets.listPage.sortLabels.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const filterOptions: FilterField[] = useMemo(
		() => [
			{
				field: 'name',
				label: t('costSheets.listPage.filterLabels.name'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'lookup_key',
				label: t('costSheets.listPage.filterLabels.lookupKey'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'created_at',
				label: t('costSheets.listPage.filterLabels.createdAt'),
				fieldType: FilterFieldType.DATEPICKER,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
				dataType: DataType.DATE,
			},
			{
				field: 'status',
				label: t('costSheets.listPage.filterLabels.status'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: ENTITY_STATUS.PUBLISHED, label: t('costSheets.listPage.filterStatus.active') },
					{ value: ENTITY_STATUS.ARCHIVED, label: t('costSheets.listPage.filterStatus.inactive') },
				],
			},
		],
		[t],
	);

	const initialSorts: SortOption[] = useMemo(
		() => [
			{
				field: 'updated_at',
				label: t('costSheets.listPage.sortLabels.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const handleOnAdd = () => {
		setActiveCostSheet(null);
		setCostSheetDrawerOpen(true);
	};

	const handleEdit = (costSheet: CostSheet) => {
		setActiveCostSheet(costSheet);
		setCostSheetDrawerOpen(true);
	};

	const columns: ColumnData<CostSheet>[] = useMemo(
		() => [
			{
				fieldName: 'name',
				title: t('costSheets.table.costSheetName'),
			},
			{
				fieldName: 'lookup_key',
				title: t('costSheets.table.lookupKey'),
			},
			{
				title: t('costSheets.table.status'),
				render: (row) => {
					const isActive = row?.status === ENTITY_STATUS.PUBLISHED;
					const label = isActive ? t('costSheets.listPage.filterStatus.active') : t('costSheets.listPage.filterStatus.inactive');
					return <Chip variant={isActive ? 'success' : 'default'} label={label} />;
				},
			},
			{
				title: t('costSheets.table.updatedAt'),
				render: (row) => {
					return formatDate(row?.updated_at);
				},
			},
			{
				fieldVariant: 'interactive',
				render(row) {
					return (
						<ActionButton
							id={row?.id}
							copyId={{ entityType: 'Cost Sheet' }}
							deleteMutationFn={async () => {
								return await CostSheetApi.DeleteCostSheet(row?.id);
							}}
							refetchQueryKey='fetchCostSheets'
							entityName={row?.name}
							edit={{
								enabled: true,
								onClick: () => handleEdit(row),
								disabled: writeControlsDisabled,
								disabledReason: writeDeniedReason,
							}}
							archive={{
								enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
								disabled: writeControlsDisabled,
								disabledReason: writeDeniedReason,
							}}
						/>
					);
				},
			},
		],
		[t, writeControlsDisabled, writeDeniedReason],
	);

	return (
		<Page
			heading={t('costSheets.listPage.title')}
			headingCTA={
				writeDeniedReason ? (
					<Tooltip content={writeDeniedReason}>
						<span tabIndex={0} className='inline-block'>
							<AddButton disabled onClick={handleOnAdd} />
						</span>
					</Tooltip>
				) : (
					<AddButton disabled={writeControlsDisabled} onClick={handleOnAdd} />
				)
			}>
			<CostSheetDrawer
				data={activeCostSheet}
				open={costSheetDrawerOpen}
				onOpenChange={setCostSheetDrawerOpen}
				refetchQueryKeys={['fetchCostSheets']}
			/>
			<ApiDocsContent tags={API_DOCS_TAGS.Costs} />
			<div className='space-y-6'>
				<QueryableDataArea<CostSheet>
					queryConfig={{
						filterOptions,
						sortOptions: sortingOptions,
						initialFilters,
						initialSorts,
						debounceTime: 500,
					}}
					dataConfig={{
						queryKey: 'fetchCostSheets',
						fetchFn: async (params) => CostSheetApi.GetCostSheetsByFilter(params),
						probeFetchFn: async (params) =>
							CostSheetApi.GetCostSheetsByFilter({
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
							navigate(RouteNames.costSheetDetails + `/${row?.id}`);
						},
						showEmptyRow: true,
					}}
					paginationConfig={{
						unit: t('costSheets.listPage.paginationUnit'),
					}}
					emptyStateConfig={{
						heading: t('costSheets.listPage.emptyState.heading'),
						description: t('costSheets.listPage.emptyState.description'),
						buttonLabel: t('costSheets.listPage.emptyState.createButton'),
						buttonAction: handleOnAdd,
						buttonDisabled: writeControlsDisabled,
						buttonDisabledReason: writeDeniedReason,
						tags: API_DOCS_TAGS.Costs,
						tutorials: guides.features.tutorials,
					}}
				/>
			</div>
		</Page>
	);
};
export default CostSheetsPage;
