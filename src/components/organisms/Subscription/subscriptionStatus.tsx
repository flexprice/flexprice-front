import type { TFunction } from 'i18next';
import { Chip } from '@/components/atoms';
import { SUBSCRIPTION_STATUS } from '@/models/Subscription';

export const getSubscriptionStatus = (status: string, t: TFunction) => {
	switch (status) {
		case SUBSCRIPTION_STATUS.ACTIVE:
			return <Chip variant='success' label={t('common:status.active')} />;
		case SUBSCRIPTION_STATUS.PAUSED:
			return <Chip variant='warning' label={t('common:status.paused')} />;
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

export const formatSubscriptionStatus = (status: string, t: TFunction) => {
	switch (status) {
		case SUBSCRIPTION_STATUS.ACTIVE:
			return t('common:status.active');
		case SUBSCRIPTION_STATUS.PAUSED:
			return t('common:status.paused');
		case SUBSCRIPTION_STATUS.CANCELLED:
			return t('common:status.cancelled');
		case SUBSCRIPTION_STATUS.INCOMPLETE:
			return t('common:status.incomplete');
		case SUBSCRIPTION_STATUS.TRIALING:
			return t('common:status.trialing');
		case SUBSCRIPTION_STATUS.DRAFT:
			return t('common:status.draft');
		default:
			return t('common:status.inactive');
	}
};
