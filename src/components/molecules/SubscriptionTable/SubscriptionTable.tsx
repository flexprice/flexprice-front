import { FC, useState, useMemo } from 'react';
import { ActionButton, Chip, Tooltip } from '@/components/atoms';
import FlexpriceTable, { ColumnData } from '../Table';
import formatDate from '@/utils/common/format_date';
import { Subscription, SUBSCRIPTION_STATUS } from '@/models/Subscription';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import RedirectCell from '../Table/RedirectCell';
import { Trash2 } from 'lucide-react';
import { SubscriptionResponse } from '@/types/dto/Subscription';
import SubscriptionCancelDialog from '@/components/molecules/SubscriptionCancelDialog/SubscriptionCancelDialog';
import { isInheritedSubscription } from '@/utils/subscription/isInheritedSubscription';
import { useTranslation } from 'react-i18next';

interface Props {
	data: Subscription[];
	onEdit?: (subscription: Subscription) => void;
}
const SubscriptionTable: FC<Props> = ({ data, onEdit }) => {
	const { t } = useTranslation(['billing', 'common']);
	const navigate = useNavigate();
	const [cancelSubscription, setCancelSubscription] = useState<{ id: string; currentPeriodStart: string } | null>(null);

	const getSubscriptionStatusChip = (status: SUBSCRIPTION_STATUS) => {
		switch (status) {
			case SUBSCRIPTION_STATUS.ACTIVE:
				return <Chip variant='success' label={t('common:status.active')} />;
			case SUBSCRIPTION_STATUS.CANCELLED:
				return <Chip variant='failed' label={t('common:status.cancelled')} />;
			case SUBSCRIPTION_STATUS.INCOMPLETE:
				return <Chip variant='warning' label={t('common:status.incomplete')} />;
			case SUBSCRIPTION_STATUS.TRIALING:
				return <Chip variant='warning' label={t('common:status.trialing')} />;
			case SUBSCRIPTION_STATUS.DRAFT:
				return <Chip variant='warning' label={t('common:status.draft')} />;
			default:
				return <Chip variant='default' label={t('common:status.inactive')} />;
		}
	};

	const columns: ColumnData<SubscriptionResponse>[] = useMemo(
		() => [
			{
				title: t('subscriptions.listPage.columns.customer'),
				render: (row) => (
					<RedirectCell redirectUrl={`${RouteNames.customers}/${row.customer_id}`}>{row.customer?.name || row.customer_id}</RedirectCell>
				),
			},
			{
				title: t('subscriptions.listPage.columns.plan'),
				render: (row) => <RedirectCell redirectUrl={`${RouteNames.plan}/${row.plan_id}`}>{row.plan?.name || row.plan_id}</RedirectCell>,
			},

			{
				title: t('subscriptions.listPage.columns.status'),
				render: (row) => {
					const label = getSubscriptionStatusChip(row.subscription_status);
					return label;
				},
			},
			{
				title: t('subscriptions.listPage.columns.startDate'),
				render: (row) => formatDate(row.start_date),
			},
			{
				title: t('subscriptions.listPage.columns.renewalDate'),
				render: (row) => formatDate(row.current_period_end),
			},
			{
				fieldVariant: 'interactive',
				render: (row) => {
					if (isInheritedSubscription(row)) {
						return (
							<Tooltip delayDuration={0} content={t('subscriptions.listPage.inheritedReadOnlyTooltip')}>
								<span className='inline-flex cursor-default text-muted-foreground tabular-nums'>—</span>
							</Tooltip>
						);
					}
					return (
						<ActionButton
							id={row.id}
							copyId={{ entityType: 'Subscription' }}
							deleteMutationFn={async () => Promise.resolve()}
							refetchQueryKey='fetchSubscriptions'
							entityName={t('subscriptions.listPage.entityNameForActions')}
							edit={{
								path: `${RouteNames.subscriptions}/${row.id}/edit`,
								onClick: () => onEdit?.(row),
							}}
							archive={{
								enabled: false,
							}}
							customActions={[
								{
									text: t('subscriptions.listPage.cancelAction'),
									icon: <Trash2 />,
									enabled: row.subscription_status !== SUBSCRIPTION_STATUS.CANCELLED,
									onClick: () => setCancelSubscription({ id: row.id, currentPeriodStart: row.current_period_start }),
								},
							]}
						/>
					);
				},
			},
		],
		[t, onEdit],
	);

	return (
		<>
			<FlexpriceTable
				showEmptyRow
				columns={columns}
				data={data}
				onRowClick={(row) => {
					navigate(`${RouteNames.customers}/${row?.customer_id}/subscription/${row?.id}`);
				}}
			/>
			<SubscriptionCancelDialog
				isOpen={!!cancelSubscription}
				onOpenChange={(open) => {
					if (!open) {
						setCancelSubscription(null);
					}
				}}
				subscriptionId={cancelSubscription?.id}
				currentPeriodStart={cancelSubscription?.currentPeriodStart}
				refetchQueryKeys={['fetchSubscriptions']}
			/>
		</>
	);
};

export default SubscriptionTable;
