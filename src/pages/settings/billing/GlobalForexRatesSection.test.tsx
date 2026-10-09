import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance, type i18n as I18nInstance } from 'i18next';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import settingsEn from '@/i18n/locales/en/settings.json';
import commonEn from '@/i18n/locales/en/common.json';

const { mockQuery, mockCreate, mockUpdate, mockCan } = vi.hoisted(() => ({
	mockQuery: vi.fn(),
	mockCreate: vi.fn(),
	mockUpdate: vi.fn(),
	mockCan: vi.fn(),
}));
vi.mock('@/api/FxRateApi', () => ({ default: { queryFxRates: mockQuery, createFxRate: mockCreate, updateFxRate: mockUpdate } }));
vi.mock('@/hooks/useCurrentUserPermissions', () => ({
	useCurrentUserPermissions: () => ({ can: mockCan, isSuperAdmin: false, roles: [], isLoading: false, isError: false }),
}));
vi.mock('@/hooks/useEnvironment', () => ({ default: () => ({ activeEnvironment: { id: 'env_1' } }) }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/core/services/supbase/config', () => ({ default: {} }));
vi.mock('@/core/auth/AuthService', () => ({ default: {} }));

import GlobalForexRatesSection from './GlobalForexRatesSection';

let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['settings', 'common'],
		defaultNS: 'settings',
		resources: { en: { settings: settingsEn, common: commonEn } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const rate = {
	id: 'fxr_1',
	environment_id: 'env_1',
	scope: 'tenant',
	scope_id: 'tenant',
	from_currency: 'usd',
	to_currency: 'inr',
	rate: '83',
	source: 'fixed',
	status: 'published',
	created_at: '2026-10-01T00:00:00Z',
	updated_at: '2026-10-02T00:00:00Z',
};

const renderSection = (url = '/settings?tab=billing') =>
	render(
		<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
			<I18nextProvider i18n={testI18n}>
				<MemoryRouter initialEntries={[url]}>
					<GlobalForexRatesSection />
				</MemoryRouter>
			</I18nextProvider>
		</QueryClientProvider>,
	);

beforeEach(() => {
	mockQuery.mockReset().mockResolvedValue({ items: [rate], pagination: { total: 1, limit: 10, offset: 0 } });
	mockUpdate.mockReset().mockResolvedValue(rate);
	mockCan.mockReset().mockReturnValue(true);
});

describe('GlobalForexRatesSection', () => {
	it('renders a row with the padded rate', async () => {
		renderSection();
		expect(await screen.findByText('1 USD = 83.00 INR')).toBeInTheDocument();
	});

	it('pages 5 rates at a time with its own URL prefix', async () => {
		renderSection('/settings?tab=billing&forex_rates_page=2');
		await waitFor(() => expect(mockQuery).toHaveBeenCalledWith({ scope: 'tenant', limit: 5, offset: 5 }));
	});

	it('disables add and edit without fxrate write', async () => {
		mockCan.mockReturnValue(false);
		renderSection();
		await screen.findByText('1 USD = 83.00 INR');
		expect(screen.getByRole('button', { name: /add rate/i })).toBeDisabled();
		fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
		await waitFor(() => fireEvent.click(screen.getByText('Edit')));
		expect(screen.queryByText('Edit forex rate')).not.toBeInTheDocument();
	});

	it('edits only the rate', async () => {
		renderSection();
		fireEvent.click(await screen.findByRole('button', { name: 'Row actions' }));
		await waitFor(() => fireEvent.click(screen.getByText('Edit')));
		fireEvent.change(screen.getByPlaceholderText('83.00'), { target: { value: '84' } });
		fireEvent.click(screen.getByRole('button', { name: 'Save' }));
		await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith('fxr_1', { rate: '84' }));
	});
});
