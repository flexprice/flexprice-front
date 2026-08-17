import { FC, useMemo } from 'react';
import FlexpriceTable, { ColumnData } from '../Table';
import Feature, { FEATURE_TYPE } from '@/models/Feature';
import { ENTITY_STATUS } from '@/models';
import { ActionButton, StatusChip, getFeatureTypeTone } from '@/components/atoms';
import formatDate from '@/utils/common/format_date';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import FeatureApi from '@/api/FeatureApi';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

interface Props {
	data: Feature[];
	onEdit?: (feature: Feature) => void;
}

const renderFeatureTypeChip = (type: string, t: TFunction<'catalog'>) => {
	const key = type?.toLowerCase();
	const label =
		key === FEATURE_TYPE.STATIC
			? t('features.listPage.typeChips.static')
			: key === FEATURE_TYPE.METERED
				? t('features.listPage.typeChips.metered')
				: key === FEATURE_TYPE.BOOLEAN
					? t('features.listPage.typeChips.boolean')
					: key === FEATURE_TYPE.CONFIG
						? t('features.listPage.typeChips.config')
						: t('features.listPage.typeChips.unknown');
	return <StatusChip tone={getFeatureTypeTone(type)} label={label} />;
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
					return renderFeatureTypeChip(row?.type || '', t);
				},
			},
			{
				title: t('features.listPage.columns.status'),
				render: (row) => {
					const isActive = row?.status === ENTITY_STATUS.PUBLISHED;
					const label = isActive ? t('features.listPage.filterStatus.active') : t('features.listPage.filterStatus.inactive');
					return <StatusChip status={isActive ? 'Active' : 'Inactive'} label={label} />;
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
