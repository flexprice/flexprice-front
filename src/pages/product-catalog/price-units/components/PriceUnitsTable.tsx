import { FC } from 'react';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { PriceUnitResponse } from '@/types/dto/PriceUnit';
import { ActionButton, Chip } from '@/components/atoms';
import formatChips from '@/utils/common/format_chips';
import { useNavigate } from 'react-router-dom';
import { RouteNames } from '@/core/routes/Routes';
import PriceUnitApi from '@/api/PriceUnitApi';
import formatDate from '@/utils/common/format_date';

interface Props {
	data: PriceUnitResponse[];
}

const PriceUnitsTable: FC<Props> = ({ data }) => {
	const navigate = useNavigate();

	const columnData: ColumnData<PriceUnitResponse>[] = [
		{
			fieldName: 'name',
			title: 'Name',
		},
		{
			fieldName: 'code',
			title: 'Code',
		},
		{
			fieldName: 'symbol',
			title: 'Symbol',
		},
		{
			fieldName: 'base_currency',
			title: 'Base Currency',
		},
		{
			title: 'Conversion Rate',
			render: (row) => row.conversion_rate.toString(),
		},
		{
			title: 'Status',
			render: (row) => {
				const label = formatChips(row?.status);
				return <Chip variant={label === 'Active' ? 'success' : 'default'} label={label} />;
			},
		},
		{
			title: 'Updated At',
			render: (row) => formatDate(row?.updated_at),
		},
		{
			fieldVariant: 'interactive',
			render(row) {
				return (
					<ActionButton
						deleteMutationFn={async () => {
							return await PriceUnitApi.delete(row?.id);
						}}
						id={row?.id}
						editPath={''}
						isEditDisabled={true}
						isArchiveDisabled={row?.status === 'archived'}
						refetchQueryKey={'fetchPriceUnits'}
						entityName={row?.name}
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
					navigate(RouteNames.priceUnitDetails + `/${row?.id}`);
				}}
			/>
		</div>
	);
};

export default PriceUnitsTable;
