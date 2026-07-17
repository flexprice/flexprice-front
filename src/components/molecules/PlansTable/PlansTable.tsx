import { FC, useMemo } from 'react';
import { ActionButton, Chip } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '../Table';
import { Plan } from '@/models/Plan';
import { ENTITY_STATUS } from '@/models';
import formatDate from '@/utils/common/format_date';
import { PlanApi } from '@/api/PlanApi';
import { RouteNames } from '@/core/routes/Routes';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
export interface PlansTableProps {
	data: Plan[];
	onEdit: (plan: Plan) => void;
}

const PlansTable: FC<PlansTableProps> = ({ data, onEdit }) => {
	const navigate = useNavigate();
	const { t } = useTranslation(['catalog', 'common']);
	const mappedData = data?.map((plan) => ({
		...plan,
	}));

	const columns: ColumnData<Plan>[] = useMemo(
		() => [
			{
				fieldName: 'name',
				title: t('plans.listPage.columns.name'),
			},
			{
				title: t('plans.listPage.columns.status'),

				render: (row) => {
					const isActive = row.status === ENTITY_STATUS.PUBLISHED;
					const label = isActive ? t('common:status.active') : t('common:status.inactive');
					return <Chip variant={isActive ? 'success' : 'default'} label={label} />;
				},
			},
			{
				title: t('plans.listPage.columns.updatedAt'),
				render: (row) => {
					return formatDate(row.updated_at);
				},
			},
			{
				fieldVariant: 'interactive',
				render: (row) => (
					<ActionButton
						id={row.id}
						copyId={{ entityType: 'Plan' }}
						deleteMutationFn={(id) => PlanApi.deletePlan(id)}
						refetchQueryKey='fetchPlans'
						entityName={t('plans.listPage.entityName')}
						edit={{
							path: `${RouteNames.plan}/edit-plan?id=${row.id}`,
							onClick: () => onEdit(row),
						}}
						archive={{
							enabled: row.status === ENTITY_STATUS.PUBLISHED,
						}}
					/>
				),
			},
		],
		[t, onEdit],
	);

	return (
		<FlexpriceTable
			columns={columns}
			data={mappedData}
			showEmptyRow
			onRowClick={(row) => {
				navigate(RouteNames.plan + `/${row.id}`);
			}}
		/>
	);
};

export default PlansTable;
