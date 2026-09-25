import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import billingEn from '@/i18n/locales/en/billing.json';
import commonEn from '@/i18n/locales/en/common.json';
import { ENTITY_STATUS } from '@/models/base';
import { BILLING_MODEL, PRICE_TYPE, PRICE_UNIT_TYPE } from '@/models/Price';
import type { Price } from '@/models/Price';
import { SUBSCRIPTION_MODIFY_TYPE } from '@/models/Subscription';
import type { LineItem } from '@/models/Subscription';
import SubscriptionLineItemQuantityModifyDialog from './SubscriptionLineItemQuantityModifyDialog';

const { mockPreview, mockExecute } = vi.hoisted(() => ({
	mockPreview: vi.fn(),
	mockExecute: vi.fn(),
}));

vi.mock('@/api/SubscriptionApi', () => ({
	default: { previewSubscriptionModify: mockPreview, executeSubscriptionModify: mockExecute },
}));
vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({ refetchQueries: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/core/services/supbase/config', () => ({ default: {} }));
vi.mock('@/core/auth/AuthService', () => ({ default: {} }));
vi.mock('react-router', async () => {
	const actual = await vi.importActual('react-router');
	return { ...actual, useNavigate: () => vi.fn() };
});

let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['billing', 'common'],
		defaultNS: 'billing',
		resources: { en: { billing: billingEn, common: commonEn } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
	<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
		<I18nextProvider i18n={testI18n}>
			<BrowserRouter>{children}</BrowserRouter>
		</I18nextProvider>
	</QueryClientProvider>
);

const lineItem: LineItem = {
	id: 'li_1',
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
	created_by: 'user_1',
	updated_by: 'user_1',
	tenant_id: 'tenant_1',
	status: ENTITY_STATUS.PUBLISHED,
	environment_id: 'env_1',
	subscription_id: 'sub_1',
	customer_id: 'cust_1',
	price_id: 'price_1',
	meter_id: 'meter_1',
	display_name: 'Seats',
	plan_display_name: 'Pro Plan',
	meter_display_name: 'Seats meter',
	price_type: PRICE_TYPE.FIXED,
	billing_period: 'MONTHLY',
	currency: 'USD',
	quantity: 5,
	start_date: '',
	end_date: '',
	metadata: {},
};

beforeEach(() => {
	vi.clearAllMocks();
});

const withPrice = (price: Partial<Price>): LineItem => ({ ...lineItem, price: price as Price });

const flatFeeLineItem = withPrice({ amount: '100', billing_model: BILLING_MODEL.FLAT_FEE, price_unit_type: PRICE_UNIT_TYPE.FIAT });

const renderDialog = (li: LineItem = lineItem) =>
	render(
		<Wrapper>
			<SubscriptionLineItemQuantityModifyDialog
				isOpen={true}
				onOpenChange={vi.fn()}
				subscriptionId='sub_1'
				lineItem={li}
				currentPeriodStart='2026-01-01T00:00:00Z'
				currentPeriodEnd='2026-02-01T00:00:00Z'
			/>
		</Wrapper>,
	);

describe('SubscriptionLineItemQuantityModifyDialog', () => {
	it('allows a quantity of 0 and previews with quantity "0"', async () => {
		mockPreview.mockResolvedValue({ changed_resources: {} });
		renderDialog();

		fireEvent.change(screen.getByPlaceholderText('e.g. 10'), { target: { value: '0' } });
		fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

		await waitFor(() => {
			expect(mockPreview).toHaveBeenCalledWith('sub_1', {
				type: SUBSCRIPTION_MODIFY_TYPE.LINE_ITEM_CHANGE,
				line_item_change_params: { line_items: [{ id: 'li_1', quantity: '0' }] },
			});
		});
		expect(screen.queryByText(/enter a valid quantity/i)).not.toBeInTheDocument();
	});

	it('rejects a negative quantity with an inline error and does not call preview', async () => {
		renderDialog();

		fireEvent.change(screen.getByPlaceholderText('e.g. 10'), { target: { value: '-1' } });
		fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

		await waitFor(() => {
			expect(screen.getByText('Enter a valid quantity — zero or greater.')).toBeInTheDocument();
		});
		expect(mockPreview).not.toHaveBeenCalled();
	});

	it('sends only amount when just the price changes on a flat-fee charge', async () => {
		mockPreview.mockResolvedValue({ changed_resources: {} });
		renderDialog(flatFeeLineItem);

		fireEvent.change(screen.getByPlaceholderText('e.g. 20.00'), { target: { value: '150' } });
		fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

		await waitFor(() => {
			expect(mockPreview).toHaveBeenCalledWith('sub_1', {
				type: SUBSCRIPTION_MODIFY_TYPE.LINE_ITEM_CHANGE,
				line_item_change_params: { line_items: [{ id: 'li_1', amount: '150' }] },
			});
		});
	});

	it('sends quantity and amount together when both change', async () => {
		mockPreview.mockResolvedValue({ changed_resources: {} });
		renderDialog(flatFeeLineItem);

		fireEvent.change(screen.getByPlaceholderText('e.g. 10'), { target: { value: '7' } });
		fireEvent.change(screen.getByPlaceholderText('e.g. 20.00'), { target: { value: '80.50' } });
		fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

		await waitFor(() => {
			expect(mockPreview).toHaveBeenCalledWith('sub_1', {
				type: SUBSCRIPTION_MODIFY_TYPE.LINE_ITEM_CHANGE,
				line_item_change_params: { line_items: [{ id: 'li_1', quantity: '7', amount: '80.50' }] },
			});
		});
	});

	it('blocks preview when neither quantity nor price changed', async () => {
		renderDialog(flatFeeLineItem);

		fireEvent.change(screen.getByPlaceholderText('e.g. 20.00'), { target: { value: '100.00' } });
		fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

		await waitFor(() => {
			expect(screen.getByText('Change the quantity or the price to continue.')).toBeInTheDocument();
		});
		expect(mockPreview).not.toHaveBeenCalled();
	});

	it.each([
		['tiered', { amount: '100', billing_model: BILLING_MODEL.TIERED, price_unit_type: PRICE_UNIT_TYPE.FIAT }],
		['custom price unit', { amount: '100', billing_model: BILLING_MODEL.FLAT_FEE, price_unit_type: PRICE_UNIT_TYPE.CUSTOM }],
	])('hides the price field for a %s price', (_label, price) => {
		renderDialog(withPrice(price));

		expect(screen.getByPlaceholderText('e.g. 10')).toBeInTheDocument();
		expect(screen.queryByPlaceholderText('e.g. 20.00')).not.toBeInTheDocument();
	});

	it.each(['1,20', '0x10', '1e3', '-5'])('rejects ambiguous price input %s without calling preview', async (value) => {
		renderDialog(flatFeeLineItem);

		fireEvent.change(screen.getByPlaceholderText('e.g. 20.00'), { target: { value } });
		fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

		await waitFor(() => {
			expect(screen.getByText(/Enter a valid price/)).toBeInTheDocument();
		});
		expect(mockPreview).not.toHaveBeenCalled();
	});

	it('accepts correctly grouped thousands in the price', async () => {
		mockPreview.mockResolvedValue({ changed_resources: {} });
		renderDialog(flatFeeLineItem);

		fireEvent.change(screen.getByPlaceholderText('e.g. 20.00'), { target: { value: '1,200.50' } });
		fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

		await waitFor(() => {
			expect(mockPreview).toHaveBeenCalledWith('sub_1', {
				type: SUBSCRIPTION_MODIFY_TYPE.LINE_ITEM_CHANGE,
				line_item_change_params: { line_items: [{ id: 'li_1', amount: '1200.50' }] },
			});
		});
	});
});
