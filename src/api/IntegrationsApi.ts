import { AxiosClient } from '@/core/axios/verbs';
import { CreateIntegrationRequest, IntegrationResponse, LinkedinIntegrationResponse } from '@/types/dto';
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
