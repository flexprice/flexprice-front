import { useEffect, useState } from 'react';
import { announceCheckoutReturn, consumeCheckoutReturnLoad } from './checkoutHandoff';

/** How long to wait for the browser to honour window.close() before giving up. */
const CLOSE_GRACE_MS = 800;

/**
 * Breathing room between announcing and tearing this context down.
 *
 * postMessage only queues delivery, and window.close() destroys the context that
 * queued it — closing in the same tick can drop the message, leaving the tab the
 * customer started from none the wiser and its hand-off dialog still open over a
 * payment that is already done.
 */
const ANNOUNCE_SETTLE_MS = 150;

/**
 * On a provider redirect landing, hand the result to the tab the customer started
 * from and close this one.
 *
 * Returns true while the handoff is in flight so the caller can render nothing
 * rather than flashing a second copy of the portal — or, worse, the invalid-link
 * card — in a tab that is about to disappear.
 *
 * The close is only a request: browsers permit it for script-opened windows, and
 * this tab may instead be a link the customer opened themselves. If it is still
 * here after the grace period, the flag drops and the portal renders as usual.
 */
interface CheckoutTabHandoff {
	/** True while this tab is trying to close; render nothing meanwhile. */
	isHandingOff: boolean;
	/** True for the whole life of a load that arrived back from a provider. */
	wasCheckoutReturn: boolean;
}

const useCheckoutTabHandoff = (): CheckoutTabHandoff => {
	// Read synchronously during the first render: an effect would let the page
	// paint before the marker is consumed.
	const [wasCheckoutReturn] = useState(() => consumeCheckoutReturnLoad());
	const [isHandingOff, setIsHandingOff] = useState(wasCheckoutReturn);

	useEffect(() => {
		if (!isHandingOff) return;
		announceCheckoutReturn();
		const closeTimer = window.setTimeout(() => {
			try {
				window.close();
			} catch {
				// Refused — the give-up timer below renders the portal instead.
			}
		}, ANNOUNCE_SETTLE_MS);
		const giveUpTimer = window.setTimeout(() => setIsHandingOff(false), CLOSE_GRACE_MS);
		return () => {
			window.clearTimeout(closeTimer);
			window.clearTimeout(giveUpTimer);
		};
	}, [isHandingOff]);

	return { isHandingOff, wasCheckoutReturn };
};

export default useCheckoutTabHandoff;
