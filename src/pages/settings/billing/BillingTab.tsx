import CustomCurrencyConfigurationSection from './CustomCurrencyConfigurationSection';
import InvoiceConfigurationSection from './InvoiceConfigurationSection';
import SubscriptionConfigurationSection from './SubscriptionConfigurationSection';

const BillingTab = () => {
	return (
		<div className='flex flex-col gap-6'>
			<InvoiceConfigurationSection />
			<SubscriptionConfigurationSection />
			<CustomCurrencyConfigurationSection />
		</div>
	);
};

export default BillingTab;
