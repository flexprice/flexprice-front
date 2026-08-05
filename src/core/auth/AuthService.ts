import { config, usesBackendAuth } from '@/config/config';
import supabase from '../services/supbase/config';
import { RouteNames } from '../routes/Routes';

const isBackendAuth = () => usesBackendAuth(config.app.env, config.auth.provider);

class AuthService {
	public static async getAcessToken() {
		if (!isBackendAuth()) {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			return session?.access_token;
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
		if (!isBackendAuth()) {
			const { data } = await supabase.auth.getUser();
			return data.user;
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
		if (!isBackendAuth()) {
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
