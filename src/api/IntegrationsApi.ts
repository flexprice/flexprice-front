import { AxiosClient } from '@/core/axios/verbs';
import { Integration } from '@/models/Integration';
import { Pagination } from '@supabase/supabase-js';

interface CreateIntegrationRequest {
	provider: string;
	credentials: {
		key: string;
	};
	name: string;
}

interface LinkedinIntegrationResponse {
	providers: string[];
}

interface IntegrationResponse {
	items: Integration[];
	pagination: Pagination;
}

class IntegrationsApi {
	private static baseUrl = '/secrets/integrations';

	public static async installIntegration(request: CreateIntegrationRequest) {
		return await AxiosClient.post(`${this.baseUrl}/${request.provider}`, request);
	}

	public static async getIntegration(provider: string) {
		return await AxiosClient.get<IntegrationResponse>(`${this.baseUrl}/${provider}`);
	}

	public static async getLinkedInIntegration() {
		return await AxiosClient.get<LinkedinIntegrationResponse>(`${this.baseUrl}/linked`);
	}

	public static async uninstallIntegration(provider: string) {
		return await AxiosClient.delete(`${this.baseUrl}/${provider}`);
	}
}

export default IntegrationsApi;
