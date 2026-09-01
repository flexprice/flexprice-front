import { AddButton, Page, ActionButton, Chip, Tooltip } from '@/components/atoms';
import { ApiDocsContent, AddonDrawer } from '@/components/molecules';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import { ColumnData } from '@/components/molecules/Table';
import { QueryableDataArea } from '@/components/organisms';
import Addon from '@/models/Addon';
import { buildGuides } from '@/constants/guides';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { useState, useMemo, useCallback } from 'react';
import AddonApi from '@/api/AddonApi';
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

const AddonsPage = () => {
	const { t } = useTranslation('catalog');
	const { t: tGuide } = useTranslation('guides');
	const guides = useMemo(() => buildGuides(tGuide), [tGuide]);
	const [activeAddon, setActiveAddon] = useState<Addon | null>(null);
	const [addonDrawerOpen, setAddonDrawerOpen] = useState(false);
	const navigate = useNavigate();
	const { can, isLoading: permissionsLoading } = useCurrentUserPermissions();
	const canWriteAddon = can('addon', 'write');
	// Controls stay disabled during the loading window rather than gated behind a page-level
	// Loader — but disabled, not optimistically enabled: treating "still loading" as "granted"
	// let unauthorized users click through and only get rejected server-side. The denial
	// tooltip itself only shows once loading has actually finished and settled to false, so
	// authorized users don't see a false "denied" flash while roles are still being fetched.
	const writeControlsDisabled = permissionsLoading || !canWriteAddon;
	const writeDeniedReason = !permissionsLoading && !canWriteAddon ? t('addons.writeDeniedTooltip') : undefined;

	const handleOnAdd = useCallback(() => {
		setActiveAddon(null);
		setAddonDrawerOpen(true);
	}, []);

	const handleEdit = useCallback((addon: Addon) => {
		setActiveAddon(addon);
		setAddonDrawerOpen(true);
	}, []);

	const sortingOptions: SortOption[] = useMemo(
		() => [
			{
				field: 'name',
				label: t('addons.listPage.sortLabels.name'),
				direction: SortDirection.ASC,
			},
			{
				field: 'created_at',
				label: t('addons.listPage.sortLabels.createdAt'),
				direction: SortDirection.DESC,
			},
			{
				field: 'updated_at',
				label: t('addons.listPage.sortLabels.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const filterOptions: FilterField[] = useMemo(
		() => [
			{
				field: 'name',
				label: t('addons.listPage.filterLabels.name'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'lookup_key',
				label: t('addons.listPage.filterLabels.lookupKey'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'created_at',
				label: t('addons.listPage.filterLabels.createdAt'),
				fieldType: FilterFieldType.DATEPICKER,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
				dataType: DataType.DATE,
			},
			{
				field: 'status',
				label: t('addons.listPage.filterLabels.status'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: ENTITY_STATUS.PUBLISHED, label: t('addons.listPage.filterStatus.active') },
					{ value: ENTITY_STATUS.ARCHIVED, label: t('addons.listPage.filterStatus.inactive') },
				],
			},
		],
		[t],
	);

	const initialSorts: SortOption[] = useMemo(
		() => [
			{
				field: 'updated_at',
				label: t('addons.listPage.sortLabels.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const columns: ColumnData<Addon>[] = useMemo(
		() => [
			{
				fieldName: 'name',
				title: t('addons.listPage.columns.addonName'),
			},
			{
				fieldName: 'lookup_key',
				title: t('addons.listPage.columns.lookupKey'),
			},
			{
				title: t('addons.listPage.columns.status'),
				render: (row) => {
					const isActive = row?.status === ENTITY_STATUS.PUBLISHED;
					const label = isActive ? t('addons.listPage.filterStatus.active') : t('addons.listPage.filterStatus.inactive');
					return <Chip variant={isActive ? 'success' : 'default'} label={label} />;
				},
			},
			{
				title: t('addons.listPage.columns.updatedAt'),
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
							copyId={{ entityType: 'Addon' }}
							deleteMutationFn={async () => {
								return await AddonApi.Delete(row?.id);
							}}
							refetchQueryKey='fetchAddons'
							entityName={row?.name}
							edit={{
								enabled: false,
								onClick: () => handleEdit(row),
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
		[t, handleEdit, writeControlsDisabled, writeDeniedReason],
	);

	return (
		<Page
			heading={t('addons.listPage.title')}
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
			<AddonDrawer data={activeAddon} open={addonDrawerOpen} onOpenChange={setAddonDrawerOpen} refetchQueryKeys={['fetchAddons']} />
			<ApiDocsContent tags={API_DOCS_TAGS.Addons} />
			<div className='space-y-6'>
				<QueryableDataArea<Addon>
					queryConfig={{
						filterOptions,
						sortOptions: sortingOptions,
						initialFilters,
						initialSorts,
						debounceTime: 500,
					}}
					dataConfig={{
						queryKey: 'fetchAddons',
						fetchFn: async (params) => AddonApi.ListByFilter(params),
						probeFetchFn: async (params) =>
							AddonApi.ListByFilter({
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
							navigate(RouteNames.addonDetails + `/${row?.id}`);
						},
						showEmptyRow: true,
					}}
					paginationConfig={{
						unit: t('addons.listPage.paginationUnit'),
					}}
					emptyStateConfig={{
						heading: t('addons.listPage.emptyState.heading'),
						description: t('addons.listPage.emptyState.description'),
						buttonLabel: t('addons.listPage.emptyState.createButton'),
						buttonAction: handleOnAdd,
						buttonDisabled: writeControlsDisabled,
						buttonDisabledReason: writeDeniedReason,
						tags: API_DOCS_TAGS.Addons,
						tutorials: guides.addons.tutorials,
					}}
				/>
			</div>
		</Page>
	);
};
export default AddonsPage;
