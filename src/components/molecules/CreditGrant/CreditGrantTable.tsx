import { CREDIT_GRANT_EXPIRATION_TYPE, CreditGrant } from '@/models/CreditGrant';
import React, { useState } from 'react';
import { AddButton, FormHeader, ActionButton } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '../Table';
import CreditGrantModal from './CreditGrantModal';
import { formatBillingPeriodForPrice } from '@/utils/common/helper_functions';
import { formatExpirationPeriod } from '@/pages/customer/customers/SubscriptionDetails';

interface Props {
	data: CreditGrant[];
	onChange: (data: CreditGrant[]) => void;
	disabled?: boolean;
	getEmptyCreditGrant: () => Partial<CreditGrant>;
}

export const formatExpirationType = (expirationType: CREDIT_GRANT_EXPIRATION_TYPE) => {
	switch (expirationType) {
		case CREDIT_GRANT_EXPIRATION_TYPE.DURATION:
			return 'Days';
		case CREDIT_GRANT_EXPIRATION_TYPE.BILLING_CYCLE:
			return 'Subscription period';
		case CREDIT_GRANT_EXPIRATION_TYPE.NEVER:
			return '--';
		default:
			return '--';
	}
};

const CreditGrantTable: React.FC<Props> = ({ data, onChange, disabled, getEmptyCreditGrant }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedCreditGrant, setSelectedCreditGrant] = useState<CreditGrant | null>(null);

	const handleSave = (newCreditGrant: CreditGrant) => {
		if (selectedCreditGrant) {
			// Edit existing credit
			onChange(data.map((credit) => (credit.id === selectedCreditGrant.id ? newCreditGrant : credit)));
		} else {
			// Add new credit
			onChange([...data, newCreditGrant]);
		}
		setSelectedCreditGrant(null);
	};

	const handleDelete = async (id: string) => {
		onChange(data.filter((grant) => grant.id !== id));
	};

	const handleEdit = (credit: CreditGrant) => {
		setSelectedCreditGrant(credit);
		setIsOpen(true);
	};

	const columns: ColumnData<CreditGrant>[] = [
		{
			title: 'Name',
			fieldName: 'name',
			fieldVariant: 'title',
		},
		{
			title: 'Credits',
			render: (row) => `${row.credits}`,
		},
		{
			title: 'Priority',
			render: (row) => row.priority?.toString() || '--',
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
			render: (row) => (row.period ? `${row.period_count} ${formatBillingPeriodForPrice(row.period)}` : '--'),
		},
		{
			title: 'Expiration',
			render: (row) => formatExpirationPeriod(row),
		},
		{
			fieldVariant: 'interactive',
			hideOnEmpty: true,
			render: (row) => (
				<ActionButton
					archiveText='Delete'
					id={row.id}
					deleteMutationFn={() => handleDelete(row.id)}
					refetchQueryKey='credit_grants'
					entityName={row.name}
					isEditDisabled={disabled}
					isArchiveDisabled={disabled}
					onEdit={() => handleEdit(row)}
				/>
			),
		},
	];

	return (
		<>
			<CreditGrantModal
				getEmptyCreditGrant={getEmptyCreditGrant}
				data={selectedCreditGrant || undefined}
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				onSave={handleSave}
				onCancel={() => {
					setIsOpen(false);
					setSelectedCreditGrant(null);
				}}
			/>
			<div className='space-y-4'>
				<div className='flex items-center justify-between'>
					<FormHeader className='mb-0' title='Credit Grants' variant='sub-header' />
					<AddButton
						size='sm'
						onClick={() => {
							setSelectedCreditGrant(null);
							setIsOpen(true);
						}}
						disabled={disabled}
						className='text-sm py-1.5'
					/>
				</div>
				<div className='rounded-xl border border-gray-300 space-y-6 mt-2 '>
					<FlexpriceTable data={data} columns={columns} showEmptyRow />
				</div>
			</div>
		</>
	);
};

export default CreditGrantTable;
