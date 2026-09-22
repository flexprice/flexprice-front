import { useTranslation } from 'react-i18next';
import { Copy, ExternalLink, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Dialog } from '@/components/atoms';
import { openPaymentUrl } from '@/utils/common/openPaymentUrl';
import type { PortalCheckoutSession } from '@/types/dto/CustomerPortalBilling';

interface PendingCheckoutDialogProps {
	/** The blocking session, or null when nothing is blocked. */
	session: PortalCheckoutSession | null;
	onOpenChange: (open: boolean) => void;
	/** Cancels the blocking session and starts a fresh one in its place. */
	onStartNew: () => void;
	isStartingNew?: boolean;
}

/**
 * Shown when a top-up came back `failed_already_exists`: an earlier payment for
 * this wallet is still open, so nothing was created for this request.
 *
 * Two exits, because either one alone strands someone. The customer who left the
 * provider's page open in another tab wants the payment they already started, and
 * resuming it is free. The customer who abandoned it — closed the tab, changed the
 * amount, wants a different card — would otherwise be stuck until the session
 * expires on its own, so they can supersede it.
 *
 * Resuming is the default action: superseding cancels a payment that may already
 * be mid-capture at the provider.
 */
const PendingCheckoutDialog = ({ session, onOpenChange, onStartNew, isStartingNew }: PendingCheckoutDialogProps) => {
	const { t } = useTranslation('customer-portal');
	const url = session?.payment_action?.url;

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
			isOpen={session !== null}
			onOpenChange={onOpenChange}
			title={t('pendingCheckout.title')}
			description={t('pendingCheckout.description')}>
			<div className='flex flex-col gap-3'>
				{/* A session with no action URL cannot be resumed from here — it was charged
				    against a saved card and there is nowhere to send the customer. Offering
				    a dead "continue" button would be worse than offering only the restart. */}
				{url ? (
					// The open runs in the async callback after the top-up call rather than in
					// the click, so a popup blocker will often stop it. The URL stays on screen
					// so the resume path — the one we want taken over cancelling a payment that
					// may be mid-capture — is still reachable by hand when that happens.
					<>
						<p className='text-xs break-all rounded-md p-3 bg-surface-subtle text-content-secondary'>{url}</p>
						<div className='flex items-center gap-2'>
							<Button onClick={() => openPaymentUrl(url)} prefixIcon={<ExternalLink />} disabled={isStartingNew}>
								{t('pendingCheckout.continueExisting')}
							</Button>
							<Button variant='outline' onClick={copy} prefixIcon={<Copy />} disabled={isStartingNew}>
								{t('checkoutLink.copy')}
							</Button>
						</div>
					</>
				) : (
					<p className='text-sm text-content-secondary'>{t('pendingCheckout.noLink')}</p>
				)}
				<Button variant='outline' onClick={onStartNew} isLoading={isStartingNew} disabled={isStartingNew} prefixIcon={<RefreshCw />}>
					{t('pendingCheckout.startNew')}
				</Button>
				<p className='text-xs text-content-tertiary'>{t('pendingCheckout.startNewHint')}</p>
			</div>
		</Dialog>
	);
};

export default PendingCheckoutDialog;
