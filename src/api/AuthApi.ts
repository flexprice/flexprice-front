import { AxiosClient } from '@/core/axios/verbs';
import { LoginData, LocalUser, SignupData } from '@/types/dto';

class AuthApi {
	private static baseUrl = '/auth';

	public static async login(email: string, password: string) {
		return await AxiosClient.post<LocalUser>(`${this.baseUrl}/login`, { email, password } as LoginData);
	}

	public static async signup(data: SignupData) {
		return await AxiosClient.post<LocalUser>(`${this.baseUrl}/signup`, data);
	}

	public static async logout() {
		return await AxiosClient.post(`${this.baseUrl}/logout`);
	}

	public static async verifyEmail(token: string) {
		return await AxiosClient.post(`${this.baseUrl}/signup/confirmation`, { token });
	}

	public static async resetPassword(token: string, newPassword: string) {
		return await AxiosClient.post(`${this.baseUrl}/reset-password`, { token, newPassword });
	}

	public static async resendVerificationEmail(email: string) {
		return await AxiosClient.post(`${this.baseUrl}/resend-verification`, { email });
	}
}

export default AuthApi;
