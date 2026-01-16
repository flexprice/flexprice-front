import { IS_PROD } from '@/types';
import supabase from '@/core/services/supbase/config';
import { RouteNames } from '@/core/routes/Routes';

class AuthService {
	public static async getAcessToken() {
		if (!IS_PROD) {
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
		if (!IS_PROD) {
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

	public static async logout() {
		if (!IS_PROD) {
			await supabase.auth.signOut();
		}
		localStorage.clear();
		window.location.href = RouteNames.login;
	}
}

export default AuthService;
