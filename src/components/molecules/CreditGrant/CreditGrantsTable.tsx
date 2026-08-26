import React from 'react';
import { ActionButton } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '../Table';
import { CreditGrant } from '@/models';
import { formatExpirationPeriod } from '@/utils/common/credit_grant_helpers';
import { formatBillingPeriodForPrice } from '@/utils/common/helper_functions';
import { formatAmount } from '@/components/atoms/Input/Input';
import CreditGrantApi from '@/api/CreditGrantApi';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CreditGrantsTableProps {
	data: CreditGrant[];
	onDelete?: (grant: CreditGrant) => void | Promise<void>;
	showEmptyRow?: boolean;
}

const CreditGrantsTable: React.FC<CreditGrantsTableProps> = ({ data, onDelete, showEmptyRow = false }) => {
	const { t } = useTranslation('common');

	const handleDelete = async (grant: CreditGrant) => {
		await CreditGrantApi.delete(grant.id);

		if (onDelete) {
			await onDelete(grant);
		}
	};

	const columns: ColumnData<CreditGrant>[] = [
		{
			title: 'Name',
			render: (row) => {
				return <span>{row.name}</span>;
			},
		},
		{
			title: 'Credits',
			render: (row) => {
				return <span>{formatAmount(row.credits.toString())}</span>;
			},
		},
		{
			title: 'Priority',
			render: (row) => {
				return <span>{row.priority ?? t('labels.na')}</span>;
			},
		},
		{
			title: 'Cadence',
			render: (row) => {
				const cadence = row.cadence.toLowerCase().replace('_', ' ');
				return cadence.charAt(0).toUpperCase() + cadence.slice(1);
			},
		},
		{
			title: 'Period',
			render: (row) => (row.period ? `${row.period_count || 1} ${formatBillingPeriodForPrice(row.period)}` : '—'),
		},
		{
			title: 'Expiration Config',
			render: (row) => {
				return <span>{formatExpirationPeriod(row)}</span>;
			},
		},
		{
			fieldVariant: 'interactive' as const,
			width: '30px',
			hideOnEmpty: true,
			render: (row) => {
				return (
					<ActionButton
						id={row.id}
						copyId={{ entityType: 'Credit Grant' }}
						deleteMutationFn={async () => {
							await handleDelete(row);
						}}
						refetchQueryKey='creditGrants'
						entityName={row.name}
						edit={{
							enabled: false,
						}}
						archive={{
							enabled: true,
							text: t('actions.delete'),
							icon: <Trash2 />,
						}}
					/>
				);
			},
		},
	];

	return <FlexpriceTable showEmptyRow={showEmptyRow} data={data} columns={columns} />;
};

export default CreditGrantsTable;
