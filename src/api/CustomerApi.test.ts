import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPut } = vi.hoisted(() => ({ mockPut: vi.fn() }));
vi.mock('@/core/axios/verbs', () => ({ AxiosClient: { put: mockPut, post: vi.fn(), get: vi.fn(), delete: vi.fn() } }));
vi.mock('@/core/services/supbase/config', () => ({ default: {} }));
vi.mock('@/core/auth/AuthService', () => ({ default: {} }));

import CustomerApi from './CustomerApi';

beforeEach(() => mockPut.mockReset().mockResolvedValue({}));

describe('CustomerApi.updateCustomer', () => {
	it('keeps an empty billing_currency so None clears it', async () => {
		await CustomerApi.updateCustomer({ billing_currency: '' }, 'cust_1');
		expect(mockPut).toHaveBeenCalledWith('/customers/cust_1', { billing_currency: '' }, { allowEmptyKeys: ['billing_currency'] });
	});
});
