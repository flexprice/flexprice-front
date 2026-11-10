import { AxiosClient } from '@/core/axios/verbs';
import { generateQueryParams } from '@/utils/common/api_helper';
import { Pagination } from '@/models';

export interface EntityIntegrationMapping {
	id: string;
	entity_type: string; // e.g., 'customer', 'subscription', 'invoice'
	entity_id: string;
	integration_provider: string; // e.g., 'stripe', 'hubspot', 'razorpay'
	external_id: string; // ID in the external system
	metadata?: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

export interface CreateEntityIntegrationMappingRequest {
	entity_type: string;
	entity_id: string;
	integration_provider: string;
	external_id: string;
	metadata?: Record<string, unknown>;
}

export interface ListEntityIntegrationMappingsResponse {
	items: EntityIntegrationMapping[];
	total: number;
	pagination: Pagination;
}

class EntityIntegrationMappingApi {
	private static baseUrl = '/entity-integration-mappings';

	/**
	 * Create a new entity integration mapping
	 * POST /entity-integration-mappings
	 */
	public static async createEntityIntegrationMapping(data: CreateEntityIntegrationMappingRequest): Promise<EntityIntegrationMapping> {
		return await AxiosClient.post<EntityIntegrationMapping>(this.baseUrl, data);
	}

	/**
	 * List all entity integration mappings
	 * GET /entity-integration-mappings
	 */
	public static async listEntityIntegrationMappings(
		payload: Pagination = { limit: 10, offset: 0 },
	): Promise<ListEntityIntegrationMappingsResponse> {
		const url = generateQueryParams(this.baseUrl, payload);
		return await AxiosClient.get<ListEntityIntegrationMappingsResponse>(url);
	}

	/**
	 * Get an entity integration mapping by ID
	 * GET /entity-integration-mappings/:id
	 */
	public static async getEntityIntegrationMapping(id: string): Promise<EntityIntegrationMapping> {
		return await AxiosClient.get<EntityIntegrationMapping>(`${this.baseUrl}/${id}`);
	}

	/**
	 * Delete an entity integration mapping
	 * DELETE /entity-integration-mappings/:id
	 */
	public static async deleteEntityIntegrationMapping(id: string): Promise<void> {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}
}

export default EntityIntegrationMappingApi;
