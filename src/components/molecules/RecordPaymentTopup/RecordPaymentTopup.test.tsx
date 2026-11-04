import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import RecordPaymentTopup from './RecordPaymentTopup';
import { PAYMENT_DESTINATION_TYPE } from '@/models/Payment';
import en from '@/i18n/locales/en/billing.json';

const { mockCreatePayment, mockListPublished, mockToastSuccess } = vi.hoisted(() => ({
	mockCreatePayment: vi.fn(),
	mockListPublished: vi.fn(),
	mockToastSuccess: vi.fn(),
}));

vi.mock('@/api/PaymentApi', () => ({ default: { createPayment: mockCreatePayment } }));
vi.mock('@/api/ConnectionApi', () => ({ default: { ListPublished: mockListPublished } }));
vi.mock('@/api/WalletApi', () => ({ default: { getCustomerWallets: vi.fn().mockResolvedValue([]) } }));
vi.mock('react-hot-toast', () => ({ default: { success: mockToastSuccess, error: vi.fn() } }));
vi.mock('@/core/services/supbase/config', () => ({ default: {} }));
vi.mock('@/core/auth/AuthService', () => ({ default: {} }));

let testI18n: I18nInstance;
beforeAll(async () => {
	Element.prototype.hasPointerCapture = () => false;
	Element.prototype.releasePointerCapture = () => {};
	Element.prototype.scrollIntoView = () => {};
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		ns: ['common', 'billing'],
		defaultNS: 'common',
		resources: { en: { common: { actions: { cancel: 'Cancel' } }, billing: en } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

beforeEach(() => {
	vi.clearAllMocks();
	mockListPublished.mockResolvedValue({
		connections: [{ id: 'conn_rzp', name: 'Razorpay prod', provider_type: 'razorpay' }],
	});
	mockCreatePayment.mockResolvedValue({ id: 'pay_1', payment_status: 'PROCESSING' });
});

const renderDialog = () =>
	render(
		<QueryClientProvider client={new QueryClient()}>
			<I18nextProvider i18n={testI18n}>
				<RecordPaymentTopup
					isOpen
					onOpenChange={vi.fn()}
					destination_id='inv_1'
					destination_type={PAYMENT_DESTINATION_TYPE.INVOICE}
					customer_id='cust_1'
					max_amount={88500}
					currency='INR'
				/>
			</I18nextProvider>
		</QueryClientProvider>,
	);

const choose = async (comboboxIndex: number, optionName: string) => {
	const user = userEvent.setup();
	await user.click(screen.getAllByRole('combobox')[comboboxIndex]);
	await user.click(await screen.findByRole('option', { name: new RegExp(optionName) }));
};

describe('RecordPaymentTopup charge saved card', () => {
	it('charges the saved card through the selected gateway', async () => {
		renderDialog();
		await waitFor(() => expect(mockListPublished).toHaveBeenCalled());

		await choose(0, 'Charge Saved Card');
		await choose(1, 'Razorpay');
		await userEvent.click(screen.getByRole('button', { name: 'Record' }));

		await waitFor(() => expect(mockCreatePayment).toHaveBeenCalled());
		expect(mockCreatePayment.mock.calls[0][0]).toMatchObject({
			amount: 88500,
			currency: 'INR',
			destination_id: 'inv_1',
			payment_method_type: 'CARD',
			payment_gateway: 'razorpay',
			process_payment: true,
		});
		expect(mockToastSuccess).toHaveBeenCalledWith(en.payments.chargeSubmitted);
	});

	it('still creates a payment link through the selected gateway', async () => {
		mockCreatePayment.mockResolvedValue({ id: 'pay_2', payment_status: 'PENDING' });
		renderDialog();
		await waitFor(() => expect(mockListPublished).toHaveBeenCalled());

		await choose(0, 'Payment Link');
		await choose(1, 'Razorpay');
		await userEvent.click(screen.getByRole('button', { name: 'Record' }));

		await waitFor(() => expect(mockCreatePayment).toHaveBeenCalled());
		expect(mockCreatePayment.mock.calls[0][0]).toMatchObject({ payment_method_type: 'PAYMENT_LINK', payment_gateway: 'razorpay' });
	});

	it('hides the charge option without a Stripe or Razorpay connection', async () => {
		mockListPublished.mockResolvedValue({ connections: [{ id: 'conn_nomod', name: 'Nomod', provider_type: 'nomod' }] });
		renderDialog();
		await waitFor(() => expect(mockListPublished).toHaveBeenCalled());

		await userEvent.setup().click(screen.getAllByRole('combobox')[0]);
		expect(await screen.findByRole('option', { name: /Payment Link/ })).toBeInTheDocument();
		expect(screen.queryByRole('option', { name: /Charge Saved Card/ })).not.toBeInTheDocument();
	});
});
