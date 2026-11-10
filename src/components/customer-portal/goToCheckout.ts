import { goToPaymentUrl } from '@/utils/common/openPaymentUrl';
import { markLeavingForCheckout } from './checkoutHandoff';

/**
 * Sends the customer to a provider's checkout, card form or confirmation page in
 * this tab. The provider returns them to the same tab, which restores the session
 * and follows the payment there, instead of a second portal opening beside it.
 */
export const goToCheckout = (url: string): boolean => goToPaymentUrl(url, markLeavingForCheckout);
