import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import commonEn from '@/i18n/locales/en/common.json';
import CustomerApi from '@/api/CustomerApi';
import ForceRunDrawer from './ForceRunDrawer';

vi.mock('@/api/CustomerApi', () => ({
	default: {
		searchCustomers: vi.fn(async () => ({
			items: [{ id: 'cust_1', external_id: 'acme', name: 'Acme Corp' }],
		})),
	},
}));

let testI18n: I18nInstance;

beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['common'],
		defaultNS: 'common',
		resources: { en: { common: commonEn } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
	<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
		<I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
	</QueryClientProvider>
);

function renderDrawer(props: { onConfirm?: () => void; showCustomerFilter?: boolean } = {}) {
	return render(
		<TestWrapper>
			<ForceRunDrawer isOpen onOpenChange={vi.fn()} onConfirm={props.onConfirm ?? vi.fn()} showCustomerFilter={props.showCustomerFilter} />
		</TestWrapper>,
	);
}

describe('ForceRunDrawer date picker', () => {
	it('opens the calendar when Start Time is clicked after selecting a custom date range', () => {
		renderDrawer();

		fireEvent.click(screen.getByLabelText(commonEn.forceRun.customDateRange));
		fireEvent.click(screen.getByRole('button', { name: commonEn.forceRun.startTimePlaceholder }));

		expect(screen.getByRole('grid')).toBeInTheDocument();
	});

	it('keeps the custom range fields after picking a day in the calendar', () => {
		renderDrawer();

		fireEvent.click(screen.getByLabelText(commonEn.forceRun.customDateRange));
		fireEvent.click(screen.getByRole('button', { name: commonEn.forceRun.startTimePlaceholder }));
		fireEvent.click(screen.getByRole('button', { name: /15/ }));

		expect(screen.getByRole('dialog', { name: commonEn.forceRun.title })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: commonEn.forceRun.endTimePlaceholder })).toBeInTheDocument();
	});
});

describe('ForceRunDrawer customer filter', () => {
	it('is hidden unless the export filters by customer', () => {
		renderDrawer();

		expect(screen.queryByText(commonEn.forceRun.customersLabel)).not.toBeInTheDocument();
	});

	it('runs for every customer when none is picked', () => {
		const onConfirm = vi.fn();
		renderDrawer({ onConfirm, showCustomerFilter: true });

		fireEvent.click(screen.getByRole('button', { name: commonEn.forceRun.runExport }));

		expect(onConfirm).toHaveBeenCalledWith(undefined, undefined, undefined);
	});

	it('sends the picked customers by external id', async () => {
		const onConfirm = vi.fn();
		renderDrawer({ onConfirm, showCustomerFilter: true });

		fireEvent.click(screen.getByRole('button', { name: commonEn.forceRun.customersPlaceholder }));
		fireEvent.click(await screen.findByText('Acme Corp'));
		expect(CustomerApi.searchCustomers).toHaveBeenCalled();
		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
		fireEvent.click(await screen.findByRole('button', { name: commonEn.forceRun.runExport }));

		expect(onConfirm).toHaveBeenCalledWith(undefined, undefined, ['acme']);
	});
});
