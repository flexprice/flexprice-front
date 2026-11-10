import { AxiosClient } from '@/core/axios/verbs';
import { TypedBackendFilter, TypedBackendSort } from '@/types/formatters/QueryBuilder';
import { Pagination } from '@/models';

export interface AlertLog {
	id: string;
	alert_type: string;
	entity_type: string;
	entity_id: string;
	message: string;
	severity: 'info' | 'warning' | 'error' | 'critical';
	status: 'active' | 'resolved' | 'acknowledged';
	metadata?: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

export interface ListAlertLogsByFilterPayload extends Pagination {
	filters: TypedBackendFilter[];
	sort: TypedBackendSort[];
}

export interface ListAlertLogsResponse {
	items: AlertLog[];
	total: number;
	pagination: Pagination;
}

class AlertLogsApi {
	private static baseUrl = '/alerts';

	/**
	 * List alert logs by filter
	 * POST /alerts/search
	 */
	public static async listAlertLogsByFilter(payload: ListAlertLogsByFilterPayload): Promise<ListAlertLogsResponse> {
		return await AxiosClient.post<ListAlertLogsResponse>(`${this.baseUrl}/search`, payload);
	}
}

export default AlertLogsApi;
