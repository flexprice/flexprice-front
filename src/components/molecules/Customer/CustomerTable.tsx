import { FC } from 'react';
import { ActionButton, Chip } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '../Table';
import formatDate from '@/utils/common/format_date';
import formatChips from '@/utils/common/format_chips';
import Customer from '@/models/Customer';
import CustomerApi from '@/api/CustomerApi';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import { ENTITY_STATUS } from '@/models';
import { ExternalLink } from 'lucide-react';
import { useCustomerPortalUrl } from '@/hooks/useCustomerPortalUrl';
import { useTranslation } from 'react-i18next';

const ActionButtonWithPortal: FC<{ customer: Customer; onEdit: (customer: Customer) => void }> = ({ customer, onEdit }) => {
	const { t } = useTranslation('customers');
	const { openInNewTab } = useCustomerPortalUrl(customer.external_id);

	return (
		<ActionButton
			id={customer.id}
			copyId={{ entityType: 'Customer' }}
			deleteMutationFn={(id) => CustomerApi.deleteCustomerById(id)}
			refetchQueryKey='fetchCustomers'
			entityName={t('list.entityName')}
			edit={{
				enabled: customer.status === ENTITY_STATUS.PUBLISHED,
				path: `/billing/customers/edit-customer?id=${customer.id}`,
				onClick: () => onEdit(customer),
			}}
			archive={{
				enabled: customer.status === ENTITY_STATUS.PUBLISHED,
			}}
			customActions={[
				{
					text: t('list.openPortal'),
					icon: <ExternalLink className='h-4 w-4' />,
					onClick: openInNewTab,
				},
			]}
		/>
	);
};

export interface Props {
	data: Customer[];
	onEdit: (customer: Customer) => void;
}

const CustomerTable: FC<Props> = ({ data, onEdit }) => {
	const navigate = useNavigate();
	const { t } = useTranslation('customers');
	const mappedData = data?.map((customer) => ({
		...customer,
	}));
	const columns: ColumnData[] = [
		{ fieldName: 'name', title: t('list.columns.name'), width: '400px' },
		{ fieldName: 'external_id', title: t('list.columns.externalId') },
		{
			title: t('list.columns.status'),

			render: (row) => {
				const label = formatChips(row.status);
				return <Chip variant={label === 'Active' ? 'success' : 'default'} label={label} />;
			},
		},
		{
			title: t('list.columns.updatedAt'),
			render: (row) => {
				return <>{formatDate(row.updated_at)}</>;
			},
		},
		{
			title: '',
			fieldVariant: 'interactive',
			render: (row) => <ActionButtonWithPortal customer={row} onEdit={onEdit} />,
		},
	];

	return (
		<FlexpriceTable
			showEmptyRow
			columns={columns}
			data={mappedData}
			onRowClick={(row) => {
				navigate(RouteNames.customers + `/${row?.id}`);
			}}
		/>
	);
};

export default CustomerTable;
