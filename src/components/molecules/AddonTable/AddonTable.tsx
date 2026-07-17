import { FC } from 'react';
import FlexpriceTable, { ColumnData } from '../Table';
import Addon from '@/models/Addon';
import { ENTITY_STATUS } from '@/models';
import { ActionButton, Chip } from '@/components/atoms';
import formatDate from '@/utils/common/format_date';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import AddonApi from '@/api/AddonApi';
import { useTranslation } from 'react-i18next';

interface Props {
	data: Addon[];
	onEdit?: (addon: Addon) => void;
}

const AddonTable: FC<Props> = ({ data, onEdit }) => {
	const { t } = useTranslation('catalog');
	const navigate = useNavigate();

	const columnData: ColumnData<Addon>[] = [
		{
			fieldName: 'name',
			title: t('addons.drawer.addonName'),
		},
		{
			fieldName: 'lookup_key',
			title: t('shared.lookupKey'),
		},
		{
			title: t('addons.table.status'),
			render: (row) => {
				const isActive = row?.status === ENTITY_STATUS.PUBLISHED;
				const label = isActive ? t('addons.table.statusActive') : t('addons.table.statusInactive');
				return <Chip variant={isActive ? 'success' : 'default'} label={label} />;
			},
		},
		{
			title: t('addons.table.updatedAt'),
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
							onClick: () => onEdit?.(row),
						}}
						archive={{
							enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
						}}
					/>
				);
			},
		},
	];

	return (
		<div>
			<FlexpriceTable
				data={data}
				columns={columnData}
				showEmptyRow
				onRowClick={(row) => {
					navigate(RouteNames.addonDetails + `/${row?.id}`);
				}}
			/>
		</div>
	);
};

export default AddonTable;
