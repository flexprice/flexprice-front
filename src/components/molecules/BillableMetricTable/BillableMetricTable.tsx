import { FC } from 'react';
import { ActionButton, Chip } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '../Table';
import { Meter } from '@/models/Meter';
import formatChips from '@/utils/common/format_chips';
import formatDate from '@/utils/common/format_date';
import { MeterApi } from '@/api/MeterApi';
import { formatAggregationType } from '@/components/organisms/MeterForm/MeterForm';
import { BaseEntityStatus } from '@/types/common';

export interface BillableMetricTableProps {
	data: Meter[];
}

const BillableMetricTable: FC<BillableMetricTableProps> = ({ data }) => {
	const mappedData = data?.map((meter) => ({
		...meter,
		aggregation_type: meter.aggregation.type,
		aggregation_field: meter.aggregation.field,
	}));
	const columns: ColumnData<
		Meter & {
			aggregation_type: string;
			aggregation_field: string;
		}
	>[] = [
		{ fieldName: 'name', title: 'Meter Name', width: '300px' },
		// { fieldName: 'event_name', title: 'Event Name', width: '300px' },
		{
			title: 'Aggregate Type',

			render: (row) => {
				return <span className='text-[#09090B] '>{formatAggregationType(row.aggregation_type)}</span>;
			},
		},
		{ fieldName: 'aggregation_field', title: 'Aggregate Value', align: 'center' },
		{
			title: 'Status',

			render: (row) => {
				const label = formatChips(row.status);
				return <Chip label={label} />;
			},
		},
		{
			title: 'Updated At',
			render: (row) => {
				return <span className='text-[#09090B] '>{formatDate(row.updated_at)}</span>;
			},
		},
		{
			title: '',
			render: (row) => (
				<ActionButton
					isEditDisabled={row.status === BaseEntityStatus.ARCHIVED}
					isArchiveDisabled={row.status === BaseEntityStatus.ARCHIVED}
					id={row.id}
					editPath={`/usage-tracking/meter/edit-meter?id=${row.id}`}
					row={row}
					deleteMutationFn={(id) => MeterApi.deleteMeter(id)}
					refetchQueryKey={'fetchMeters'}
					entityName={row.name}
				/>
			),
		},
	];

	return <FlexpriceTable columns={columns} data={mappedData} />;
};

export default BillableMetricTable;
