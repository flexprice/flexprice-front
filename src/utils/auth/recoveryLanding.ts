/**
 * Remembers, at page load, whether this browser arrived from a password-reset
 * email.
 *
 * This has to be captured eagerly rather than read when it is needed. supabase-js
 * is configured with `detectSessionInUrl` left at its default, so it consumes the
 * `#access_token=…&type=recovery` fragment GoTrue appends and then strips the
 * fragment from the URL. Any component reading `window.location.hash` during
 * render may therefore find it already gone.
 *
 * `initRecoveryLanding` is called from `main.tsx` before the app renders and
 * before that async consumption can run, so the answer is stable afterwards.
 *
 * This is a safety net, not the primary mechanism. The reset email points at
 * `RouteNames.resetPassword`, and a *path* is never stripped or dropped — it
 * survives even GoTrue's fallback to the Site URL being misconfigured. The net
 * exists for links already sitting in inboxes, which point at a query parameter
 * instead and can lose it.
 */
let arrivedFromRecoveryLink = false;

/** Reads the recovery marker out of the URL fragment, if GoTrue left one. */
function detectRecoveryFragment(): boolean {
	try {
		const hash = window.location.hash.replace(/^#/, '');
		if (!hash) return false;
		return new URLSearchParams(hash).get('type') === 'recovery';
	} catch {
		// A malformed fragment is not a recovery landing, and must not take the
		// app down on startup.
		return false;
	}
}

/** Call once, as early as possible, before the app renders. */
export function initRecoveryLanding(): void {
	arrivedFromRecoveryLink = detectRecoveryFragment();
}

/**
 * Whether this page load began with a password-recovery link.
 *
 * Stays true for the life of the page: the fragment is gone after supabase-js
 * consumes it, but the user is still in the middle of resetting a password.
 */
export function isPasswordRecoveryLanding(): boolean {
	return arrivedFromRecoveryLink;
}

/** Test-only reset, so one spec's captured state cannot leak into the next. */
export function resetRecoveryLandingForTests(): void {
	arrivedFromRecoveryLink = false;
}
