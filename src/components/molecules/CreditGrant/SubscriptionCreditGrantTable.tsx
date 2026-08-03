import React, { useState, useEffect } from 'react';
import { AddButton, FormHeader, ActionButton } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '../Table';
import CreditGrantModal from './CreditGrantModal';
import { formatBillingPeriodForPrice } from '@/utils/common/helper_functions';
import { formatExpirationPeriod } from '@/utils/common/credit_grant_helpers';
import { InternalCreditGrantRequest } from '@/types/dto/CreditGrant';
import { CreditGrant, CREDIT_GRANT_SCOPE } from '@/models';
import { useTranslation } from 'react-i18next';

interface Props {
	data: InternalCreditGrantRequest[];
	onChange: (data: InternalCreditGrantRequest[]) => void;
	disabled?: boolean;
	getEmptyCreditGrant: () => InternalCreditGrantRequest;
	planLevelCreditGrantIds?: Set<string>;
	onMarkAsEdited?: (grantId: string) => void;
	subscriptionId?: string;
}

const SubscriptionCreditGrantTable: React.FC<Props> = ({
	data,
	onChange,
	disabled,
	getEmptyCreditGrant,
	planLevelCreditGrantIds = new Set(),
	onMarkAsEdited,
	subscriptionId,
}) => {
	const { t } = useTranslation('common');
	const [isOpen, setIsOpen] = useState(false);
	const [selectedCreditGrant, setSelectedCreditGrant] = useState<InternalCreditGrantRequest | null>(null);

	useEffect(() => {
		if (!isOpen) {
			setSelectedCreditGrant(null);
		}
	}, [isOpen]);

	const handleSave = (newCreditGrant: InternalCreditGrantRequest) => {
		if (selectedCreditGrant) {
			const isPlanLevelGrant = planLevelCreditGrantIds.has(selectedCreditGrant.id);

			if (isPlanLevelGrant && onMarkAsEdited) {
				onMarkAsEdited(selectedCreditGrant.id);
			}

			const updatedGrant = isPlanLevelGrant
				? {
						...newCreditGrant,
						id: selectedCreditGrant.id,
						scope: CREDIT_GRANT_SCOPE.SUBSCRIPTION,
						subscription_id: subscriptionId,
						plan_id: undefined,
					}
				: {
						...newCreditGrant,
						id: selectedCreditGrant.id,
					};

			onChange(data.map((credit) => (credit.id === selectedCreditGrant.id ? updatedGrant : credit)));
		} else {
			onChange([...data, newCreditGrant]);
		}
	};

	const handleDelete = async (id: string) => {
		onChange(data.filter((grant) => grant.id !== id));
		const isPlanLevelGrant = planLevelCreditGrantIds.has(id);
		if (isPlanLevelGrant && onMarkAsEdited) {
			onMarkAsEdited(id);
		}
	};

	const handleEdit = (credit: InternalCreditGrantRequest) => {
		setSelectedCreditGrant(credit);
		setIsOpen(true);
	};

	const columns: ColumnData<InternalCreditGrantRequest>[] = [
		{
			title: 'Name',
			fieldName: 'name',
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
			render: (row) => (row.period ? `${row.period_count || 1} ${formatBillingPeriodForPrice(row.period)}` : '--'),
		},
		{
			title: 'Expiration',
			render: (row) => formatExpirationPeriod(row as CreditGrant),
		},
		{
			fieldVariant: 'interactive',
			hideOnEmpty: true,
			render: (row) => {
				// Enable edit/delete for all grants (both plan and subscription level)
				return (
					<ActionButton
						id={row.id}
						copyId={{ entityType: 'Credit Grant' }}
						deleteMutationFn={() => handleDelete(row.id)}
						refetchQueryKey='credit_grants'
						entityName={row.name}
						edit={{
							enabled: !disabled,
							onClick: () => handleEdit(row),
						}}
						archive={{
							enabled: !disabled,
							text: t('actions.delete'),
						}}
					/>
				);
			},
		},
	];

	return (
		<>
			<CreditGrantModal
				getEmptyCreditGrant={getEmptyCreditGrant}
				data={selectedCreditGrant ?? undefined}
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				onSave={handleSave}
				onCancel={() => setIsOpen(false)}
			/>
			<div className='space-y-4'>
				<div className='flex items-center justify-between'>
					<FormHeader className='mb-0' title={t('labels.creditGrants')} variant='sub-header' />
					<AddButton onClick={() => setIsOpen(true)} disabled={disabled} />
				</div>
				<div className='rounded-[6px] border border-line-strong'>
					<FlexpriceTable data={data} columns={columns} showEmptyRow />
				</div>
			</div>
		</>
	);
};

export default SubscriptionCreditGrantTable;
