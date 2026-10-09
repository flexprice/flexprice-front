import { AuthTab, RESET_PASSWORD_PATH } from './authTabs';

export interface AuthTabSignals {
	/** `location.pathname`. */
	pathname: string;
	/** `location.search`, including the leading `?`. */
	search: string;
	/** Whether this page load began with a recovery link — see `recoveryLanding`. */
	isRecoveryLanding: boolean;
	/** `config.platform.signup.enabled`. */
	signupEnabled: boolean;
}

/**
 * Decides which form the auth page shows, from three independent signals.
 *
 * Kept pure and separate from the component so the precedence below is
 * assertable without mounting the whole branded template tree.
 */
export function resolveAuthTab({ pathname, search, isRecoveryLanding, signupEnabled }: AuthTabSignals): AuthTab {
	// A recovery arrival outranks everything else, by either signal.
	//
	// The path is how current reset emails arrive. The fragment marker is the
	// fallback for links sent before that change, and for any case where GoTrue
	// substituted the Site URL and the path was lost with it — without this, such
	// a landing reads as an ordinary visit to a page the user is already
	// authenticated for, and they get silently signed in instead of being asked
	// for a new password.
	if (isRecoveryLanding || pathname === RESET_PASSWORD_PATH) {
		return AuthTab.RESET_PASSWORD;
	}

	const tab = new URLSearchParams(search).get('tab');

	// Signup being disabled is not an error here — fall back to login and let the
	// component decide whether to rewrite the URL.
	if (tab === AuthTab.SIGNUP) {
		return signupEnabled ? AuthTab.SIGNUP : AuthTab.LOGIN;
	}

	// `?tab=reset-password` is still honoured for links already in inboxes.
	if (tab === AuthTab.FORGOT_PASSWORD || tab === AuthTab.RESET_PASSWORD) {
		return tab as AuthTab;
	}

	return AuthTab.LOGIN;
}
