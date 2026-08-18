import { AxiosClient } from '@/core/axios/verbs';

export interface SupportChatTokenResponse {
	/** Short-lived signed JWT. Never log or persist. */
	token: string;
	/** RFC3339 UTC. Informational; the token is re-fetched on every init. */
	expires_at: string;
}

/**
 * Mints a support-chat identity token for the authenticated caller. Takes no request body.
 * Callers must treat failure as non-fatal and fall back to an unverified session.
 */
class SupportChatApi {
	private static baseUrl = '/users/chat';

	public static async getIdentityToken(): Promise<SupportChatTokenResponse> {
		return await AxiosClient.post<SupportChatTokenResponse>(`${this.baseUrl}/verify`);
	}
}

export default SupportChatApi;
