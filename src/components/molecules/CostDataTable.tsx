import { useTranslation } from 'react-i18next';
import React from 'react';
import { FlexpriceTable, type ColumnData } from '@/components/molecules';
import { CostAnalyticItem } from '@/types';
import { formatNumber, formatCurrencyAmount } from '@/utils';

interface CostDataTableProps {
	items: CostAnalyticItem[];
}

export const CostDataTable: React.FC<CostDataTableProps> = ({ items }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const columns: ColumnData<CostAnalyticItem>[] = [
		{
			title: t('catalog:costAnalytics.table.costAttribute'),
			render: (row: CostAnalyticItem) => {
				return <span>{row.meter_name || row.meter?.name || row.meter_id}</span>;
			},
		},
		{
			title: t('catalog:costAnalytics.table.totalQuantity'),
			render: (row: CostAnalyticItem) => {
				return <span>{formatNumber(parseFloat(row.total_quantity || '0'))}</span>;
			},
		},
		{
			title: t('catalog:costAnalytics.table.totalCost'),
			render: (row: CostAnalyticItem) => {
				const amount = parseFloat(row.total_cost || '0');
				return <span>{formatCurrencyAmount(amount, row.currency)}</span>;
			},
		},
	];

	const tableData = items.map((item, index) => {
		const fallbackId = [item.meter_name, item.source, item.customer_id || item.external_customer_id, item.price_id]
			.filter(Boolean)
			.join('-');

		return {
			...item,
			id: item.meter_id || (fallbackId ? `item-${fallbackId}` : `item-${index}`),
		};
	});

	return (
		<>
			<h1 className='text-lg font-medium text-content mb-4'>{t('common:labels.costBreakdown')}</h1>
			<FlexpriceTable columns={columns} data={tableData} showEmptyRow />
		</>
	);
};
