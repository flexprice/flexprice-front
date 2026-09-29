import { AxiosClient } from '@/core/axios/verbs';
import { generateQueryParams } from '@/utils/common/api_helper';
import {
	GetEventDebugResponse,
	GetEventsPayload,
	GetEventsRequest,
	GetEventsResponse,
	GetUsageByMeterPayload,
	GetUsageByMeterResponse,
	FireEventsPayload,
	GetUsageAnalyticsRequest,
	GetUsageAnalyticsResponse,
	GetMonitoringDataRequest,
	GetMonitoringDataResponse,
	GetUsageRequest,
	GetUsageResponse,
	GetHuggingFaceBillingDataRequest,
	GetHuggingFaceBillingDataResponse,
} from '@/types/dto';

class EventsApi {
	private static baseUrl = '/events';

	public static async getRawEvents(payload: GetEventsPayload): Promise<GetEventsResponse> {
		const url = generateQueryParams(EventsApi.baseUrl, payload);
		return await AxiosClient.get<GetEventsResponse>(url);
	}

	/**
	 * Event debugger response for a single event.
	 * GET /events/lookup?id=...&external_customer_id=...
	 * The id is a query param so `/` in event IDs stays intact.
	 * external_customer_id is required: an id-only lookup cannot use the events sort key.
	 */
	public static async getEventDebug(eventId: string, externalCustomerId: string): Promise<GetEventDebugResponse> {
		const url = generateQueryParams(`${EventsApi.baseUrl}/lookup`, {
			id: eventId,
			external_customer_id: externalCustomerId,
		});
		return await AxiosClient.get<GetEventDebugResponse>(url);
	}

	/**
	 * Query events with POST request (for complex filtering)
	 * POST /events/query
	 */
	public static async queryEvents(payload: GetEventsRequest): Promise<GetEventsResponse> {
		return await AxiosClient.post<GetEventsResponse>(`${EventsApi.baseUrl}/query`, payload);
	}

	public static async getUsageByMeter(payload: GetUsageByMeterPayload): Promise<GetUsageByMeterResponse> {
		return await AxiosClient.post<GetUsageByMeterResponse>(`${EventsApi.baseUrl}/usage/meter`, {
			...payload,
		});
	}

	/**
	 * Get usage statistics
	 * POST /events/usage
	 */
	public static async getUsage(payload: GetUsageRequest): Promise<GetUsageResponse> {
		return await AxiosClient.post<GetUsageResponse>(`${EventsApi.baseUrl}/usage`, payload);
	}

	/**
	 * @deprecated Use OnboardingApi.generateEvents instead
	 * This method is kept for backward compatibility
	 */
	public static async fireEvents(payload: FireEventsPayload): Promise<void> {
		return await AxiosClient.post<void>(`/portal/onboarding/events`, {
			...payload,
		});
	}

	/**
	 * Get usage analytics (v1 - with feature flag support)
	 * This endpoint uses feature flags to determine whether to use v1 or v2 backend
	 */
	public static async getUsageAnalytics(payload: GetUsageAnalyticsRequest): Promise<GetUsageAnalyticsResponse> {
		return await AxiosClient.post<GetUsageAnalyticsResponse>(`${EventsApi.baseUrl}/analytics`, payload);
	}

	/**
	 * Get usage analytics v2 (direct v2 backend call)
	 * This endpoint directly calls the v2 backend without feature flag logic
	 */
	public static async getUsageAnalyticsV2(payload: GetUsageAnalyticsRequest): Promise<GetUsageAnalyticsResponse> {
		return await AxiosClient.post<GetUsageAnalyticsResponse>(`${EventsApi.baseUrl}/analytics-v2`, payload);
	}

	/**
	 * Get monitoring data
	 * Retrieve monitoring data for events including consumer lag and event metrics (last 24 hours by default)
	 */
	public static async getMonitoringData(payload: GetMonitoringDataRequest): Promise<GetMonitoringDataResponse> {
		const url = generateQueryParams(`${EventsApi.baseUrl}/monitoring`, payload);
		return await AxiosClient.get<GetMonitoringDataResponse>(url);
	}

	/**
	 * Get HuggingFace billing data
	 * POST /events/huggingface-billing
	 */
	public static async getHuggingFaceBillingData(payload: GetHuggingFaceBillingDataRequest): Promise<GetHuggingFaceBillingDataResponse> {
		return await AxiosClient.post<GetHuggingFaceBillingDataResponse>(`${EventsApi.baseUrl}/huggingface-billing`, payload);
	}
}

export default EventsApi;
