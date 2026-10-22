/**
 * Query parameters that the removed "login link" feature used to carry.
 *
 * Adding a user returned a one-time password, and the team settings page offered
 * to copy it as a link to the login page carrying the email and the password as
 * query parameters — a working credential in a URL. A
 * URL is not a private channel: it lands in browser and shell history, in
 * `Referer` headers, in proxy, CDN and server access logs, and in the link
 * previews that chat apps generate by fetching it. The feature also wrote the
 * same URL into a downloadable CSV.
 *
 * The producer is gone, but links already sent cannot be recalled, so the login
 * page still has to cope with one arriving. It must not sign anyone in from it —
 * and it should not leave the password sitting in the address bar either.
 */
const CREDENTIAL_PARAMS = ['email', 'password'] as const;

/**
 * Removes the credential parameters from a query string.
 *
 * Returns the cleaned query string when at least one was present, or `null` when
 * there was nothing to remove — so a caller can skip rewriting the URL in the
 * ordinary case rather than replacing every history entry.
 *
 * The returned value has no leading `?`, matching `URLSearchParams.toString()`.
 */
export function stripCredentialParams(search: string): string | null {
	const params = new URLSearchParams(search);
	if (!CREDENTIAL_PARAMS.some((name) => params.has(name))) return null;
	for (const name of CREDENTIAL_PARAMS) params.delete(name);
	return params.toString();
}
