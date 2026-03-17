import { Page } from '@/components/atoms';
import { FlatTabs } from '@/components/molecules';
import { InvoiceConfigSection } from './org/InvoiceConfigSection';
import { CustomerOnboardingSection } from './org/CustomerOnboardingSection';
import { WalletBalanceAlertConfigSection } from './org/WalletBalanceAlertConfigSection';
import { CustomAnalyticsConfigSection } from './org/CustomAnalyticsConfigSection';
import { CustomerPortalConfigSection } from './org/CustomerPortalConfigSection';

const OrgSettingsPage = () => {
	return (
		<Page heading='Org Settings' documentTitle='Org Settings' headingClassName='font-semibold text-2xl text-zinc-900'>
			<FlatTabs
				className='[&_.border-b]:border-gray-200'
				defaultValue='invoice_config'
				tabs={[
					{ value: 'invoice_config', label: 'Invoice', content: <InvoiceConfigSection /> },
					// { value: 'subscription_config', label: 'Subscriptions', content: <SubscriptionConfigSection /> },
					// { value: 'invoice_pdf_config', label: 'Invoice PDF', content: <InvoicePdfConfigSection /> },
					{ value: 'customer_onboarding', label: 'Customer onboarding', content: <CustomerOnboardingSection /> },
					{ value: 'wallet_balance_alert_config', label: 'Wallet alerts', content: <WalletBalanceAlertConfigSection /> },
					// {
					// 	value: 'prepare_processed_events_config',
					// 	label: 'Prepare processed events',
					// 	content: <PrepareProcessedEventsConfigSection />,
					// },
					{ value: 'custom_analytics_config', label: 'Custom analytics', content: <CustomAnalyticsConfigSection /> },
					{ value: 'customer_portal_config', label: 'Customer portal', content: <CustomerPortalConfigSection /> },
				]}
			/>
		</Page>
	);
};

export default OrgSettingsPage;
