import CustomCurrencyConfigurationSection from './CustomCurrencyConfigurationSection';
import GlobalForexRatesSection from './GlobalForexRatesSection';
import InvoiceConfigurationSection from './InvoiceConfigurationSection';
import SubscriptionConfigurationSection from './SubscriptionConfigurationSection';
import TaxConfigurationSection from './TaxConfigurationSection';

const BillingTab = () => {
	return (
		<div className='flex flex-col gap-6'>
			<InvoiceConfigurationSection />
			<SubscriptionConfigurationSection />
			<TaxConfigurationSection />
			<CustomCurrencyConfigurationSection />
			<GlobalForexRatesSection />
		</div>
	);
};

export default BillingTab;
