import { NODE_ENV, NodeEnv } from '@/types/env';
import supabase from '../services/supbase/config';

class AuthService {
	public static async getAcessToken() {
		if (NODE_ENV != NodeEnv.SELF_HOSTED) {
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
		if (NODE_ENV != NodeEnv.SELF_HOSTED) {
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
		window.location.href = '/auth';
		if (NODE_ENV != NodeEnv.SELF_HOSTED) {
			await supabase.auth.signOut();
		}
		localStorage.clear();
	}
}

export default AuthService;
