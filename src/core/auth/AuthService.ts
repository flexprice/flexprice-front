import { config, APP_ENV } from '@/config/config';
import { WHATS_NEW_DISMISSALS_STORAGE_KEY } from '@/utils/whatsNew/whatsNewDismissal';
import supabase from '../services/supbase/config';
import { RouteNames } from '../routes/Routes';

/**
 * Reads the locally stored session, which is what both a self-hosted login and a
 * completed SAML assertion write.
 *
 * Returns null for anything unusable — absent, unparseable, or carrying no token
 * — so a corrupted entry falls through to the identity provider rather than
 * stranding the user with no way to authenticate.
 */
function readStoredSession(): { token?: string; user?: unknown } | null {
	try {
		const stored = localStorage.getItem('token');
		if (!stored) return null;
		const parsed = JSON.parse(stored);
		if (!parsed || typeof parsed.token !== 'string' || parsed.token === '') return null;
		return parsed;
	} catch {
		return null;
	}
}

class AuthService {
	/**
	 * A locally stored token wins wherever one exists, in any environment.
	 *
	 * SAML is configured per tenant, so a hosted deployment backed by Supabase may
	 * still serve tenants that sign in through an identity provider. Choosing the
	 * source from the environment alone meant that on such a deployment a
	 * completed SSO login was ignored: the assertion validated, the backend minted
	 * a token, the callback stored it, and every request afterwards asked Supabase
	 * for a session that was never created — so the dashboard loaded signed out
	 * with no indication of what had gone wrong.
	 *
	 * Preferring the stored token is safe for the Supabase path because only a
	 * completed login writes it: the SAML callback stores it after the backend has
	 * validated the assertion, and logout clears it.
	 */
	public static async getAcessToken() {
		const stored = readStoredSession();
		if (stored) return stored.token;

		if (config.app.env !== APP_ENV.SelfHosted) {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			return session?.access_token;
		}
		return null;
	}

	/**
	 * Mirrors getAcessToken so the user and the token always describe the same
	 * session — reading the token from SAML and the user from Supabase would
	 * otherwise report one identity while acting as another.
	 *
	 * A SAML session stores no user: the callback deliberately omits it, and
	 * callers load the user from /users/me against the token itself.
	 */
	public static async getUser() {
		const stored = readStoredSession();
		if (stored) return stored.user ?? null;

		if (config.app.env !== APP_ENV.SelfHosted) {
			const { data } = await supabase.auth.getUser();
			return data.user;
		}
		return null;
	}

	/**
	 * Keys that survive logout.
	 *
	 * Theme is a per-device display preference, not user data — it holds only the string 'light' or
	 * 'dark'. Wiping it means someone who picks dark mode is thrown back to light every time they
	 * sign out, which reads as the setting being broken.
	 *
	 * Anything holding user or session data must NOT be listed here; the blanket clear below is what
	 * keeps that guarantee.
	 */
	private static readonly PRESERVED_KEYS = ['flexprice_theme', WHATS_NEW_DISMISSALS_STORAGE_KEY];

	public static async logout() {
		if (config.app.env !== APP_ENV.SelfHosted) {
			await supabase.auth.signOut();
		}

		const preserved = AuthService.PRESERVED_KEYS.map((key) => [key, localStorage.getItem(key)] as const);
		localStorage.clear();
		for (const [key, value] of preserved) {
			if (value !== null) localStorage.setItem(key, value);
		}

		window.location.href = RouteNames.login;
	}
}

export default AuthService;
