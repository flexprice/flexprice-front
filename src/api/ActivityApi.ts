import { AxiosClient } from '@/core/axios/verbs';
import { ActivityItem, ActivityItemSchema, ActivityQuery, ListActivityResponse, ListActivityResponseSchema } from '@/types/dto/ActivityLog';

export const toQueryString = (q: ActivityQuery): string => {
	const params = new URLSearchParams();
	(Object.keys(q) as Array<keyof ActivityQuery>).forEach((key) => {
		const value = q[key];
		if (value === undefined || value === null || value === '') return;
		if (Array.isArray(value)) {
			value.forEach((v) => params.append(key, v));
			return;
		}
		params.append(key, String(value));
	});
	return params.toString();
};

class ActivityApi {
	private static baseUrl = '/activity';

	public static async list(query: ActivityQuery): Promise<ListActivityResponse> {
		const qs = toQueryString(query);
		const raw = await AxiosClient.get<unknown>(qs ? `${this.baseUrl}?${qs}` : this.baseUrl);
		return ListActivityResponseSchema.parse(raw);
	}

	public static async get(id: string): Promise<ActivityItem> {
		const raw = await AxiosClient.get<unknown>(`${this.baseUrl}/${id}`);
		return ActivityItemSchema.parse(raw);
	}
}

export default ActivityApi;
