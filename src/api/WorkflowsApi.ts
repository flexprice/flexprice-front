import { AxiosClient } from '@/core/axios/verbs';
import { generateQueryParams } from '@/utils/common/api_helper';
import type { ListWorkflowsParams, ListWorkflowsResponse } from '@/types/dto';

/** GET /v1/workflows – path is /workflows when axios baseURL includes /v1 */
const WORKFLOWS_PATH = '/workflows';

class WorkflowsApi {
	/**
	 * Build query params for list workflows: pagination (page, page_size) + optional filters.
	 * Omits empty/whitespace-only values. Trims string values so the request URL has no newlines or extra spaces.
	 */
	private static buildListParams(payload: ListWorkflowsParams): Record<string, string | number> {
		const params: Record<string, string | number> = {
			page: payload.page ?? 1,
			page_size: payload.page_size ?? 10,
		};
		const filterKeys: (keyof ListWorkflowsParams)[] = [
			'workflow_type',
			'task_queue',
			'workflow_status',
			'entity',
			'entity_id',
			'sort_by',
			'sort_order',
		];
		for (const key of filterKeys) {
			const raw = payload[key];
			if (raw === undefined || raw === null) continue;
			const value = String(raw).trim().replace(/\s+/g, ' ');
			if (value === '') continue;
			params[key] = value;
		}
		return params;
	}

	/** Returns the request path + query string (valid URL, no newlines, empty params omitted). */
	public static getListWorkflowsRequestUrl(payload: ListWorkflowsParams = {}): string {
		const params = WorkflowsApi.buildListParams(payload);
		return generateQueryParams(WORKFLOWS_PATH, params);
	}

	public static async listWorkflows(payload: ListWorkflowsParams = {}): Promise<ListWorkflowsResponse> {
		const url = WorkflowsApi.getListWorkflowsRequestUrl(payload);
		return await AxiosClient.get<ListWorkflowsResponse>(url);
	}
}

export default WorkflowsApi;
