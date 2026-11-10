import { useState } from 'react';
import type { PaymentAction, SetupAction } from '@/types/dto/CustomerPortalBilling';
import { goToCheckout } from '@/components/customer-portal/goToCheckout';

/**
 * Follows a payment or setup action and keeps the URL visible.
 *
 * The open happens in an async callback after the API responds, not directly in
 * the customer's click, which is what popup blockers stop. So the URL is also
 * surfaced for the caller to display — a blocked redirect must stay recoverable.
 *
 * An action with no URL is a legitimate outcome: `use_saved_method` can settle a
 * charge outright, and a provider that vaults server-to-server returns type
 * 'none'. Callers should refresh rather than wait for a redirect.
 */
const usePaymentAction = () => {
	const [actionUrl, setActionUrl] = useState<string | null>(null);

	const follow = (action?: PaymentAction | SetupAction | null): boolean => {
		const url = action?.url;
		if (!url) return false;
		setActionUrl(url);
		goToCheckout(url);
		return true;
	};

	return { actionUrl, follow, clearActionUrl: () => setActionUrl(null) };
};

export default usePaymentAction;
