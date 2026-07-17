import InvoiceConfigurationSection from './InvoiceConfigurationSection';
import SubscriptionConfigurationSection from './SubscriptionConfigurationSection';

const BillingTab = () => {
	return (
		<div className='flex flex-col gap-6'>
			<InvoiceConfigurationSection />
			<SubscriptionConfigurationSection />
		</div>
	);
};

export default BillingTab;
