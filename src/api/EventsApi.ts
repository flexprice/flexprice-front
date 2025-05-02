import { AxiosClient } from '@/core/axios/verbs';
import { generateQueryParams } from '@/utils/common/api_helper';
import { GetEventsPayload, GetEventsResponse, GetUsageByMeterPayload, GetUsageByMeterResponse, FireEventsPayload } from '@/types/dto';

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
