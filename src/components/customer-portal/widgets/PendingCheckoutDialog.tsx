import { useTranslation } from 'react-i18next';
import { ExternalLink, RefreshCw } from 'lucide-react';
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
					<Button onClick={() => openPaymentUrl(url)} prefixIcon={<ExternalLink />} disabled={isStartingNew}>
						{t('pendingCheckout.continueExisting')}
					</Button>
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
