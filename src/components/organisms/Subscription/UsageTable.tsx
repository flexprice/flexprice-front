import { FC } from 'react';
import { SubscriptionUsage } from '@/models/Subscription';
import { ColumnData, FlexpriceTable } from '@/components/molecules';
import { FormHeader } from '@/components/atoms';
import { useTranslation } from 'react-i18next';

export interface UsageTableProps {
	data: SubscriptionUsage;
}

const UsageTable: FC<UsageTableProps> = ({ data }) => {
	const { t } = useTranslation('customers');
	const mappedData = (data?.charges ?? []).map((usage) => ({
		name: usage.meter_display_name,
		quantity: usage.quantity,
		amount: usage.display_amount,
	}));

	const columns: ColumnData[] = [
		{
			fieldName: 'name',
			title: 'Feature Name',
		},
		{
			fieldName: 'quantity',
			title: 'Quantity',
		},
		{
			fieldName: 'amount',
			title: 'Amount',
		},
	];

	return (
		<div className='rounded-[6px] border border-gray-300  mt-2 p-4'>
			<FormHeader title={t('organisms.usageTable.currentMeterUsage')} variant='sub-header' />
			<div className='rounded-[6px] border border-gray-300  mt-2 '>
				<FlexpriceTable columns={columns} data={mappedData} />
			</div>
		</div>
	);
};

export default UsageTable;
