import CustomCurrencyConfigurationSection from './CustomCurrencyConfigurationSection';
import GlobalForexRatesSection from './GlobalForexRatesSection';
import InvoiceConfigurationSection from './InvoiceConfigurationSection';
import SubscriptionConfigurationSection from './SubscriptionConfigurationSection';

const BillingTab = () => {
	return (
		<div className='flex flex-col gap-6'>
			<InvoiceConfigurationSection />
			<SubscriptionConfigurationSection />
			<CustomCurrencyConfigurationSection />
			<GlobalForexRatesSection />
		</div>
	);
};

export default BillingTab;
