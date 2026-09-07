import { CHECKOUT_RETURN_PARAM } from './checkoutHandoff';

/** Where the token is kept so a return trip can restore it without the URL. */
const TOKEN_STORAGE_KEY = 'flexprice.portal.sessionToken';

/**
 * Remember the session token so a return trip can restore it.
 *
 * localStorage, not sessionStorage: the provider is opened with
 * `noopener,noreferrer`, which starts a fresh browsing context that inherits no
 * session storage, and the customer is redirected back into *that* tab. A
 * tab-scoped token left the return landing with neither a URL token nor a stored
 * one, which the portal reads as an invalid link.
 *
 * Same-origin and no more exposed than the URL the token already arrives in.
 */
/**
 * How long a stored token stays recoverable.
 *
 * It exists only to survive a trip to a payment provider and back, which takes
 * minutes. Beyond that it is a credential sitting in a shared browser profile
 * with no reason to be there.
 */
const TOKEN_TTL_MS = 30 * 60 * 1000;

export const rememberSessionToken = (token: string) => {
	try {
		localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ token, storedAt: Date.now() }));
	} catch {
		// Blocked storage: the customer keeps the URL token and simply loses the
		// ability to return from a hosted checkout.
	}
};

/** Dropped once the session is no longer usable, so a stale token is not replayed. */
export const forgetSessionToken = () => {
	try {
		localStorage.removeItem(TOKEN_STORAGE_KEY);
	} catch {
		/* nothing to clear */
	}
};

/**
 * The stored token, if one is still within its lifetime.
 *
 * Callers must only reach for this on a checkout return — see
 * CustomerPortalWrapper. Handing it to any tokenless visit would let the next
 * person to open the portal on a shared browser act as the previous customer.
 */
export const recallSessionToken = (): string | null => {
	try {
		const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
		if (!raw) return null;
		const stored = JSON.parse(raw) as { token?: string; storedAt?: number };
		if (!stored?.token || typeof stored.storedAt !== 'number') {
			forgetSessionToken();
			return null;
		}
		if (Date.now() - stored.storedAt > TOKEN_TTL_MS) {
			forgetSessionToken();
			return null;
		}
		return stored.token;
	} catch {
		// Unreadable or from an older format that stored the bare token: drop it
		// rather than trusting a credential we cannot date.
		forgetSessionToken();
		return null;
	}
};

/**
 * Query parameters the portal owns and wants to survive a checkout round trip.
 *
 * An allowlist, not a denylist. Providers append their own result parameters to
 * the return URL — Razorpay `id` and `state`, others something else again — and
 * building the next return URL from the current one carried those back so the
 * provider appended a fresh pair beside them. After a few top-ups the URL read
 * `?id=…&state=succeeded&id=…&state=succeeded&…`. There is no fixed set of names
 * to strip, so only what we recognise is kept.
 */
const PRESERVED_PARAMS = ['section'];

/**
 * The URL a payment provider should send the customer back to.
 *
 * Deliberately not window.location.href. The portal authenticates from a `token`
 * query parameter, so the current URL carries the customer's session token.
 * Sending that as success_url hands the session to the provider, and from there
 * into its redirect logs, the referrer chain and browser history — anyone holding
 * the URL could act as that customer until it expires. The token is left out here
 * and restored from storage on return.
 *
 * A marker is added in its place so the returning tab knows it is a redirect
 * landing and can hand the result back to the tab the customer started from —
 * see checkoutHandoff.
 */
export const portalReturnUrl = (): string => {
	try {
		const current = new URL(window.location.href);
		// Rebuilt from the path rather than edited, so nothing unrecognised — the
		// token included — can survive by being forgotten about here.
		const url = new URL(current.pathname, current.origin);
		PRESERVED_PARAMS.forEach((name) => {
			const value = current.searchParams.get(name);
			if (value !== null) url.searchParams.set(name, value);
		});
		url.searchParams.set(CHECKOUT_RETURN_PARAM, '1');
		return url.toString();
	} catch {
		return `${window.location.origin}?${CHECKOUT_RETURN_PARAM}=1`;
	}
};
