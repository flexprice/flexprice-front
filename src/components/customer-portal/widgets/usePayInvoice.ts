import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { portalReturnUrl } from '../portalReturnUrl';
import type { PaymentGatewayType } from '@/types/dto/CustomerPortalBilling';
import usePortalIntegrations from '../usePortalIntegrations';
import { refreshAfterPayment } from '../refetchPortalQueries';
import { goToCheckout } from '@/components/customer-portal/goToCheckout';

/**
 * Starts payment for an invoice and follows the returned action.
 *
 * The amount comes from the invoice — a customer cannot part-pay — and paying
 * never vaults a card, so there is nothing to ask before submitting.
 *
 * The URL is surfaced as well as opened: the open runs in an async callback after
 * the request returns, not directly in the click, which is what popup blockers
 * stop. An action with no URL means the provider settled it outright.
 */
const usePayInvoice = (provider?: PaymentGatewayType) => {
	const { t } = useTranslation('customer-portal');
	const { defaultProviderFor } = usePortalIntegrations();
	// payment_link, not checkout: PayInvoice resolves on IntegrationCapabilityPaymentLink,
	// and a provider can host one without the other. Named explicitly because the
	// resolver refuses to guess between two capable gateways.
	const linkProvider = provider ?? defaultProviderFor('payment_link');
	const [actionUrl, setActionUrl] = useState<string | null>(null);
	// One key per invoice, so retrying a failed attempt dedups rather than raising
	// a second payment against the same invoice.
	const [keys] = useState(() => new Map<string, string>());

	const mutation = useMutation({
		mutationFn: (invoiceId: string) => {
			if (!keys.has(invoiceId)) keys.set(invoiceId, crypto.randomUUID());
			return CustomerPortalApi.payInvoice(invoiceId, {
				// Same ambiguity rule as top-up: the resolver refuses when more than one
				// provider qualifies, so the choice is made here rather than left unset.
				...(linkProvider ? { payment_provider: linkProvider } : {}),
				idempotency_key: keys.get(invoiceId),
				success_url: portalReturnUrl(),
				cancel_url: portalReturnUrl(),
			});
		},
		onSuccess: async (response, invoiceId) => {
			const url = response.payment_action?.url;
			if (url) {
				setActionUrl(url);
				goToCheckout(url);
				return;
			}
			keys.delete(invoiceId);
			toast.success(t('toast.invoicePaymentStarted'));
			await refreshAfterPayment(['portal-invoice']);
		},
		onError: (error: Error) => toast.error(error.message || t('errors.payInvoice')),
	});

	return {
		payInvoice: mutation.mutate,
		isPaying: mutation.isPending,
		payingInvoiceId: mutation.isPending ? (mutation.variables ?? null) : null,
		checkoutUrl: actionUrl,
		clearCheckoutUrl: () => setActionUrl(null),
	};
};

export default usePayInvoice;
