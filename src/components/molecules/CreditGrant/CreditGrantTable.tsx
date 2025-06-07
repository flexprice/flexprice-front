import { CREDIT_GRANT_EXPIRATION_TYPE, CreditGrant } from '@/models/CreditGrant';
import React, { useState } from 'react';
import { AddButton, FormHeader, ActionButton } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '../Table';
import CreditGrantModal from './CreditGrantModal';
import { getCurrencySymbol } from '@/utils/common/helper_functions';

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
			return 'No expiry';
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
			render: (row) => `${getCurrencySymbol(row.currency)}${row.credits}`,
		},
		{
			title: 'Expiry Type',
			render: (row) => formatExpirationType(row.expiration_type),
		},
		{
			title: 'Expiry Duration',
			render: (row) => (row.expiration_duration ? `${row.expiration_duration} days` : 'Never'),
		},
		{
			title: 'Priority',
			render: (row) => (row.priority ? row.priority : '--'),
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
