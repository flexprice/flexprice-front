import { AxiosClient } from '@/core/axios/verbs';
import { generateQueryParams } from '@/utils/common/api_helper';
import { Event } from '@/models/Event';
interface GetEventsPayload {
	external_customer_id?: string;
	event_name?: string;
	start_time?: string;
	end_time?: string;
	iter_first_key?: string;
	iter_last_key?: string;
	page_size?: number;
	event_id?: string;
}

interface GetEventsResponse {
	events: Event[];
	has_more: boolean;
	iter_first_key: string;
	iter_last_key: string;
}

interface GetUsageByMeterPayload {
	meter_id: string;
	end_time?: string;
	start_time?: string;
	external_customer_id?: string;
	filters?: Record<string, string[]>;
	window_size?: string;
}

interface GetUsageByMeterResponse {
	type: string;
	event_name: string;
	results: {
		window_size: string;
		value: number;
	}[];
}

interface FireEventsPayload {
	customer_id?: string;
	subscription_id?: string;
	feature_id?: string;
	duration?: number;
	amount?: number;
}

class EventsApi {
	private static baseUrl = '/events';

	public static async getRawEvents(payload: GetEventsPayload): Promise<GetEventsResponse> {
		const url = generateQueryParams(EventsApi.baseUrl, payload);
		return await AxiosClient.get<GetEventsResponse>(url);
	}

	public static async getUsageByMeter(payload: GetUsageByMeterPayload): Promise<GetUsageByMeterResponse> {
		return await AxiosClient.post<GetUsageByMeterResponse>(`${EventsApi.baseUrl}/usage/meter`, {
			...payload,
		});
	}

	public static async fireEvents(payload: FireEventsPayload): Promise<void> {
		return await AxiosClient.post<void>(`/portal/onboarding/events`, {
			...payload,
		});
	}
}

export default EventsApi;
