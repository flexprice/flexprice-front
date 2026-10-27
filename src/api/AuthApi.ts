import { AxiosClient } from '@/core/axios/verbs';
import { LoginData, LocalUser, SignupData } from '@/types/dto';
import { PasswordLinkDetails } from '@/types/dto/UserApi';

class AuthApi {
	private static baseUrl = '/auth';

	public static async Login(email: string, password: string) {
		return await AxiosClient.post<LocalUser>(`${this.baseUrl}/login`, { email, password } as LoginData);
	}

	public static async Signup(data: SignupData) {
		return await AxiosClient.post<LocalUser>(`${this.baseUrl}/signup`, data);
	}

	public static async Logout() {
		return await AxiosClient.post(`${this.baseUrl}/logout`);
	}

	public static async VerifyEmail(token: string) {
		return await AxiosClient.post(`${this.baseUrl}/signup/confirmation`, { token });
	}

	public static async ResetPassword(token: string, newPassword: string) {
		return await AxiosClient.post(`${this.baseUrl}/reset-password`, { token, newPassword });
	}

	/** What a one-time password link is for and whose it is. */
	public static async CheckPasswordLink(token: string) {
		return await AxiosClient.post<PasswordLinkDetails>(`${this.baseUrl}/password/check`, { token });
	}

	/** Sets a password through a one-time link; 204 on success. */
	public static async SetPassword(token: string, password: string) {
		return await AxiosClient.post<void>(`${this.baseUrl}/password`, { token, password });
	}

	public static async ResendVerificationEmail(email: string) {
		return await AxiosClient.post(`${this.baseUrl}/resend-verification`, { email });
	}
}

export default AuthApi;
