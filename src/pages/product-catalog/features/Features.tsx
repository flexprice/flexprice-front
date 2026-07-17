import { AddButton, Page, ActionButton, Chip } from '@/components/atoms';
import { ApiDocsContent, FeatureDrawer, RedirectCell } from '@/components/molecules';
import { ColumnData } from '@/components/molecules/Table';
import { QueryableDataArea } from '@/components/organisms';
import { RouteNames } from '@/core/routes/Routes';
import { buildGuides } from '@/constants/guides';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import FeatureApi from '@/api/FeatureApi';
import { Link, useNavigate } from 'react-router';
import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Feature, { FEATURE_TYPE } from '@/models/Feature';
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
import { toSentenceCase } from '@/utils/common/helper_functions';
import formatDate from '@/utils/common/format_date';
import { getFeatureIcon } from '@/components/atoms/SelectFeature/SelectFeature';
import { searchGroupsForFilter } from '@/utils/filterSearchHelpers';

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

const FeaturesPage = () => {
	const { t } = useTranslation('catalog');
	const { t: tGuide } = useTranslation('guides');
	const guides = useMemo(() => buildGuides(tGuide), [tGuide]);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
	const navigate = useNavigate();

	const handleEdit = useCallback((feature: Feature) => {
		setSelectedFeature(feature);
		setIsDrawerOpen(true);
	}, []);

	const sortingOptions: SortOption[] = useMemo(
		() => [
			{
				field: 'name',
				label: t('features.listPage.sortLabels.name'),
				direction: SortDirection.ASC,
			},
			{
				field: 'created_at',
				label: t('features.listPage.sortLabels.createdAt'),
				direction: SortDirection.DESC,
			},
			{
				field: 'updated_at',
				label: t('features.listPage.sortLabels.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const filterOptions: FilterField[] = useMemo(
		() => [
			{
				field: 'name',
				label: t('features.listPage.filterLabels.name'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'created_at',
				label: t('features.listPage.filterLabels.createdAt'),
				fieldType: FilterFieldType.DATEPICKER,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
				dataType: DataType.DATE,
			},
			{
				field: 'status',
				label: t('features.listPage.filterLabels.status'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: ENTITY_STATUS.PUBLISHED, label: t('features.listPage.filterStatus.active') },
					{ value: ENTITY_STATUS.ARCHIVED, label: t('features.listPage.filterStatus.inactive') },
				],
			},
			{
				field: 'type',
				label: t('features.listPage.filterLabels.type'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.ARRAY],
				dataType: DataType.ARRAY,
				options: [
					{ value: FEATURE_TYPE.METERED, label: t('features.listPage.filterTypes.metered') },
					{ value: FEATURE_TYPE.BOOLEAN, label: t('features.listPage.filterTypes.boolean') },
					{ value: FEATURE_TYPE.STATIC, label: t('features.listPage.filterTypes.static') },
					{ value: FEATURE_TYPE.CONFIG, label: t('features.listPage.filterTypes.config') },
				],
			},
			{
				field: 'group_id',
				label: t('features.listPage.filterLabels.group'),
				fieldType: FilterFieldType.ASYNC_MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				asyncConfig: {
					searchFn: searchGroupsForFilter,
				},
			},
		],
		[t],
	);

	const initialSorts: SortOption[] = useMemo(
		() => [
			{
				field: 'updated_at',
				label: t('features.listPage.sortLabels.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const getFeatureTypeChipLabel = useCallback(
		(type: string) => {
			const key = type.toLowerCase();
			if (key === FEATURE_TYPE.STATIC) return t('features.listPage.typeChips.static');
			if (key === FEATURE_TYPE.METERED) return t('features.listPage.typeChips.metered');
			if (key === FEATURE_TYPE.BOOLEAN) return t('features.listPage.typeChips.boolean');
			if (key === FEATURE_TYPE.CONFIG) return t('features.listPage.typeChips.config', { defaultValue: 'Config' });
			return t('features.listPage.typeChips.unknown', { defaultValue: toSentenceCase(type) });
		},
		[t],
	);

	const getFeatureTypeChips = useCallback(
		(type: string, addIcon: boolean = false) => {
			const icon = getFeatureIcon(type);
			const label = getFeatureTypeChipLabel(type);
			switch (type.toLocaleLowerCase()) {
				case FEATURE_TYPE.STATIC: {
					return <Chip textColor='#4B5563' bgColor='#F3F4F6' icon={addIcon ? icon : null} label={label} className='text-xs' />;
				}
				case FEATURE_TYPE.METERED:
					return <Chip textColor='#1E40AF' bgColor='#DBEAFE' icon={addIcon ? icon : null} label={label} className='text-xs' />;
				case FEATURE_TYPE.BOOLEAN:
					return <Chip textColor='#166534' bgColor='#DCFCE7' icon={addIcon ? icon : null} label={label} className='text-xs' />;
				case FEATURE_TYPE.CONFIG:
					return <Chip textColor='#5B21B6' bgColor='#F5F3FF' icon={addIcon ? icon : null} label={label} className='text-xs' />;
				default:
					return <Chip textColor='#6B7280' bgColor='#F9FAFB' icon={addIcon ? icon : null} label={label} className='text-xs' />;
			}
		},
		[getFeatureTypeChipLabel],
	);

	const columns: ColumnData<Feature>[] = useMemo(
		() => [
			{
				fieldName: 'name',
				title: t('features.listPage.columns.featureName'),
			},
			{
				title: t('features.listPage.columns.group'),
				render: (row) =>
					row?.group?.id ? (
						<RedirectCell redirectUrl={`${RouteNames.groups}/${row.group.id}`}>{row.group.name}</RedirectCell>
					) : (
						t('features.listPage.emptyCell')
					),
			},
			{
				title: t('features.listPage.columns.type'),
				render(row) {
					return getFeatureTypeChips(row?.type || '', true);
				},
			},
			{
				title: t('features.listPage.columns.status'),
				render: (row) => {
					const isActive = row?.status === ENTITY_STATUS.PUBLISHED;
					const label = isActive ? t('features.listPage.filterStatus.active') : t('features.listPage.filterStatus.inactive');
					return <Chip variant={isActive ? 'success' : 'default'} label={label} />;
				},
			},
			{
				title: t('features.listPage.columns.updatedAt'),
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
							copyId={{ entityType: 'Feature' }}
							deleteMutationFn={async () => {
								return await FeatureApi.deleteFeature(row?.id);
							}}
							refetchQueryKey='fetchFeatures'
							entityName={row?.name}
							archive={{
								enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
							}}
							edit={{
								enabled: true,
								onClick: () => handleEdit(row),
							}}
						/>
					);
				},
			},
		],
		[t, getFeatureTypeChips, handleEdit],
	);

	return (
		<Page
			heading={t('features.listPage.title')}
			headingCTA={
				<div className='flex justify-between items-center gap-2'>
					<Link to={RouteNames.createFeature}>
						<AddButton />
					</Link>
				</div>
			}>
			<ApiDocsContent tags={API_DOCS_TAGS.Features} />
			<QueryableDataArea<Feature>
				queryConfig={{
					filterOptions,
					sortOptions: sortingOptions,
					initialFilters,
					initialSorts,
					debounceTime: 500,
				}}
				dataConfig={{
					queryKey: 'fetchFeatures',
					fetchFn: async (params) => FeatureApi.getFeaturesByFilter(params),
					probeFetchFn: async (params) =>
						FeatureApi.getFeaturesByFilter({
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
						navigate(RouteNames.featureDetails + `/${row?.id}`);
					},
					showEmptyRow: true,
				}}
				paginationConfig={{
					unit: t('features.listPage.paginationUnit'),
				}}
				emptyStateConfig={{
					heading: t('features.listPage.emptyState.heading'),
					description: t('features.listPage.emptyState.description'),
					buttonLabel: t('features.listPage.emptyState.createButton'),
					buttonAction: () => navigate(RouteNames.createFeature),
					tags: API_DOCS_TAGS.Features,
					tutorials: guides.features.tutorials,
				}}
			/>
			{selectedFeature && (
				<FeatureDrawer data={selectedFeature} open={isDrawerOpen} onOpenChange={setIsDrawerOpen} refetchQueryKeys={['fetchFeatures']} />
			)}
		</Page>
	);
};
export default FeaturesPage;
