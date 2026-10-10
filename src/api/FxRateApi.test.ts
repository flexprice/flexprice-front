import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));
vi.mock('@/core/axios/verbs', () => ({ AxiosClient: { post: mockPost, get: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('@/core/services/supbase/config', () => ({ default: {} }));
vi.mock('@/core/auth/AuthService', () => ({ default: {} }));

import { DataType, FilterOperator } from '@/types/common/QueryBuilder';
import FxRateApi from './FxRateApi';

beforeEach(() => mockPost.mockReset().mockResolvedValue({ items: [], pagination: { total: 0, limit: 10, offset: 0 } }));

describe('FxRateApi.queryFxRates', () => {
	it('lists fixed rates only (market rates are not supported yet)', async () => {
		await FxRateApi.queryFxRates({ scope: 'tenant', limit: 10, offset: 0 });
		expect(mockPost).toHaveBeenCalledWith('/forex/query', {
			scope: 'tenant',
			limit: 10,
			offset: 0,
			filters: [{ field: 'source', operator: 'eq', data_type: 'string', value: { string: 'fixed' } }],
		});
	});

	it('keeps caller filters alongside the fixed-rates filter', async () => {
		const callerFilter = { field: 'from_currency', operator: FilterOperator.EQUAL, data_type: DataType.STRING, value: { string: 'usd' } };
		await FxRateApi.queryFxRates({ scope: 'tenant', filters: [callerFilter], limit: 10, offset: 0 });
		expect(mockPost.mock.calls[0][1].filters).toEqual([
			callerFilter,
			{ field: 'source', operator: 'eq', data_type: 'string', value: { string: 'fixed' } },
		]);
	});
});
