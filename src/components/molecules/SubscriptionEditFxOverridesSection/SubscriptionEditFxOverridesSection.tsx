import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import CustomerApi from '@/api/CustomerApi';
import FxOverridesSection from '@/components/molecules/FxOverridesSection';
import { PAGINATION_PREFIX } from '@/hooks/usePagination';
import type Customer from '@/models/Customer';
import { canSetSubscriptionFxRates, resolveBillingCurrency } from '@/utils/fx/subscriptionFx';

interface Props {
	subscriptionId: string;
	/** The subscription's (charge) currency. */
	currency: string;
	customerId: string;
	/** Set when another customer pays this subscription; their billing currency applies. */
	invoicingCustomerId?: string;
	subscriber?: Customer;
	readOnly: boolean;
}

/** Subscription-scope FX overrides on Edit Subscription: charge currency → the invoicing customer's billing currency. */
const SubscriptionEditFxOverridesSection = ({ subscriptionId, currency, customerId, invoicingCustomerId, subscriber, readOnly }: Props) => {
	const { t } = useTranslation('customers');
	const paidByOther = !!invoicingCustomerId && invoicingCustomerId !== customerId;

	const { data: invoicingCustomer } = useQuery({
		queryKey: ['subscription-invoicing-customer', invoicingCustomerId],
		queryFn: () => CustomerApi.getCustomerById(invoicingCustomerId!),
		enabled: paidByOther,
	});

	const billingCustomer = paidByOther ? invoicingCustomer : subscriber;
	const billingCurrency = resolveBillingCurrency(currency, [billingCustomer]);
	const canAdd = canSetSubscriptionFxRates(currency, billingCurrency);

	return (
		<FxOverridesSection
			scope='subscription'
			scopeId={subscriptionId}
			paginationPrefix={PAGINATION_PREFIX.SUBSCRIPTION_FX_OVERRIDES}
			emptyText={t('subscriptionEdit.fxOverrides.empty')}
			hint={canAdd ? t('subscriptionEdit.fxOverrides.hint') : undefined}
			readOnly={readOnly}
			canAdd={canAdd}
			lockedFrom={canAdd ? currency : undefined}
			lockedTo={billingCurrency}
			hideWhenEmpty
			layout='card'
		/>
	);
};

export default SubscriptionEditFxOverridesSection;
