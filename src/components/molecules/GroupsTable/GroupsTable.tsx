import { FC } from 'react';
import { ActionButton, Chip } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '../Table';
import { Group } from '@/models/Group';
import { GROUP_ENTITY_TYPE } from '@/models/Group';
import { ENTITY_STATUS } from '@/models';
import formatDate from '@/utils/common/format_date';
import { GroupApi } from '@/api/GroupApi';
import { useTranslation } from 'react-i18next';

export interface GroupsTableProps {
	data: Group[];
	onEdit: (group: Group) => void;
}

const GroupsTable: FC<GroupsTableProps> = ({ data, onEdit }) => {
	const { t } = useTranslation(['catalog', 'common']);

	const mappedData = data?.map((group) => ({
		...group,
	}));

	const columns: ColumnData<Group>[] = [
		{
			fieldName: 'name',
			title: t('catalog:groups.table.name'),
		},
		{
			title: t('catalog:groups.table.lookupKey'),
			fieldName: 'lookup_key',
		},
		{
			title: t('catalog:groups.table.entityType'),
			render: (row) => {
				const label =
					row.entity_type === GROUP_ENTITY_TYPE.PRICE ? t('catalog:groups.drawer.entityPrice') : t('catalog:groups.drawer.entityFeature');
				return <Chip variant='default' label={label} />;
			},
		},
		{
			title: t('catalog:groups.table.updatedAt'),
			render: (row) => {
				return formatDate(row.updated_at);
			},
		},
		{
			fieldVariant: 'interactive',
			render: (row) => (
				<ActionButton
					id={row.id}
					copyId={{ entityType: 'Group' }}
					deleteMutationFn={(id) => GroupApi.deleteGroup(id)}
					refetchQueryKey='fetchGroups'
					entityName={t('catalog:groups.table.entityName')}
					edit={{
						onClick: () => onEdit(row),
					}}
					archive={{
						enabled: row.status === ENTITY_STATUS.PUBLISHED,
					}}
				/>
			),
		},
	];

	return <FlexpriceTable columns={columns} data={mappedData} showEmptyRow />;
};

export default GroupsTable;
