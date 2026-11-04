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

const { mockCreatePayment, mockListPublished, mockToastSuccess, mockGetPaymentMethods, mockToastError } = vi.hoisted(() => ({
	mockGetPaymentMethods: vi.fn(),
	mockToastError: vi.fn(),
	mockCreatePayment: vi.fn(),
	mockListPublished: vi.fn(),
	mockToastSuccess: vi.fn(),
}));

vi.mock('@/api/PaymentApi', () => ({ default: { createPayment: mockCreatePayment } }));
vi.mock('@/api/ConnectionApi', () => ({ default: { ListPublished: mockListPublished } }));
vi.mock('@/api/CustomerApi', () => ({ default: { getPaymentMethods: mockGetPaymentMethods } }));
vi.mock('@/api/WalletApi', () => ({ default: { getCustomerWallets: vi.fn().mockResolvedValue([]) } }));
vi.mock('react-hot-toast', () => ({ default: { success: mockToastSuccess, error: mockToastError } }));
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
	mockGetPaymentMethods.mockResolvedValue(methods([card]));
});

const card = {
	id: 'token_card',
	type: 'CARD',
	status: 'ACTIVE',
	can_auto_charge: true,
	is_default: false,
	card: { last4: '1198', brand: 'Visa' },
};
const upi = { id: 'token_upi', type: 'UPI', status: 'ACTIVE', can_auto_charge: true, is_default: false, upi: { vpa: 'acme@okhdfc' } };
const methods = (items: object[]) => ({ providers: [{ provider: 'razorpay', items }] });

const renderDialog = (currency = 'INR') =>
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
					currency={currency}
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

		await choose(0, 'Charge Saved Method');
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
		expect(mockCreatePayment.mock.calls[0][0]).not.toHaveProperty('payment_method_id');
		expect(mockToastSuccess).toHaveBeenCalledWith(en.payments.chargeSubmitted);
	});

	it('shows the Razorpay settlement hint only for Razorpay', async () => {
		mockListPublished.mockResolvedValue({
			connections: [
				{ id: 'conn_rzp', name: 'Razorpay prod', provider_type: 'razorpay' },
				{ id: 'conn_stripe', name: 'Stripe prod', provider_type: 'stripe' },
			],
		});
		renderDialog();
		await waitFor(() => expect(mockListPublished).toHaveBeenCalled());

		await choose(0, 'Charge Saved Method');
		await choose(1, 'Stripe');
		expect(screen.queryByText(new RegExp(en.payments.chargeSavedCardRazorpayHint.slice(0, 20)))).not.toBeInTheDocument();

		await choose(1, 'Razorpay');
		expect(screen.getByText(new RegExp(en.payments.chargeSavedCardRazorpayHint.slice(0, 20)))).toBeInTheDocument();
	});

	it('charges the chosen UPI mandate', async () => {
		mockGetPaymentMethods.mockResolvedValue(methods([card, upi]));
		renderDialog();
		await waitFor(() => expect(mockListPublished).toHaveBeenCalled());

		await choose(0, 'Charge Saved Method');
		await choose(1, 'Razorpay');
		await choose(2, 'UPI \\(acme@okhdfc\\)');
		await userEvent.click(screen.getByRole('button', { name: 'Record' }));

		await waitFor(() => expect(mockCreatePayment).toHaveBeenCalled());
		expect(mockGetPaymentMethods).toHaveBeenCalledWith('cust_1', 'razorpay');
		expect(mockCreatePayment.mock.calls[0][0]).toMatchObject({
			payment_method_type: 'UPI',
			payment_gateway: 'razorpay',
		});
	});

	it('charges the exact Stripe card chosen', async () => {
		const otherCard = { ...card, id: 'pm_other', card: { last4: '4242', brand: 'Visa' } };
		mockListPublished.mockResolvedValue({ connections: [{ id: 'conn_stripe', name: 'Stripe prod', provider_type: 'stripe' }] });
		mockGetPaymentMethods.mockResolvedValue({ providers: [{ provider: 'stripe', items: [card, otherCard] }] });
		renderDialog();
		await waitFor(() => expect(mockListPublished).toHaveBeenCalled());

		await choose(0, 'Charge Saved Method');
		await choose(1, 'Stripe');
		await choose(2, '4242');
		await userEvent.click(screen.getByRole('button', { name: 'Record' }));

		await waitFor(() => expect(mockCreatePayment).toHaveBeenCalled());
		expect(mockCreatePayment.mock.calls[0][0]).toMatchObject({
			payment_method_type: 'CARD',
			payment_method_id: 'pm_other',
			payment_gateway: 'stripe',
		});
	});

	it('groups several Razorpay card mandates into one option', async () => {
		mockGetPaymentMethods.mockResolvedValue(methods([card, { ...card, id: 'token_card_2' }]));
		renderDialog();
		await waitFor(() => expect(mockListPublished).toHaveBeenCalled());

		await choose(0, 'Charge Saved Method');
		await choose(1, 'Razorpay');
		await userEvent.setup().click(screen.getAllByRole('combobox')[2]);
		expect(await screen.findAllByRole('option', { name: /Card \(2 mandates\)/ })).toHaveLength(1);
	});

	it('reports a charge that comes back failed', async () => {
		mockCreatePayment.mockResolvedValue({ id: 'pay_3', payment_status: 'FAILED', error_message: 'card declined' });
		renderDialog();
		await waitFor(() => expect(mockListPublished).toHaveBeenCalled());

		await choose(0, 'Charge Saved Method');
		await choose(1, 'Razorpay');
		await userEvent.click(screen.getByRole('button', { name: 'Record' }));

		await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('card declined'));
		expect(mockToastSuccess).not.toHaveBeenCalled();
	});

	it('blocks the charge when no saved method can be charged', async () => {
		mockGetPaymentMethods.mockResolvedValue(methods([{ ...card, can_auto_charge: false }]));
		renderDialog();
		await waitFor(() => expect(mockListPublished).toHaveBeenCalled());

		await choose(0, 'Charge Saved Method');
		await choose(1, 'Razorpay');

		expect((await screen.findAllByText(en.payments.noChargeableMethod)).length).toBeGreaterThan(0);
		expect(screen.getByRole('button', { name: 'Record' })).toBeDisabled();
		expect(mockCreatePayment).not.toHaveBeenCalled();
	});

	it('offers Razorpay for saved-method charges only on INR invoices', async () => {
		mockListPublished.mockResolvedValue({
			connections: [
				{ id: 'conn_rzp', name: 'Razorpay prod', provider_type: 'razorpay' },
				{ id: 'conn_stripe', name: 'Stripe prod', provider_type: 'stripe' },
			],
		});
		renderDialog('USD');
		await waitFor(() => expect(mockListPublished).toHaveBeenCalled());

		await choose(0, 'Charge Saved Method');
		await userEvent.setup().click(screen.getAllByRole('combobox')[1]);
		expect(await screen.findByRole('option', { name: 'Stripe' })).toBeInTheDocument();
		expect(screen.queryByRole('option', { name: 'Razorpay' })).not.toBeInTheDocument();
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
		expect(screen.queryByRole('option', { name: /Charge Saved Method/ })).not.toBeInTheDocument();
	});
});
