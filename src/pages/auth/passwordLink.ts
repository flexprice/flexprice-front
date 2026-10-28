import { AuthTab } from './authTabs';

/** Fragment key that carries a one-time password link's token. */
const TOKEN_KEY = 'token';

/**
 * Builds the link a member opens to set their password. The token goes after `#`,
 * so browsers never send it to a server and it stays out of server logs.
 */
export function buildPasswordLink(origin: string, token: string): string {
	return `${origin}/auth?tab=${AuthTab.SET_PASSWORD}#${TOKEN_KEY}=${encodeURIComponent(token)}`;
}

/** Reads the token from a link's fragment (`location.hash`); null when there is none. */
export function readPasswordLinkToken(hash: string): string | null {
	const token = new URLSearchParams(hash.replace(/^#/, '')).get(TOKEN_KEY)?.trim();
	return token ? token : null;
}

/** Formats a link's expiry with the time of day, in the viewer's locale and time zone. */
export function formatLinkExpiry(iso: string, locale: string): string {
	return new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}
