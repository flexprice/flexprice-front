import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserApi } from './UserApi';

vi.mock('@/core/axios/verbs', () => ({
	AxiosClient: {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
	},
}));

import { AxiosClient } from '@/core/axios/verbs';

describe('UserApi.updateMe', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('calls PUT /users/me with metadata wrapped in metadata key', async () => {
		const mockUser = { id: '1', email: 'test@example.com', tenant: {} };
		vi.mocked(AxiosClient.put).mockResolvedValue(mockUser);

		const metadata = {
			consent_status: 'accepted',
			consent_version: '2025-v1',
			consent_at: '2025-05-28T00:00:00.000Z',
		};

		const result = await UserApi.updateMe({ metadata });

		expect(AxiosClient.put).toHaveBeenCalledWith('/users/me', { metadata });
		expect(result).toEqual(mockUser);
	});
});
