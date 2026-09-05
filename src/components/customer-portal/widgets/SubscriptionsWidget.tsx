import { Chip } from '@/components/atoms';
import { Subscription, SUBSCRIPTION_STATUS } from '@/models/Subscription';
import { formatDateShort } from '@/utils/common/helper_functions';
import { Repeat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmptyState from '../EmptyState';
import PortalSection from '../PortalSection';
import PortalRow, { PortalRows } from '../PortalRow';

interface SubscriptionsWidgetProps {
	subscriptions: Subscription[];
	label?: string;
}

const SUBSCRIPTION_CHIP_VARIANT: Record<SUBSCRIPTION_STATUS, 'success' | 'warning' | 'info' | 'default' | 'failed'> = {
	[SUBSCRIPTION_STATUS.ACTIVE]: 'success',
	[SUBSCRIPTION_STATUS.TRIALING]: 'info',
	[SUBSCRIPTION_STATUS.CANCELLED]: 'failed',
	[SUBSCRIPTION_STATUS.INCOMPLETE]: 'warning',
	[SUBSCRIPTION_STATUS.DRAFT]: 'default',
};

const SubscriptionsWidget = ({ subscriptions, label }: SubscriptionsWidgetProps) => {
	const { t } = useTranslation('customer-portal');

	const activeSubscriptions =
		subscriptions?.filter(
			(sub) => sub.subscription_status === SUBSCRIPTION_STATUS.ACTIVE || sub.subscription_status === SUBSCRIPTION_STATUS.TRIALING,
		) || [];

	if (activeSubscriptions.length === 0) {
		return (
			<PortalSection icon={<Repeat />} title={label || t('subscriptions.title')}>
				<EmptyState icon={<Repeat />} title={t('subscriptions.emptyTitle')} description={t('subscriptions.emptyDescription')} />
			</PortalSection>
		);
	}

	return (
		<PortalSection
			flush
			icon={<Repeat />}
			title={label || t('subscriptions.title')}
			meta={t('subscriptions.count', { count: activeSubscriptions.length })}>
			<PortalRows>
				{activeSubscriptions.map((subscription) => {
					// One line, · separated: the period and the next charge are a single fact
					// about the subscription, not two findings deserving an icon and a column each.
					const meta = [
						`${formatDateShort(subscription.current_period_start)} – ${formatDateShort(subscription.current_period_end)}`,
						subscription.subscription_status === SUBSCRIPTION_STATUS.ACTIVE &&
							t('subscriptions.nextBilling', { date: formatDateShort(subscription.current_period_end) }),
						subscription.subscription_status === SUBSCRIPTION_STATUS.TRIALING &&
							subscription.trial_end &&
							t('subscriptions.trialEnds', { date: formatDateShort(subscription.trial_end) }),
					]
						.filter(Boolean)
						.join(' · ');

					return (
						<PortalRow
							key={subscription.id}
							title={subscription.plan?.name || t('subscriptions.unknownPlan')}
							meta={meta}
							trailing={
								<Chip
									label={t(`subscriptionStatus.${subscription.subscription_status}`)}
									variant={SUBSCRIPTION_CHIP_VARIANT[subscription.subscription_status] ?? 'default'}
								/>
							}
						/>
					);
				})}
			</PortalRows>
		</PortalSection>
	);
};

export default SubscriptionsWidget;
