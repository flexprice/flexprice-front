import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/core/axios/verbs', () => ({ AxiosClient: { get: vi.fn(), post: vi.fn() } }));

import { AxiosClient } from '@/core/axios/verbs';
import EventsApi from './EventsApi';

describe('EventsApi.getEventDebug', () => {
	beforeEach(() => {
		vi.mocked(AxiosClient.get).mockReset();
		vi.mocked(AxiosClient.get).mockResolvedValue({} as never);
	});

	it('sends the external customer id the event was ingested with', async () => {
		await EventsApi.getEventDebug('evt/with/slash', 'cust_ext_1');

		expect(AxiosClient.get).toHaveBeenCalledWith('/events/lookup?id=evt%2Fwith%2Fslash&external_customer_id=cust_ext_1');
	});
});
