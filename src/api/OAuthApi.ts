import { AxiosClient } from '@/core/axios/verbs';

// Request DTOs
export interface InitiateOAuthRequest {
	provider: string;
	name: string;
	credentials: Record<string, string>;
	metadata: Record<string, string>;
	sync_config?: {
		invoice?: {
			inbound: boolean;
			outbound: boolean;
		};
		customer?: {
			inbound: boolean;
			outbound: boolean;
		};
		payment?: {
			inbound: boolean;
			outbound: boolean;
		};
		invoice_sync_settings?: {
			payment_gateways?: {
				enabled?: boolean;
				gateways?: string[];
				paypal_payment_method?: string;
			};
		};
	};
}

export interface InitiateOAuthResponse {
	oauth_url: string;
	session_id: string;
}

export interface CompleteOAuthRequest {
	provider: string;
	session_id: string;
	code: string;
	state: string;
	realm_id?: string;
	organization_id?: string;
	organization_name?: string;
	location?: string;
	accounts_server?: string;
}

export interface CompleteOAuthResponse {
	success: boolean;
	connection_id: string;
}

/**
 * OAuthApi - Generic OAuth 2.0 API for all providers
 *
 * This API handles the secure backend-only OAuth flow where:
 * 1. Frontend sends credentials to backend (over HTTPS)
 * 2. Backend stores credentials securely and returns OAuth URL + session_id
 * 3. User authorizes with OAuth provider
 * 4. Frontend sends authorization code to backend
 * 5. Backend exchanges code for tokens (credentials never touch frontend again)
 */
class OAuthApi {
	private static baseUrl = '/oauth';

	/**
	 * Initiate OAuth flow
	 *
	 * Sends credentials to backend for secure storage.
	 * Backend encrypts credentials and returns OAuth URL.
	 *
	 * @param payload - Provider, name, credentials, and metadata
	 * @returns OAuth URL to redirect user to, and session_id for callback
	 */
	public static async InitiateOAuth(payload: InitiateOAuthRequest): Promise<InitiateOAuthResponse> {
		return await AxiosClient.post<InitiateOAuthResponse>(`${this.baseUrl}/init`, payload);
	}

	/**
	 * Complete OAuth flow
	 *
	 * Sends authorization code and session_id to backend.
	 * Backend retrieves credentials from cache and exchanges code for tokens.
	 *
	 * @param payload - Provider, session_id, code, state, and optional realm_id
	 * @returns Success status and connection_id
	 */
	public static async CompleteOAuth(payload: CompleteOAuthRequest): Promise<CompleteOAuthResponse> {
		return await AxiosClient.post<CompleteOAuthResponse>(`${this.baseUrl}/complete`, payload);
	}
}

export default OAuthApi;
