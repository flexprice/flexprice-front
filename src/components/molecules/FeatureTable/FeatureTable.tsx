import { FC } from 'react';
import FlexpriceTable, { ColumnData } from '../Table';
import Feature, { FEATURE_TYPE } from '@/models/Feature';
import { ENTITY_STATUS } from '@/models';
import { ActionButton, Chip } from '@/components/atoms';
import { toSentenceCase } from '@/utils/common/helper_functions';
import formatChips from '@/utils/common/format_chips';
import formatDate from '@/utils/common/format_date';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import FeatureApi from '@/api/FeatureApi';
import { getFeatureIcon } from '@/components/atoms/SelectFeature/SelectFeature';
interface Props {
	data: Feature[];
	onEdit?: (feature: Feature) => void;
}

export const getFeatureTypeChips = (type: string, addIcon: boolean = false) => {
	const icon = getFeatureIcon(type);
	switch (type.toLocaleLowerCase()) {
		case FEATURE_TYPE.STATIC: {
			return <Chip textColor='#4B5563' bgColor='#F3F4F6' icon={addIcon ? icon : null} label={toSentenceCase(type)} className='text-xs' />;
		}
		case FEATURE_TYPE.METERED:
			return <Chip textColor='#1E40AF' bgColor='#DBEAFE' icon={addIcon ? icon : null} label={toSentenceCase(type)} className='text-xs' />;
		case FEATURE_TYPE.BOOLEAN:
			return <Chip textColor='#166534' bgColor='#DCFCE7' icon={addIcon ? icon : null} label={toSentenceCase(type)} className='text-xs' />;
		default:
			return <Chip textColor='#6B7280' bgColor='#F9FAFB' icon={addIcon ? icon : null} label={toSentenceCase(type)} className='text-xs' />;
	}
};

const FeatureTable: FC<Props> = ({ data, onEdit }) => {
	const navigate = useNavigate();

	const columnData: ColumnData<Feature>[] = [
		{
			fieldName: 'name',
			title: 'Feature Name EDIT',
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
						id={row?.id}
						deleteMutationFn={async () => {
							return await FeatureApi.deleteFeature(row?.id);
						}}
						refetchQueryKey='fetchFeatures'
						entityName={row?.name}
						archive={{
							enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
						}}
						edit={{
							enabled: !!onEdit,
							onClick: onEdit ? () => onEdit(row) : undefined,
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
					navigate(RouteNames.featureDetails + `/${row?.id}`);
				}}
			/>
		</div>
	);
};

export default FeatureTable;
