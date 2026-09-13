import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { Button, Dialog } from '@/components/atoms';
import { formatDateTime } from '@/utils/common/format_date';
import { openPaymentUrl } from '@/utils/common/openPaymentUrl';

interface PendingCheckoutSessionDialogProps {
	isOpen: boolean;
	/** The blocking session's id — the operator needs it to find the payment. */
	sessionId?: string;
	/** Hosted link for the blocking session, when it still has one to hand out. */
	paymentUrl?: string;
	expiresAt?: string;
	isSuperseding: boolean;
	onClose: () => void;
	/** Cancels the blocking session and creates a fresh checkout in its place. */
	onSupersede: () => void;
}

/**
 * Shown when a checkout top-up came back `failed_already_exists`.
 *
 * The API answers 200 here carrying the session already in flight, so without
 * this the operator would be handed someone else's live checkout link as if it
 * were the one they just created — and would hand it to the customer with the
 * wrong amount on it.
 *
 * Superseding is the secondary action on purpose: the pending session may be one
 * the customer is paying right now, and cancelling it mid-capture is the outcome
 * that costs money to unwind.
 */
const PendingCheckoutSessionDialog: FC<PendingCheckoutSessionDialogProps> = ({
	isOpen,
	sessionId,
	paymentUrl,
	expiresAt,
	isSuperseding,
	onClose,
	onSupersede,
}) => {
	const { t } = useTranslation('billing');

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={(open) => !open && onClose()}
			title={t('wallet.pendingCheckout.title')}
			titleClassName='text-lg font-semibold text-content-zinc-bold'
			// Passed as the dialog's own description rather than rendered as a child: it sits
			// inside the header instead of after the content wrapper's top margin (which is
			// what opened the gap under the title), and it becomes the aria-describedby target
			// the DialogContent was warning about. `!mt-2` overrides the atom's default mt-6.
			description={t('wallet.pendingCheckout.description')}
			descriptionClassName='!mt-2 text-sm text-content-muted'
			className='sm:max-w-[640px]'>
			<div className='space-y-4'>
				<div className='p-3 rounded-lg bg-surface-muted border border-line space-y-1.5'>
					{sessionId && (
						<p className='text-xs text-content-muted'>
							{t('wallet.pendingCheckout.sessionId')}: <span className='font-mono select-all'>{sessionId}</span>
						</p>
					)}
					{expiresAt && (
						<p className='text-xs text-content-muted'>
							{t('wallet.pendingCheckout.expiresAt')}: {formatDateTime(expiresAt)}
						</p>
					)}
					{/* Labelled like its two siblings, with select-all scoped to the URL itself so a
					    click-drag copies the link without picking up the label. */}
					{paymentUrl && (
						<p className='text-xs text-content-muted'>
							{t('wallet.pendingCheckout.link')}: <span className='font-mono break-all select-all'>{paymentUrl}</span>
						</p>
					)}
				</div>

				{/* No explicit "keep it" action: leaving the pending checkout alone is what
				    happens on dismiss, and the dialog's close control already says so. */}
				{/* Buttons are whitespace-nowrap, so a row too narrow for both wrapped the
				    primary onto its own line. Widened the dialog to fit them side by side and
				    dropped the wrap; below sm they stack full-width, primary first. */}
				<div className='flex flex-col-reverse gap-3 sm:flex-row'>
					{/* Only offered when the pending session actually has a link left to open —
					    a session charged against a saved card has none. */}
					{paymentUrl && (
						<Button
							variant='outline'
							onClick={() => openPaymentUrl(paymentUrl)}
							disabled={isSuperseding}
							// flex-auto, not flex-1: basis stays the label's own width, so the two
							// share the leftover space without the longer label being squeezed into
							// an equal half it does not fit in (Button is whitespace-nowrap).
							className='sm:flex-auto'
							prefixIcon={<ExternalLink className='w-4 h-4' />}>
							{t('wallet.pendingCheckout.openExisting')}
						</Button>
					)}
					<Button
						onClick={onSupersede}
						isLoading={isSuperseding}
						disabled={isSuperseding}
						className='sm:flex-auto'
						prefixIcon={<RefreshCw className='w-4 h-4' />}>
						{t('wallet.pendingCheckout.cancelAndRetry')}
					</Button>
				</div>
				<p className='text-xs text-content-muted'>{t('wallet.pendingCheckout.cancelHint')}</p>
			</div>
		</Dialog>
	);
};

export default PendingCheckoutSessionDialog;
