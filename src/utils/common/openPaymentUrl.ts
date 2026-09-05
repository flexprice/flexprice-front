/**
 * Schemes we will hand to the browser. Payment and setup URLs arrive as
 * unconstrained strings from an API response, and `window.open` *executes* a
 * `javascript:` URL — `noopener,noreferrer` isolates the new context but does not
 * stop the navigation being evaluated. So the scheme is checked, not assumed.
 */
const ALLOWED_PROTOCOLS = ['https:', 'http:'];

/** Hosts where plain http is a local gateway rather than a payment page in the clear. */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);

/**
 * True when a URL is safe to navigate to.
 *
 * http is allowed only for local development gateways. A payment page reached
 * over http anywhere else puts the customer's card details on the wire in
 * cleartext, and the URL comes from an API response rather than from us.
 */
export const isSafePaymentUrl = (url: string): boolean => {
	if (!url) return false;
	try {
		const parsed = new URL(url, window.location.origin);
		if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) return false;
		return parsed.protocol === 'https:' || LOCAL_HOSTS.has(parsed.hostname);
	} catch {
		// Not parseable as a URL at all — refuse rather than hand it to the browser.
		return false;
	}
};

/**
 * Opens a payment link in a new tab, reporting whether the browser allowed it.
 *
 * Payment links are created by an API call, so the open happens in an async
 * callback rather than directly in the user's click — which is exactly what popup
 * blockers stop. Callers must therefore keep showing the URL so a blocked open
 * leaves the user able to continue by hand.
 */
export const openPaymentUrl = (url: string): boolean => {
	if (!isSafePaymentUrl(url)) return false;
	try {
		const opened = window.open(url, '_blank', 'noopener,noreferrer');
		return !!opened;
	} catch {
		return false;
	}
};

/**
 * Same guard for a full-page navigation. Returns false when the URL was refused,
 * so callers can surface an error instead of silently doing nothing.
 */
export const navigateToPaymentUrl = (url: string): boolean => {
	if (!isSafePaymentUrl(url)) return false;
	window.location.href = url;
	return true;
};
