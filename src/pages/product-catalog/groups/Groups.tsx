import { AddButton, Page, ActionButton, Chip } from '@/components/atoms';
import { ApiDocsContent, GroupDrawer } from '@/components/molecules';
import { ColumnData } from '@/components/molecules/Table';
import { QueryableDataArea } from '@/components/organisms';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import { Group, GROUP_ENTITY_TYPE } from '@/models/Group';
import { ENTITY_STATUS } from '@/models';
import { buildGuides } from '@/constants/guides';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GroupApi } from '@/api/GroupApi';
import formatDate from '@/utils/common/format_date';
import {
	getGroupsFilterOptions,
	getGroupsSortOptions,
	groupsInitialFilters,
	getGroupsInitialSorts,
} from '@/pages/product-catalog/groups/groupsQueryConfig';

const GroupsPage = () => {
	const { t } = useTranslation(['catalog', 'common']);
	const { t: tGuide } = useTranslation('guides');
	const guides = useMemo(() => buildGuides(tGuide), [tGuide]);
	const navigate = useNavigate();
	const [groupDrawerOpen, setGroupDrawerOpen] = useState(false);

	const groupsQueryBuilderConfig = useMemo(
		() => ({
			filterOptions: getGroupsFilterOptions(t),
			sortOptions: getGroupsSortOptions(t),
			initialSorts: getGroupsInitialSorts(t),
		}),
		[t],
	);

	const handleOnAdd = () => {
		setGroupDrawerOpen(true);
	};

	const columns: ColumnData<Group>[] = useMemo(
		() => [
			{ fieldName: 'name', title: t('groups.table.name') },
			{
				title: t('groups.table.type'),
				render: (row) => {
					const et = row.entity_type;
					const label =
						et === GROUP_ENTITY_TYPE.PRICE
							? t('groups.drawer.entityPrice')
							: et === GROUP_ENTITY_TYPE.FEATURE
								? t('groups.drawer.entityFeature')
								: (et ?? '');
					return label;
				},
			},
			{
				title: t('groups.table.status'),
				render: (row) => {
					const isActive = row.status === ENTITY_STATUS.PUBLISHED;
					const label = isActive ? t('common:status.active') : t('common:status.inactive');
					return <Chip variant={isActive ? 'success' : 'default'} label={label} />;
				},
			},
			{
				title: t('groups.table.updatedAt'),
				render: (row) => formatDate(row.updated_at),
			},
			{
				fieldVariant: 'interactive',
				render: (row) => (
					<ActionButton
						id={row.id}
						copyId={{ entityType: 'Group' }}
						deleteMutationFn={(id) => GroupApi.deleteGroup(id)}
						refetchQueryKey='fetchGroups'
						entityName={t('groups.table.entityName')}
						edit={{ enabled: false }}
						archive={{ enabled: row.status === ENTITY_STATUS.PUBLISHED }}
					/>
				),
			},
		],
		[t],
	);

	return (
		<Page heading={t('groups.listPage.title')} headingCTA={<AddButton onClick={handleOnAdd} />}>
			<GroupDrawer data={null} open={groupDrawerOpen} onOpenChange={setGroupDrawerOpen} refetchQueryKeys={['fetchGroups']} />
			<ApiDocsContent tags={API_DOCS_TAGS.Groups} />
			<div className='space-y-6'>
				<QueryableDataArea<Group>
					queryConfig={{
						filterOptions: groupsQueryBuilderConfig.filterOptions,
						sortOptions: groupsQueryBuilderConfig.sortOptions,
						initialFilters: groupsInitialFilters,
						initialSorts: groupsQueryBuilderConfig.initialSorts,
						debounceTime: 300,
					}}
					dataConfig={{
						queryKey: 'fetchGroups',
						fetchFn: async (params) => {
							const response = await GroupApi.getGroupsByFilter({
								limit: params.limit,
								offset: params.offset,
								filters: params.filters ?? [],
								sort: params.sort ?? [],
							});
							return {
								items: response.items as Group[],
								pagination: response.pagination,
							};
						},
						probeFetchFn: async () => {
							const response = await GroupApi.getGroupsByFilter({
								limit: 1,
								offset: 0,
								filters: [],
								sort: [],
							});
							return {
								items: response.items as Group[],
								pagination: response.pagination,
							};
						},
					}}
					tableConfig={{
						columns,
						showEmptyRow: true,
						onRowClick: (row) => navigate(`${RouteNames.groups}/${row.id}`),
					}}
					paginationConfig={{ unit: t('groups.listPage.paginationUnit') }}
					emptyStateConfig={{
						heading: t('groups.listPage.emptyState.heading'),
						description: t('groups.listPage.emptyState.description'),
						buttonLabel: t('groups.listPage.emptyState.createButton'),
						buttonAction: handleOnAdd,
						tags: API_DOCS_TAGS.Groups,
						tutorials: guides.groups.tutorials,
					}}
				/>
			</div>
		</Page>
	);
};

export default GroupsPage;
