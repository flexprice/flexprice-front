import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ENTITY_STATUS } from '@/models';
import catalogEn from '@/i18n/locales/en/catalog.json';
import commonEn from '@/i18n/locales/en/common.json';

const mockGetPlansByFilter = vi.hoisted(() => vi.fn());
const mockSearchWorkflows = vi.hoisted(() => vi.fn());

vi.mock('@/api', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/api')>();
	return {
		...actual,
		PlanApi: {
			getPlansByFilter: (...args: unknown[]) => mockGetPlansByFilter(...args),
			deletePlan: vi.fn(),
			synchronizePlanPricesWithSubscription: vi.fn(),
		},
		WorkflowApi: {
			search: (...args: unknown[]) => mockSearchWorkflows(...args),
		},
	};
});

vi.mock('@/hooks/useCurrentUserPermissions', () => ({
	useCurrentUserPermissions: () => ({ can: () => true }),
}));

vi.mock('@/store/useBreadcrumbsStore', () => ({
	useBreadcrumbsStore: () => ({ updateBreadcrumb: vi.fn(), setSegmentLoading: vi.fn() }),
}));

vi.mock('react-hot-toast', () => ({
	default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/components/molecules', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/components/molecules')>();
	return {
		...actual,
		PlanDrawer: () => null,
		DuplicatePlanDialog: () => null,
		ApiDocsContent: () => null,
	};
});

vi.mock('react-router', async () => {
	const actual = await vi.importActual('react-router');
	return {
		...actual,
		useParams: () => ({ planId: 'plan_1' }),
		useNavigate: () => vi.fn(),
		Outlet: () => null,
	};
});

import PlanDetailsPage from './PlanDetailsPage';

let testI18n: I18nInstance;

beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['catalog', 'common'],
		defaultNS: 'catalog',
		resources: { en: { catalog: catalogEn, common: commonEn } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const renderPage = () => {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<I18nextProvider i18n={testI18n}>
				<MemoryRouter>
					<PlanDetailsPage />
				</MemoryRouter>
			</I18nextProvider>
		</QueryClientProvider>,
	);
};

const plan = (unsynced: number, synced: boolean) => ({
	id: 'plan_1',
	name: 'Pro',
	description: '',
	lookup_key: 'pro',
	status: ENTITY_STATUS.PUBLISHED,
	created_at: '',
	updated_at: '',
	created_by: '',
	updated_by: '',
	tenant_id: '',
	environment_id: '',
	price_sync_status: {
		current_sequence: 1,
		unsynced_subscription_count: unsynced,
		synced,
	},
});

describe('PlanDetailsPage sync usage badge', () => {
	beforeEach(() => {
		mockGetPlansByFilter.mockReset();
		mockSearchWorkflows.mockReset();
		mockSearchWorkflows.mockResolvedValue({ items: [] });
	});

	it('shows the unsynced subscription count on the Sync Usage Charges button', async () => {
		mockGetPlansByFilter.mockResolvedValue({ items: [plan(7, false)] });
		renderPage();

		const button = await screen.findByRole('button', { name: /Sync Usage Charges/i });
		await waitFor(() => {
			expect(button.parentElement).toHaveTextContent('7');
		});
		expect(screen.getByLabelText('7 unsynced subscriptions')).toBeInTheDocument();
	});

	it('hides the count when every subscription is already in sync', async () => {
		mockGetPlansByFilter.mockResolvedValue({ items: [plan(0, true)] });
		renderPage();

		const button = await screen.findByRole('button', { name: /Sync Usage Charges/i });
		expect(button).not.toHaveTextContent('0');
	});
});
