import { FC, useMemo } from 'react';
import { Card, FormHeader, AddButton, NoDataCard } from '@/components/atoms';
import { ActionButton } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import EditSubscriptionCreditGrantModal from '@/components/molecules/CreditGrant/EditSubscriptionCreditGrantModal';
import CancelCreditGrantModal from '@/components/molecules/CreditGrant/CancelCreditGrantModal';
import { formatExpirationPeriod } from '@/utils/common/credit_grant_helpers';
import { formatBillingPeriodForPrice } from '@/utils/common/helper_functions';
import { formatAmount } from '@/components/atoms/Input/Input';
import type { CreditGrant } from '@/models';
import { useTranslation } from 'react-i18next';

/** Subscription edit page: credit grants card, add/cancel modals. */
export interface SubscriptionEditCreditGrantsSectionProps {
	creditGrants: CreditGrant[];
	isAddDisabled: boolean;
	/** When true, add grant and per-row cancel/delete are disabled. */
	readOnly?: boolean;
	onAddClick: () => void;
	onRequestCancel: (grant: CreditGrant) => void;
	subscriptionId: string;
	subscriptionStartDate: string | undefined;
	subscriptionCurrentPeriodEnd: string | undefined;
	onSaveCreditGrant: (data: unknown) => void;
	isAddModalOpen: boolean;
	onAddModalOpenChange: (open: boolean) => void;
	creditGrantToCancel: CreditGrant | null;
	onConfirmCancelCreditGrant: (effectiveDate: string) => void;
	onCloseCancelModal: () => void;
}

const SubscriptionEditCreditGrantsSection: FC<SubscriptionEditCreditGrantsSectionProps> = ({
	creditGrants,
	isAddDisabled,
	readOnly = false,
	onAddClick,
	onRequestCancel,
	subscriptionId,
	subscriptionStartDate,
	subscriptionCurrentPeriodEnd,
	onSaveCreditGrant,
	isAddModalOpen,
	onAddModalOpenChange,
	creditGrantToCancel,
	onConfirmCancelCreditGrant,
	onCloseCancelModal,
}) => {
	const { t } = useTranslation('common');
	const addDisabled = isAddDisabled || readOnly;

	const columns: ColumnData<CreditGrant>[] = useMemo(
		() => [
			{
				title: 'Name',
				render: (row) => <span>{row.name}</span>,
			},
			{
				title: 'Credits',
				render: (row) => <span>{formatAmount(row.credits.toString())}</span>,
			},
			{
				title: 'Priority',
				render: (row) => <span>{row.priority ?? t('labels.na')}</span>,
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
				title: 'Expiration Config',
				render: (row) => <span>{formatExpirationPeriod(row)}</span>,
			},
			{
				fieldVariant: 'interactive' as const,
				width: '30px',
				hideOnEmpty: true,
				render: (row) => (
					<ActionButton
						id={row.id}
						copyId={{ entityType: 'Credit Grant' }}
						deleteMutationFn={async () => {}}
						refetchQueryKey='creditGrants'
						entityName={row.name}
						edit={{ enabled: false }}
						archive={{ enabled: false }}
						customActions={[
							{
								text: t('actions.delete'),
								onClick: () => onRequestCancel(row),
								enabled: !readOnly,
							},
						]}
					/>
				),
			},
		],
		[onRequestCancel, readOnly],
	);

	return (
		<>
			{creditGrants.length > 0 ? (
				<Card variant='notched'>
					<div className='flex items-center justify-between mb-4'>
						<FormHeader title={t('labels.creditGrants')} variant='sub-header' titleClassName='font-semibold' className='mb-0' />
						<AddButton onClick={onAddClick} disabled={addDisabled} />
					</div>
					<div className='mt-4'>
						<FlexpriceTable showEmptyRow={false} data={creditGrants} columns={columns} variant='no-bordered' />
					</div>
				</Card>
			) : (
				<NoDataCard
					title={t('labels.creditGrants')}
					subtitle='No credit grants added to this subscription yet'
					cta={<AddButton onClick={onAddClick} disabled={addDisabled} />}
				/>
			)}

			<EditSubscriptionCreditGrantModal
				isOpen={isAddModalOpen}
				onOpenChange={onAddModalOpenChange}
				onSave={onSaveCreditGrant}
				onCancel={() => onAddModalOpenChange(false)}
				subscriptionId={subscriptionId}
				subscriptionStartDate={subscriptionStartDate}
				subscriptionCurrentPeriodEnd={subscriptionCurrentPeriodEnd}
			/>

			<CancelCreditGrantModal
				isOpen={creditGrantToCancel !== null}
				onOpenChange={(open) => !open && onCloseCancelModal()}
				onConfirm={onConfirmCancelCreditGrant}
				onCancel={onCloseCancelModal}
				creditGrant={creditGrantToCancel}
			/>
		</>
	);
};

export default SubscriptionEditCreditGrantsSection;
