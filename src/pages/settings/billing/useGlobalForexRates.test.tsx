import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockQuery, mockCreate, mockUpdate } = vi.hoisted(() => ({ mockQuery: vi.fn(), mockCreate: vi.fn(), mockUpdate: vi.fn() }));
vi.mock('@/api/FxRateApi', () => ({ default: { queryFxRates: mockQuery, createFxRate: mockCreate, updateFxRate: mockUpdate } }));
vi.mock('@/hooks/useEnvironment', () => ({ default: () => ({ activeEnvironment: { id: 'env_1' } }) }));

import { useGlobalForexRates } from './useGlobalForexRates';

const wrapper = ({ children }: { children: ReactNode }) => (
	<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
		{children}
	</QueryClientProvider>
);

beforeEach(() => {
	mockQuery.mockReset().mockResolvedValue({ items: [], pagination: { total: 0, limit: 10, offset: 0 } });
	mockCreate.mockReset().mockResolvedValue({});
	mockUpdate.mockReset().mockResolvedValue({});
});

describe('useGlobalForexRates', () => {
	it('creates a tenant rate with only the pair and the rate', async () => {
		const { result } = renderHook(() => useGlobalForexRates({ page: 1, limit: 10, offset: 0 }), { wrapper });
		result.current.createRate.mutate({ from_currency: 'usd', to_currency: 'inr', rate: '83' });
		await waitFor(() => expect(mockCreate).toHaveBeenCalledWith({ scope: 'tenant', from_currency: 'usd', to_currency: 'inr', rate: '83' }));
	});
});
