import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance, type i18n as I18nInstance } from 'i18next';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import customersEn from '@/i18n/locales/en/customers.json';
import settingsEn from '@/i18n/locales/en/settings.json';
import commonEn from '@/i18n/locales/en/common.json';

const { mockQuery, mockCan } = vi.hoisted(() => ({ mockQuery: vi.fn(), mockCan: vi.fn() }));
vi.mock('@/api/FxRateApi', () => ({
	default: { queryFxRates: mockQuery, createFxRate: vi.fn(), updateFxRate: vi.fn(), deleteFxRate: vi.fn() },
}));
vi.mock('@/hooks/useCurrentUserPermissions', () => ({
	useCurrentUserPermissions: () => ({ can: mockCan, isSuperAdmin: false, roles: [], isLoading: false, isError: false }),
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/core/services/supbase/config', () => ({ default: {} }));
vi.mock('@/core/auth/AuthService', () => ({ default: {} }));

import CustomerFxOverridesSection from './CustomerFxOverridesSection';

let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['customers', 'settings', 'common'],
		defaultNS: 'customers',
		resources: { en: { customers: customersEn, settings: settingsEn, common: commonEn } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const row = (id: string, start: string | null, end: string | null) => ({
	id,
	environment_id: 'env_1',
	scope: 'customer',
	scope_id: 'cust_1',
	from_currency: 'usd',
	to_currency: 'inr',
	rate: '84.5',
	source: 'fixed',
	start_date: start,
	end_date: end,
	status: 'published',
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
});

const renderSection = (isArchived = false) =>
	render(
		<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
			<I18nextProvider i18n={testI18n}>
				<MemoryRouter>
					<CustomerFxOverridesSection customerId='cust_1' isArchived={isArchived} />
				</MemoryRouter>
			</I18nextProvider>
		</QueryClientProvider>,
	);

beforeEach(() => {
	mockCan.mockReset().mockReturnValue(true);
	mockQuery.mockReset().mockResolvedValue({
		items: [row('a', null, null), row('b', '2999-01-01T00:00:00Z', null), row('c', null, '2000-01-01T00:00:00Z')],
		pagination: { total: 3, limit: 10, offset: 0 },
	});
});

describe('CustomerFxOverridesSection', () => {
	it('lists customer-scope overrides with a free pair and the customer empty text', async () => {
		mockQuery.mockResolvedValue({ items: [], pagination: { total: 0, limit: 10, offset: 0 } });
		renderSection();
		expect(await screen.findByText('No FX overrides. This customer uses the global forex rates.')).toBeInTheDocument();
		expect(mockQuery).toHaveBeenCalledWith({ scope: 'customer', scope_id: 'cust_1', limit: 10, offset: 0 });
	});

	it('is read-only on an archived customer', async () => {
		renderSection(true);
		await screen.findAllByText('1 USD = 84.50 INR');
		expect(screen.queryByRole('button', { name: /add override/i })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Row actions' })).not.toBeInTheDocument();
	});
});
