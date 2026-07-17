import { FC } from 'react';
import FlexpriceTable, { ColumnData } from '../Table';
import CostSheet from '@/models/CostSheet';
import { ENTITY_STATUS } from '@/models';
import { ActionButton, Chip } from '@/components/atoms';
import formatDate from '@/utils/common/format_date';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import CostSheetApi from '@/api/CostSheetApi';
import { useTranslation } from 'react-i18next';

interface Props {
	data: CostSheet[];
	onEdit?: (costSheet: CostSheet) => void;
}

const CostSheetTable: FC<Props> = ({ data, onEdit }) => {
	const navigate = useNavigate();
	const { t } = useTranslation(['catalog', 'common']);

	const columnData: ColumnData<CostSheet>[] = [
		{
			fieldName: 'name',
			title: t('catalog:costSheets.table.costSheetName'),
		},
		{
			fieldName: 'lookup_key',
			title: t('catalog:costSheets.table.lookupKey'),
		},
		{
			title: t('catalog:costSheets.table.status'),
			render: (row) => {
				const isPublished = row?.status === ENTITY_STATUS.PUBLISHED;
				return (
					<Chip
						variant={isPublished ? 'success' : 'default'}
						label={isPublished ? t('common:status.active') : t('common:status.inactive')}
					/>
				);
			},
		},
		{
			title: t('catalog:costSheets.table.updatedAt'),
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
							enabled: !!onEdit,
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
					navigate(RouteNames.costSheetDetails + `/${row?.id}`);
				}}
			/>
		</div>
	);
};

export default CostSheetTable;
