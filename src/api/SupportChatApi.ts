import { AxiosClient } from '@/core/axios/verbs';

export interface SupportChatTokenResponse {
	token: string;
	expires_at: string;
}

class SupportChatApi {
	private static baseUrl = '/users/chat';

	public static async getIdentityToken(): Promise<SupportChatTokenResponse> {
		return await AxiosClient.post<SupportChatTokenResponse>(`${this.baseUrl}/verify`);
	}
}

export default SupportChatApi;
