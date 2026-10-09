import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance, type i18n as I18nInstance } from 'i18next';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import customersEn from '@/i18n/locales/en/customers.json';
import settingsEn from '@/i18n/locales/en/settings.json';
import commonEn from '@/i18n/locales/en/common.json';

const { mockQuery, mockGetCustomer } = vi.hoisted(() => ({ mockQuery: vi.fn(), mockGetCustomer: vi.fn() }));
vi.mock('@/api/FxRateApi', () => ({
	default: { queryFxRates: mockQuery, createFxRate: vi.fn(), updateFxRate: vi.fn(), deleteFxRate: vi.fn() },
}));
vi.mock('@/api/CustomerApi', () => ({ default: { getCustomerById: mockGetCustomer } }));
vi.mock('@/hooks/useCurrentUserPermissions', () => ({
	useCurrentUserPermissions: () => ({ can: () => true, isSuperAdmin: false, roles: [], isLoading: false, isError: false }),
}));
vi.mock('@/utils/common/custom_currency', () => ({ isCustomCurrency: () => false }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/core/services/supbase/config', () => ({ default: {} }));
vi.mock('@/core/auth/AuthService', () => ({ default: {} }));

import SubscriptionEditFxOverridesSection from './SubscriptionEditFxOverridesSection';

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

type SectionProps = Parameters<typeof SubscriptionEditFxOverridesSection>[0];

const renderSection = (props: Partial<SectionProps> = {}) =>
	render(
		<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
			<I18nextProvider i18n={testI18n}>
				<MemoryRouter>
					<SubscriptionEditFxOverridesSection
						subscriptionId='subs_1'
						currency='usd'
						customerId='cust_1'
						subscriber={{ id: 'cust_1', billing_currency: 'inr' } as SectionProps['subscriber']}
						readOnly={false}
						{...props}
					/>
				</MemoryRouter>
			</I18nextProvider>
		</QueryClientProvider>,
	);

beforeEach(() => {
	mockQuery.mockReset().mockResolvedValue({ items: [], pagination: { total: 0, limit: 10, offset: 0 } });
	mockGetCustomer.mockReset();
});

describe('SubscriptionEditFxOverridesSection', () => {
	it('locks the pair to the subscription currency → the subscriber billing currency', async () => {
		renderSection();
		fireEvent.click(await screen.findByRole('button', { name: /^add$/i }));
		await waitFor(() => expect(screen.getByText('USD → INR')).toBeInTheDocument());
		expect(mockQuery).toHaveBeenCalledWith({ scope: 'subscription', scope_id: 'subs_1', limit: 10, offset: 0 });
	});

	it('uses the invoicing customer billing currency when it differs from the subscriber', async () => {
		mockGetCustomer.mockResolvedValue({ id: 'cust_pay', billing_currency: 'eur' });
		renderSection({ invoicingCustomerId: 'cust_pay' });
		fireEvent.click(await screen.findByRole('button', { name: /^add$/i }));
		await waitFor(() => expect(screen.getByText('USD → EUR')).toBeInTheDocument());
		expect(mockGetCustomer).toHaveBeenCalledWith('cust_pay');
	});

	it('is hidden when nothing is converted and there are no saved rates', async () => {
		renderSection({ subscriber: { id: 'cust_1' } as SectionProps['subscriber'] });
		await waitFor(() => expect(mockQuery).toHaveBeenCalled());
		expect(screen.queryByText('FX Overrides')).not.toBeInTheDocument();
	});
});
