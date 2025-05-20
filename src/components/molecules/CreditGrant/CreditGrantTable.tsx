import { CreditGrant } from '@/models/Subscription';
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
			title: 'Amount',
			render: (row) => `${getCurrencySymbol(row.currency)}${row.amount}`,
		},
		{
			title: 'Expiry',
			render: (row) => (row.expire_in_days ? `${row.expire_in_days} days` : 'Never'),
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
						label='Add Credit'
						variant='outline'
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
