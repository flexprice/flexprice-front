import { FC, useMemo } from 'react';
import FlexpriceTable, { ColumnData } from '../Table';
import Feature, { FEATURE_TYPE } from '@/models/Feature';
import { ENTITY_STATUS } from '@/models';
import { ActionButton, Chip } from '@/components/atoms';
import formatDate from '@/utils/common/format_date';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import FeatureApi from '@/api/FeatureApi';
import { getFeatureIcon } from '@/components/atoms/SelectFeature/SelectFeature';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

interface Props {
	data: Feature[];
	onEdit?: (feature: Feature) => void;
}

const renderFeatureTypeChip = (type: string, t: TFunction<'catalog'>, addIcon: boolean) => {
	const icon = getFeatureIcon(type);
	const key = type?.toLowerCase();
	const label =
		key === FEATURE_TYPE.STATIC
			? t('features.listPage.typeChips.static')
			: key === FEATURE_TYPE.METERED
				? t('features.listPage.typeChips.metered')
				: key === FEATURE_TYPE.BOOLEAN
					? t('features.listPage.typeChips.boolean')
					: t('features.listPage.typeChips.unknown');
	switch (key) {
		case FEATURE_TYPE.STATIC:
			return <Chip textColor='#4B5563' bgColor='#F3F4F6' icon={addIcon ? icon : null} label={label} className='text-xs' />;
		case FEATURE_TYPE.METERED:
			return <Chip textColor='#1E40AF' bgColor='#DBEAFE' icon={addIcon ? icon : null} label={label} className='text-xs' />;
		case FEATURE_TYPE.BOOLEAN:
			return <Chip textColor='#166534' bgColor='#DCFCE7' icon={addIcon ? icon : null} label={label} className='text-xs' />;
		default:
			return <Chip textColor='#6B7280' bgColor='#F9FAFB' icon={addIcon ? icon : null} label={label} className='text-xs' />;
	}
};

const FeatureTable: FC<Props> = ({ data, onEdit }) => {
	const navigate = useNavigate();
	const { t } = useTranslation('catalog');

	const columnData: ColumnData<Feature>[] = useMemo(
		() => [
			{
				fieldName: 'name',
				title: t('features.listPage.columns.featureName'),
			},
			{
				title: t('features.listPage.columns.type'),
				render(row) {
					return renderFeatureTypeChip(row?.type || '', t, true);
				},
			},
			{
				title: t('features.listPage.columns.status'),
				render: (row) => {
					const isActive = row?.status === ENTITY_STATUS.PUBLISHED;
					const label = isActive ? t('features.listPage.filterStatus.active') : t('features.listPage.filterStatus.inactive');
					return <Chip variant={isActive ? 'success' : 'default'} label={label} />;
				},
			},
			{
				title: t('features.listPage.columns.updatedAt'),
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
							copyId={{ entityType: 'Feature' }}
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
		],
		[t, onEdit],
	);

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
