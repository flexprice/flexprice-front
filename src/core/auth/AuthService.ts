import { config, APP_ENV } from '@/config/config';
import supabase from '../services/supbase/config';
import { RouteNames } from '../routes/Routes';

class AuthService {
	public static async getAcessToken() {
		if (config.app.env !== APP_ENV.SelfHosted) {
			try {
				const { data } = await supabase.auth.getSession();
				return data?.session?.access_token;
			} catch (error) {
				// Runs on every outgoing request via the axios interceptor — a network failure or a
				// misconfigured/unavailable Supabase client must not crash every API call. Falling
				// through to an unauthenticated request lets the backend reject it with a normal 401.
				console.error('Error getting access token:', error);
				return null;
			}
		} else {
			try {
				const tokenData = localStorage.getItem('token');
				if (!tokenData) return null;
				const parsedToken = JSON.parse(tokenData);
				return parsedToken.token;
			} catch (error) {
				console.error('Error parsing token:', error);
				return null;
			}
		}
	}

	public static async getUser() {
		if (config.app.env !== APP_ENV.SelfHosted) {
			try {
				const { data } = await supabase.auth.getUser();
				return data?.user ?? null;
			} catch (error) {
				console.error('Error getting user:', error);
				return null;
			}
		} else {
			try {
				const tokenData = localStorage.getItem('token');
				if (!tokenData) return null;
				const parsedToken = JSON.parse(tokenData);
				return parsedToken.user;
			} catch (error) {
				console.error('Error parsing user data:', error);
				return null;
			}
		}
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
	private static readonly PRESERVED_KEYS = ['flexprice_theme'];

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
