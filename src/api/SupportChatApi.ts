import { AxiosClient } from '@/core/axios/verbs';
import { SupportChatProvider } from '@/models/SupportChat';

export interface SupportChatTokenRequest {
	provider: SupportChatProvider;
}

export interface SupportChatTokenResponse {
	/** Short-lived signed JWT for the provider's identity verification. Never log or persist this. */
	token: string;
	/** RFC3339 UTC. Informational — the token is re-fetched on every widget init. */
	expires_at: string;
	provider: SupportChatProvider;
}

/**
 * Mints a support-chat identity token for the authenticated user.
 *
 * Contract: `docs/support-chat-identity-token-contract.md`.
 * The endpoint does not exist yet — callers must treat failure as non-fatal and
 * fall back to an unverified session.
 */
class SupportChatApi {
	private static baseUrl = '/users/me/support-chat';

	public static async getIdentityToken(provider: SupportChatProvider): Promise<SupportChatTokenResponse> {
		return await AxiosClient.post<SupportChatTokenResponse, SupportChatTokenRequest>(`${this.baseUrl}/token`, { provider });
	}
}

export default SupportChatApi;
