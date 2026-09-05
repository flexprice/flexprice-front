import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Dialog } from '@/components/atoms';
import { openPaymentUrl } from '@/utils/common/openPaymentUrl';
import { subscribeToCheckoutSettled } from '../useCheckoutReturn';
import { subscribeToCheckoutReturn } from '../checkoutHandoff';

interface CheckoutLinkDialogProps {
	url: string | null;
	onOpenChange: (open: boolean) => void;
	/**
	 * What the link leads to. Adding a card is not a payment, and telling a
	 * customer to "complete your payment" when no money is involved is wrong.
	 */
	purpose?: 'payment' | 'setup';
}

/**
 * Fallback for a hosted-checkout hand-off.
 *
 * The portal may be embedded in an iframe or opened where a programmatic redirect
 * is blocked, in which case the customer would be stranded with no way to pay.
 * Showing the URL leaves them a link they can open or copy by hand.
 */
const CheckoutLinkDialog = ({ url, onOpenChange, purpose = 'payment' }: CheckoutLinkDialogProps) => {
	const { t } = useTranslation('customer-portal');

	// Held in a ref so an inline callback from the caller does not resubscribe on
	// every render.
	const onOpenChangeRef = useRef(onOpenChange);
	onOpenChangeRef.current = onOpenChange;

	// The customer pays in another tab and comes back to a refreshed balance with
	// "Complete your payment" still sitting over it.
	//
	// Two signals, because either one alone leaves a gap. The outcome is
	// authoritative but only arrives if this tab is still polling — it gives up
	// after ~40s, and a customer can easily spend longer on the provider's page.
	// The return announcement always arrives the moment they come back, whatever
	// the outcome, and by then this dialog is pointing at a checkout they have
	// finished with either way.
	useEffect(() => subscribeToCheckoutReturn(() => onOpenChangeRef.current(false)), []);

	useEffect(
		() =>
			subscribeToCheckoutSettled((status) => {
				if (status === 'completed') onOpenChangeRef.current(false);
			}),
		[],
	);

	const copy = async () => {
		if (!url) return;
		try {
			await navigator.clipboard.writeText(url);
			toast.success(t('checkoutLink.copied'));
		} catch {
			toast.error(t('checkoutLink.copyFailed'));
		}
	};

	return (
		<Dialog
			isOpen={url !== null}
			onOpenChange={onOpenChange}
			title={t(`checkoutLink.${purpose}Title`)}
			description={t(`checkoutLink.${purpose}Description`)}>
			{url && (
				<div className='space-y-3'>
					<p className='text-xs break-all rounded-md p-3 bg-surface-subtle text-content-secondary'>{url}</p>
					<div className='flex items-center gap-2'>
						<Button onClick={() => openPaymentUrl(url)} prefixIcon={<ExternalLink />}>
							{t(`checkoutLink.${purpose}Open`)}
						</Button>
						<Button variant='outline' onClick={copy} prefixIcon={<Copy />}>
							{t('checkoutLink.copy')}
						</Button>
					</div>
				</div>
			)}
		</Dialog>
	);
};

export default CheckoutLinkDialog;
