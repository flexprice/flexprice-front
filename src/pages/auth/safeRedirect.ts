/**
 * Accepts a `redirect` query parameter only when it points back into this app.
 *
 * The login page sends the browser wherever this returns. Without the check,
 * `/auth?redirect=https://evil.example` would be a link that looks like the
 * real login and lands the user on someone else's site the moment they sign in.
 *
 * Returns the normalised path when it stays on this origin, `null` otherwise.
 */
export function sanitizeRedirect(raw: string | null | undefined): string | null {
	if (!raw) return null;
	// Browsers drop tabs and line breaks and read `\` as `/`, which can turn a path into another site.
	if ([...raw].some((char) => char <= '\u001f' || char === '\u007f' || char === '\\')) return null;
	// Must be a path. Rules out `https://evil.example`, `javascript:...` and `//evil.example`.
	if (!raw.startsWith('/') || raw.startsWith('//')) return null;
	// No path this app issues carries a scheme, so one further in is refused too.
	if (raw.includes('://')) return null;

	// Check the URL the browser will use: dot segments collapse, so `/.//evil.example` becomes `//evil.example`.
	let url: URL;
	try {
		url = new URL(raw, window.location.origin);
	} catch {
		return null;
	}
	if (url.origin !== window.location.origin || url.pathname.startsWith('//')) return null;
	return url.pathname + url.search + url.hash;
}

/** sessionStorage key carrying `redirect` through Google sign-in; per tab, so nothing outlives it. */
export const RETURN_PATH_KEY = 'auth_return_path';
