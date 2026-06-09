import { useTranslation } from 'react-i18next';
import { Page } from '@/components/atoms';
import { FlatTabs } from '@/components/molecules';
import { TeamTab } from './team';
import { BillingTab } from './billing';
import { CustomerPortalTab } from './customer-portal';
import { CustomerOnboardingTab } from './customer-onboarding';
import { AlertsTab } from './alerts';

const SettingsDashboard = () => {
	const { t } = useTranslation(['settings', 'common']);

	return (
		<Page heading={t('page.settings')} documentTitle={t('page.settings')} headingClassName='font-semibold text-2xl text-foreground'>
			<FlatTabs
				className='[&_.border-b]:border-border'
				tabs={[
					{
						value: 'team',
						label: t('members.tabs.team'),
						content: <TeamTab />,
					},
					{
						value: 'billing',
						label: t('billing.tabs.billing'),
						content: <BillingTab />,
					},
					{
						value: 'customer-portal',
						label: t('customerPortal.tabs.customerPortal'),
						content: <CustomerPortalTab />,
					},
					{
						value: 'customer-onboarding',
						label: t('customerOnboarding.tabs.customerOnboarding'),
						content: <CustomerOnboardingTab />,
					},
					{
						value: 'alerts',
						label: t('alerts.tabs.alerts'),
						content: <AlertsTab />,
					},
				]}
				defaultValue='team'
			/>
		</Page>
	);
};

export default SettingsDashboard;
