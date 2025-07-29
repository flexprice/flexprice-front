import { FC } from 'react';
import { ActionButton, Chip } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '../Table';
import { Plan } from '@/models/Plan';
import formatChips from '@/utils/common/format_chips';
import formatDate from '@/utils/common/format_date';
import { PlanApi } from '@/api/PlanApi';
import { RouteNames } from '@/core/routes/Routes';
import { useNavigate } from 'react-router-dom';
export interface PlansTableProps {
	data: Plan[];
	onEdit: (plan: Plan) => void;
}

const PlansTable: FC<PlansTableProps> = ({ data, onEdit }) => {
	const navigate = useNavigate();
	const mappedData = data?.map((plan) => ({
		...plan,
	}));

	const columns: ColumnData<Plan>[] = [
		{
			fieldName: 'name',
			title: 'Name',
		},
		{
			title: 'Status',

			render: (row) => {
				const label = formatChips(row.status);
				return <Chip variant={label === 'Active' ? 'success' : 'default'} label={label} />;
			},
		},
		{
			title: 'Updated at',
			render: (row) => {
				return formatDate(row.updated_at);
			},
		},
		{
			fieldVariant: 'interactive',
			render: (row) => (
				<ActionButton
					id={row.id}
					isArchiveDisabled={row.status !== 'published'}
					editPath={`${RouteNames.plan}/edit-plan?id=${row.id}`}
					deleteMutationFn={(id) => PlanApi.deletePlan(id)}
					refetchQueryKey='fetchPlans'
					entityName='Plan'
					onEdit={() => onEdit(row)}
				/>
			),
		},
	];

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
