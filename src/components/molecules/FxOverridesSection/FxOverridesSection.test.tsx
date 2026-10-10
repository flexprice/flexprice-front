import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import toast from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance, type i18n as I18nInstance } from 'i18next';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import customersEn from '@/i18n/locales/en/customers.json';
import settingsEn from '@/i18n/locales/en/settings.json';
import commonEn from '@/i18n/locales/en/common.json';
import { PAGINATION_PREFIX } from '@/hooks/usePagination';

const { mockQuery, mockCan, mockDelete, mockCreate } = vi.hoisted(() => ({
	mockQuery: vi.fn(),
	mockCan: vi.fn(),
	mockDelete: vi.fn(),
	mockCreate: vi.fn(),
}));
vi.mock('@/api/FxRateApi', () => ({
	default: { queryFxRates: mockQuery, createFxRate: mockCreate, updateFxRate: vi.fn(), deleteFxRate: mockDelete },
}));
vi.mock('@/hooks/useCurrentUserPermissions', () => ({
	useCurrentUserPermissions: () => ({ can: mockCan, isSuperAdmin: false, roles: [], isLoading: false, isError: false }),
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/core/services/supbase/config', () => ({ default: {} }));
vi.mock('@/core/auth/AuthService', () => ({ default: {} }));

import FxOverridesSection, { type FxOverridesSectionProps } from './FxOverridesSection';

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

const row = (id: string, from: string, to: string, rate: string, start: string | null = null, end: string | null = null) => ({
	id,
	environment_id: 'env_1',
	scope: 'subscription',
	scope_id: 'subs_1',
	from_currency: from,
	to_currency: to,
	rate,
	source: 'fixed',
	start_date: start,
	end_date: end,
	status: 'published',
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
});

const renderSection = (props: Partial<FxOverridesSectionProps> = {}) =>
	render(
		<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
			<I18nextProvider i18n={testI18n}>
				<MemoryRouter>
					<FxOverridesSection
						scope='subscription'
						scopeId='subs_1'
						paginationPrefix={PAGINATION_PREFIX.SUBSCRIPTION_FX_OVERRIDES}
						emptyText='Nothing here'
						lockedFrom='usd'
						lockedTo='inr'
						{...props}
					/>
				</MemoryRouter>
			</I18nextProvider>
		</QueryClientProvider>,
	);

beforeEach(() => {
	mockCan.mockReset().mockReturnValue(true);
	mockQuery.mockReset().mockResolvedValue({ items: [row('a', 'usd', 'eur', '0.93')], pagination: { total: 1, limit: 10, offset: 0 } });
});

describe('FxOverridesSection', () => {
	it('labels each row with its own stored pair, open bounds and derived status', async () => {
		mockQuery.mockResolvedValue({
			items: [
				row('a', 'usd', 'eur', '0.93'),
				row('b', 'usd', 'inr', '84.5', '2999-01-01T00:00:00Z'),
				row('c', 'usd', 'inr', '83', null, '2000-01-01T00:00:00Z'),
			],
			pagination: { total: 3, limit: 10, offset: 0 },
		});
		renderSection();
		expect(await screen.findByText('1 USD = 0.93 EUR')).toBeInTheDocument();
		expect(screen.getAllByText('Always').length).toBeGreaterThan(0);
		expect(screen.getAllByText('No end').length).toBeGreaterThan(0);
		expect(screen.getByText('Active')).toBeInTheDocument();
		expect(screen.getByText('Scheduled')).toBeInTheDocument();
		expect(screen.getByText('Expired')).toBeInTheDocument();
	});

	it('disables add without fxrate write', async () => {
		mockCan.mockReturnValue(false);
		renderSection();
		await screen.findByText('1 USD = 0.93 EUR');
		expect(screen.getByRole('button', { name: /add override/i })).toBeDisabled();
	});

	it('confirms a delete with a "deleted" toast, not "updated"', async () => {
		mockDelete.mockReset().mockResolvedValue(undefined);
		renderSection();
		await screen.findByText('1 USD = 0.93 EUR');
		fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
		await waitFor(() => fireEvent.click(screen.getByText('Delete')));
		const confirm = await screen.findAllByRole('button', { name: /delete/i });
		fireEvent.click(confirm[confirm.length - 1]);
		await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('a'));
		await waitFor(() => expect(toast.success).toHaveBeenCalledWith('FX override deleted'));
	});

	it('hides add when nothing can be added', async () => {
		renderSection({ canAdd: false });
		await screen.findByText('1 USD = 0.93 EUR');
		expect(screen.queryByRole('button', { name: /add override/i })).not.toBeInTheDocument();
	});

	it('hides add and row actions when read-only', async () => {
		renderSection({ readOnly: true });
		await screen.findByText('1 USD = 0.93 EUR');
		expect(screen.queryByRole('button', { name: /add override/i })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Row actions' })).not.toBeInTheDocument();
	});

	it('renders nothing when empty, hidden-when-empty and nothing can be added', async () => {
		mockQuery.mockResolvedValue({ items: [], pagination: { total: 0, limit: 10, offset: 0 } });
		const { container } = renderSection({ canAdd: false, hideWhenEmpty: true });
		await waitFor(() => expect(mockQuery).toHaveBeenCalled());
		await waitFor(() => expect(container).toBeEmptyDOMElement());
	});

	it('card layout shows an empty card with Add when there are no rates', async () => {
		mockQuery.mockResolvedValue({ items: [], pagination: { total: 0, limit: 10, offset: 0 } });
		renderSection({ layout: 'card' });
		expect(await screen.findByText('Nothing here')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument();
	});
});
