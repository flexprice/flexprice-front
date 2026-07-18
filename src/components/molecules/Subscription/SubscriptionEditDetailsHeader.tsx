import { FC, useMemo } from 'react';
import { Spacer, Button, Tooltip } from '@/components/atoms';
import { DetailsCard, UpdateSubscriptionDrawer } from '@/components/molecules';
import { getSubscriptionStatus } from '@/components/organisms/Subscription/SubscriptionTable';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import formatDate from '@/utils/common/format_date';
import { RouteNames } from '@/core/routes/Routes';
import { getTypographyClass } from '@/lib/typography';
import { Pencil, ExternalLink } from 'lucide-react';
import { Link } from 'react-router';
import type { SubscriptionResponse, UpdateSubscriptionRequest } from '@/types/dto/Subscription';
import { SUBSCRIPTION_STATUS } from '@/models/Subscription';
import { isInheritedSubscription } from '@/utils/subscription/isInheritedSubscription';
import { formatSubscriptionTypeDisplayLabel } from '@/utils/subscription/formatSubscriptionTypeDisplay';
import { useTranslation } from 'react-i18next';

/** Subscription edit page: details header and update drawer. */
export interface SubscriptionEditDetailsHeaderProps {
	subscription: SubscriptionResponse;
	subscriptionId: string;
	onUpdate: (payload: UpdateSubscriptionRequest) => void;
	isUpdating: boolean;
	updateDrawerOpen: boolean;
	onUpdateDrawerOpenChange: (open: boolean) => void;
}

const SubscriptionEditDetailsHeader: FC<SubscriptionEditDetailsHeaderProps> = ({
	subscription,
	subscriptionId,
	onUpdate,
	isUpdating,
	updateDrawerOpen,
	onUpdateDrawerOpenChange,
}) => {
	const { t } = useTranslation(['billing', 'common']);
	const subscriptionReadOnly = isInheritedSubscription(subscription);

	const detailsData = useMemo(
		() => [
			{ label: t('subscriptions.editDetailsHeader.plan'), value: subscription?.plan?.name },
			{
				label: t('subscriptions.editDetailsHeader.status'),
				value: getSubscriptionStatus(subscription?.subscription_status ?? '', t),
			},
			{
				label: t('subscriptions.editDetailsHeader.subscriptionType'),
				value: formatSubscriptionTypeDisplayLabel(subscription?.subscription_type),
			},
			{ label: t('subscriptions.editDetailsHeader.billingCycle'), value: subscription?.billing_cycle || t('common:labels.na') },
			{ label: t('subscriptions.editDetailsHeader.startDate'), value: formatDate(subscription?.start_date ?? '') },
			{ label: t('subscriptions.editDetailsHeader.currentPeriodEnd'), value: formatDate(subscription?.current_period_end ?? '') },
			...(subscription?.timezone?.trim() ? [{ label: t('subscriptions.editDetailsHeader.timezone'), value: subscription.timezone }] : []),
			...(subscription?.commitment_amount
				? [
						{
							label: t('subscriptions.editDetailsHeader.commitmentAmount'),
							value: `${getCurrencySymbol(subscription?.currency || '')} ${subscription?.commitment_amount}`,
						},
					]
				: []),
			...(subscription?.overage_factor && subscription?.overage_factor > 1
				? [{ label: t('subscriptions.editDetailsHeader.overageFactor'), value: subscription?.overage_factor.toString() }]
				: []),
			{
				label: t('subscriptions.editDetailsHeader.parentSubscription'),
				value: subscription?.parent_subscription_id ? (
					<Link
						to={`${RouteNames.subscriptions}/${subscription.parent_subscription_id}/edit`}
						className='inline-flex items-center text-sm gap-1.5 hover:underline transition-colors'>
						{subscription.parent_subscription_id}
						<ExternalLink className='w-3.5 h-3.5' />
					</Link>
				) : (
					t('subscriptions.editDetailsHeader.none')
				),
			},
		],
		[subscription, t],
	);

	return (
		<div>
			<Spacer className='!h-4' />
			<div className='flex justify-between items-center'>
				<h3 className={getTypographyClass('card-header') + ' !text-[16px]'}>{t('subscriptions.editDetailsHeader.title')}</h3>
				{subscription?.subscription_status !== SUBSCRIPTION_STATUS.CANCELLED && (
					<Tooltip
						delayDuration={0}
						content={
							subscriptionReadOnly
								? t('subscriptions.editDetailsHeader.inheritedReadOnlyTooltip')
								: t('subscriptions.editDetailsHeader.updateTooltip')
						}>
						<span className='inline-flex'>
							<Button
								variant='outline'
								size='icon'
								disabled={subscriptionReadOnly}
								onClick={() => !subscriptionReadOnly && onUpdateDrawerOpenChange(true)}
								title={
									subscriptionReadOnly
										? t('subscriptions.editDetailsHeader.inheritedReadOnlyTitle')
										: t('subscriptions.editDetailsHeader.updateTitle')
								}>
								<Pencil className='size-4' />
							</Button>
						</span>
					</Tooltip>
				)}
			</div>
			<Spacer className='!h-4' />
			<DetailsCard variant='stacked' data={detailsData} childrenAtTop cardStyle='borderless' />
			<UpdateSubscriptionDrawer
				open={updateDrawerOpen}
				onOpenChange={onUpdateDrawerOpenChange}
				subscriptionId={subscriptionId}
				subscription={subscription}
				onSave={onUpdate}
				isSaving={isUpdating}
				readOnly={subscriptionReadOnly}
			/>
		</div>
	);
};

export default SubscriptionEditDetailsHeader;
