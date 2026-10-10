import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance, type i18n as I18nInstance } from 'i18next';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import customersEn from '@/i18n/locales/en/customers.json';
import settingsEn from '@/i18n/locales/en/settings.json';
import commonEn from '@/i18n/locales/en/common.json';

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/core/services/supbase/config', () => ({ default: {} }));
vi.mock('@/core/auth/AuthService', () => ({ default: {} }));

import SubscriptionFxRateTable from './SubscriptionFxRateTable';

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

const tenantRate = {
	id: 'fxr_t',
	environment_id: 'env',
	scope: 'tenant' as const,
	scope_id: 'tenant',
	from_currency: 'usd',
	to_currency: 'inr',
	rate: '83',
	source: 'fixed' as const,
	status: 'published',
	created_at: '',
	updated_at: '',
};

const renderTable = (props: Partial<Parameters<typeof SubscriptionFxRateTable>[0]> = {}) => {
	const onChange = vi.fn();
	render(
		<QueryClientProvider client={new QueryClient()}>
			<I18nextProvider i18n={testI18n}>
				<MemoryRouter>
					<SubscriptionFxRateTable
						data={[]}
						onChange={onChange}
						chargeCurrency='usd'
						billingCurrency='inr'
						tenantRate={tenantRate}
						{...props}
					/>
				</MemoryRouter>
			</I18nextProvider>
		</QueryClientProvider>,
	);
	return { onChange };
};

describe('SubscriptionFxRateTable', () => {
	it('adds a row through the locked-pair dialog without any API call', () => {
		const { onChange } = renderTable();
		fireEvent.click(screen.getByRole('button', { name: /add/i }));
		expect(screen.getByText('USD → INR')).toBeInTheDocument();
		fireEvent.change(screen.getByPlaceholderText('83.00'), { target: { value: '90' } });
		fireEvent.click(screen.getByRole('button', { name: 'Save' }));
		expect(onChange).toHaveBeenCalledWith([{ id: expect.any(String), rate: '90' }]);
	});

	it('rejects a row overlapping an existing one', () => {
		const { onChange } = renderTable({ data: [{ id: 'r1', rate: '90' }] });
		fireEvent.click(screen.getByRole('button', { name: /add/i }));
		fireEvent.change(screen.getByPlaceholderText('83.00'), { target: { value: '95' } });
		fireEvent.click(screen.getByRole('button', { name: 'Save' }));
		expect(screen.getByText('Overlaps another override in this list.')).toBeInTheDocument();
		expect(onChange).not.toHaveBeenCalled();
	});

	it('shows the global rate in the hint', () => {
		renderTable();
		expect(screen.getByText(/global rate \(1 USD = 83\.00 INR\)/)).toBeInTheDocument();
	});

	it('warns when there is no global rate', () => {
		renderTable({ tenantRate: null });
		expect(
			screen.getByText('No global USD → INR rate. Add one in Settings › Billing before creating this subscription.'),
		).toBeInTheDocument();
	});
});
