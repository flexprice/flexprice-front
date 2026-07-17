import { FC } from 'react';
import FlexpriceTable, { ColumnData } from '../Table';
import { PriceUnit } from '@/models/PriceUnit';
import { ENTITY_STATUS } from '@/models';
import { ActionButton, Chip } from '@/components/atoms';
import formatDate from '@/utils/common/format_date';
import { PriceUnitApi } from '@/api/PriceUnitApi';
import { useTranslation } from 'react-i18next';

const formatConversionRate = (rate: string): string => {
	if (!rate) return '-';
	const numRate = parseFloat(rate);
	if (isNaN(numRate)) return '-';
	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 8,
	}).format(numRate);
};

interface Props {
	data: PriceUnit[];
	onEdit?: (priceUnit: PriceUnit) => void;
}

const PriceUnitTable: FC<Props> = ({ data, onEdit }) => {
	const { t } = useTranslation(['catalog', 'common']);

	const columnData: ColumnData<PriceUnit>[] = [
		{
			fieldName: 'name',
			title: t('catalog:priceUnits.table.name'),
		},
		{
			fieldName: 'code',
			title: t('catalog:priceUnits.table.code'),
		},
		{
			fieldName: 'symbol',
			title: t('catalog:priceUnits.table.symbol'),
		},
		{
			title: t('catalog:priceUnits.table.baseCurrency'),
			render: (row) => {
				return row?.base_currency?.toUpperCase() || '-';
			},
		},
		{
			title: t('catalog:priceUnits.table.conversionRate'),
			render: (row) => {
				return formatConversionRate(row?.conversion_rate || '');
			},
		},
		{
			title: t('catalog:priceUnits.table.status'),
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
			title: t('catalog:priceUnits.table.updatedAt'),
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
						copyId={{ entityType: 'Price Unit' }}
						deleteMutationFn={async () => {
							return await PriceUnitApi.DeletePriceUnit(row?.id);
						}}
						refetchQueryKey='fetchPriceUnits'
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
			<FlexpriceTable data={data} columns={columnData} showEmptyRow />
		</div>
	);
};

export default PriceUnitTable;
