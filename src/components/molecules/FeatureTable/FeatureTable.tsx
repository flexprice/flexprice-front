import { FC } from 'react';
import FlexpriceTable, { ColumnData } from '../Table';
import Feature from '@/models/Feature';
import { ActionButton, Chip } from '@/components/atoms';
import { toSentenceCase } from '@/utils/common/helper_functions';
import formatChips from '@/utils/common/format_chips';
import formatDate from '@/utils/common/format_date';
import { useNavigate } from 'react-router-dom';
import { RouteNames } from '@/core/routes/Routes';
import FeatureApi from '@/api/FeatureApi';
import { getFeatureIcon } from '@/components/atoms/SelectFeature/SelectFeature';

interface Props {
	data: Feature[];
}

export const getFeatureTypeChips = (type: string, addIcon: boolean = false) => {
	const icon = getFeatureIcon(type);
	switch (type.toLocaleLowerCase()) {
		case 'static': {
			return <Chip textColor='#4B5563' bgColor='#F3F4F6' icon={addIcon ? icon : null} label={toSentenceCase(type)} />;
		}
		case 'metered':
			return <Chip textColor='#1E40AF' bgColor='#DBEAFE' icon={addIcon ? icon : null} label={toSentenceCase(type)} />;
		case 'boolean':
			return <Chip textColor='#166534' bgColor='#DCFCE7' icon={addIcon ? icon : null} label={toSentenceCase(type)} />;
		default:
			return <Chip textColor='#6B7280' bgColor='#F9FAFB' icon={addIcon ? icon : null} label={toSentenceCase(type)} />;
	}
};

const FeatureTable: FC<Props> = ({ data }) => {
	const navigate = useNavigate();

	const columnData: ColumnData<Feature>[] = [
		{
			fieldName: 'name',
			title: 'Feature Name',
			fieldVariant: 'title',
		},
		{
			title: 'Type',
			render(row) {
				return getFeatureTypeChips(row?.type || '', true);
			},
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
			render: (row) => {
				return formatDate(row?.updated_at);
			},
		},
		{
			fieldVariant: 'interactive',
			render(row) {
				return (
					<ActionButton
						deleteMutationFn={async () => {
							return await FeatureApi.deleteFeature(row?.id);
						}}
						id={row?.id}
						editPath={''}
						isEditDisabled={true}
						isArchiveDisabled={row?.status === 'archived'}
						refetchQueryKey={'fetchFeatures'}
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
					navigate(RouteNames.featureDetails + `/${row?.id}`);
				}}
			/>
		</div>
	);
};

export default FeatureTable;
