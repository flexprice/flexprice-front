import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import enBilling from '@/i18n/locales/en/billing.json';
import enCommon from '@/i18n/locales/en/common.json';
import { Dialog } from '@/components/ui';
import { CONNECTION_PROVIDER_TYPE } from '@/models';
import TopupCard from './WalletTopupCard';

const { mockTopupWallet, mockListPublished, mockToastError, mockToastSuccess } = vi.hoisted(() => ({
	mockTopupWallet: vi.fn(),
	mockListPublished: vi.fn(),
	mockToastError: vi.fn(),
	mockToastSuccess: vi.fn(),
}));

vi.mock('@/api/WalletApi', () => ({
	default: { topupWallet: mockTopupWallet },
}));
vi.mock('@/api/ConnectionApi', () => ({
	default: { ListPublished: mockListPublished },
}));
vi.mock('react-hot-toast', () => ({ default: { success: mockToastSuccess, error: mockToastError } }));
vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({ refetchQueries: vi.fn().mockResolvedValue(undefined) }));

const RAZORPAY_CONNECTION = { id: 'conn_razorpay', provider_type: CONNECTION_PROVIDER_TYPE.RAZORPAY, name: 'Razorpay' };

const BLOCKING_SESSION = {
	id: 'cs_existing',
	checkout_status: 'pending',
	expires_at: '2026-01-01T10:00:00Z',
	payment_action: { type: 'checkout_url', url: 'https://checkout.test/existing' },
	entity_creation_result: { status: 'failed_already_exists', entity_id: 'cs_existing' },
};

// Rendered through the real locale files, so a missing key surfaces here as the
// raw `wallet.pendingCheckout.title` string rather than passing silently.
let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['billing', 'common'],
		defaultNS: 'billing',
		resources: { en: { billing: enBilling, common: enCommon } },
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

beforeEach(() => {
	vi.clearAllMocks();
	// No connected payment provider by default -- individual tests override this
	// when they care about the Checkout link's visibility.
	mockListPublished.mockResolvedValue({ connections: [] });
});

const renderTopupCard = () => {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return render(
		<QueryClientProvider client={client}>
			<I18nextProvider i18n={testI18n}>
				{/* TopupCard renders a DialogContent, which Radix requires a root for. */}
				<Dialog open>
					<TopupCard walletId='wallet_1' currency='USD' conversion_rate={1} />
				</Dialog>
			</I18nextProvider>
		</QueryClientProvider>,
	);
};

describe('WalletTopupCard retry after a failed top-up', () => {
	it('clears the reference ID (the request idempotency key) after a failed attempt, so a retry does not resend the same key', async () => {
		mockTopupWallet.mockRejectedValueOnce(new Error('A wallet transaction with this idempotency key already exists'));
		mockTopupWallet.mockResolvedValueOnce({ wallet: undefined });

		const user = userEvent.setup();
		renderTopupCard();

		await user.click(screen.getByText('Purchased'));
		await user.type(screen.getByPlaceholderText('credits'), '100');
		await user.type(screen.getByPlaceholderText('Enter reference ID'), 'REF-1');

		await user.click(screen.getByRole('button', { name: 'Skip invoice' }));

		await waitFor(() => expect(mockToastError).toHaveBeenCalled());
		expect(mockTopupWallet).toHaveBeenNthCalledWith(1, expect.objectContaining({ idempotency_key: 'REF-1' }));

		// The failed attempt must not leave the same idempotency key sitting in the field --
		// otherwise every retry resubmits it and gets rejected as a duplicate forever.
		await waitFor(() => expect(screen.getByPlaceholderText('Enter reference ID')).toHaveValue(''));

		await user.click(screen.getByRole('button', { name: 'Skip invoice' }));

		await waitFor(() => expect(mockToastSuccess).toHaveBeenCalled());
		expect(mockTopupWallet).toHaveBeenNthCalledWith(2, expect.objectContaining({ idempotency_key: undefined }));
	});
});

describe('WalletTopupCard checkout visibility', () => {
	it('hides the Checkout link when only a Stripe connection is published (checkout hard-codes razorpay)', async () => {
		mockListPublished.mockResolvedValue({
			connections: [{ id: 'conn_1', provider_type: CONNECTION_PROVIDER_TYPE.STRIPE, name: 'Stripe' }],
		});

		const user = userEvent.setup();
		renderTopupCard();
		await user.click(screen.getByText('Purchased'));

		await waitFor(() => expect(mockListPublished).toHaveBeenCalled());
		expect(screen.getByRole('button', { name: 'Skip invoice' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Checkout link' })).not.toBeInTheDocument();
	});

	it('hides the Checkout link when no connections are published at all', async () => {
		const user = userEvent.setup();
		renderTopupCard();
		await user.click(screen.getByText('Purchased'));

		await waitFor(() => expect(mockListPublished).toHaveBeenCalled());
		expect(screen.queryByRole('button', { name: 'Checkout link' })).not.toBeInTheDocument();
	});

	it('shows the Checkout link when a Razorpay connection is published', async () => {
		mockListPublished.mockResolvedValue({ connections: [RAZORPAY_CONNECTION] });

		const user = userEvent.setup();
		renderTopupCard();
		await user.click(screen.getByText('Purchased'));

		await waitFor(() => expect(screen.getByRole('button', { name: 'Checkout link' })).toBeInTheDocument());
	});
});

/** Purchased credits is what unlocks the checkout exit; free credits never bill. */
const startCheckout = async (credits: string) => {
	await userEvent.click(await screen.findByText('Purchased'));
	await userEvent.type(screen.getByPlaceholderText('credits'), credits);
	await userEvent.click(await screen.findByRole('button', { name: /checkout link/i }));
};

describe('WalletTopupCard checkout conflicts', () => {
	let openSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Checkout is only reachable with Razorpay connected.
		mockListPublished.mockResolvedValue({ connections: [RAZORPAY_CONNECTION] });
		openSpy = vi.fn().mockReturnValue({} as Window);
		vi.stubGlobal('open', openSpy);
	});

	// The blocked response is a 200 carrying a live session for a different
	// top-up. Treating it as this call's result handed the operator a checkout
	// link for an amount the customer never asked for.
	it('does not hand out the blocking session as if it were the new checkout', async () => {
		mockTopupWallet.mockResolvedValue({ checkout_session: BLOCKING_SESSION });

		renderTopupCard();
		await startCheckout('100');

		expect(await screen.findByText('A checkout is already pending for this wallet')).toBeInTheDocument();
		expect(screen.getByText('cs_existing')).toBeInTheDocument();
		expect(openSpy).not.toHaveBeenCalled();
	});

	it('supersedes only on the operator’s confirmation', async () => {
		mockTopupWallet.mockResolvedValue({ checkout_session: BLOCKING_SESSION });

		renderTopupCard();
		await startCheckout('100');
		await screen.findByText('A checkout is already pending for this wallet');

		expect(mockTopupWallet.mock.calls[0][0].checkout?.entity_creation_options).toBeUndefined();

		mockTopupWallet.mockResolvedValue({
			checkout_session: {
				id: 'cs_new',
				payment_action: { type: 'checkout_url', url: 'https://checkout.test/new' },
				entity_creation_result: { status: 'superseded', entity_id: 'cs_new' },
			},
		});
		await userEvent.click(screen.getByRole('button', { name: /cancel it and start a new checkout/i }));

		await waitFor(() => expect(mockTopupWallet).toHaveBeenCalledTimes(2));
		expect(mockTopupWallet.mock.calls[1][0].checkout?.entity_creation_options).toEqual({
			entity_creation_conflict_policies: { on_existing_entity: 'supersede' },
		});
		await waitFor(() => expect(openSpy).toHaveBeenCalledWith('https://checkout.test/new', '_blank', expect.any(String)));
	});

	// payment_action.url is what the API sends; the card previously read only
	// redirect_url and payment_url, neither of which exists on the response.
	it('reads the checkout link from payment_action.url', async () => {
		mockTopupWallet.mockResolvedValue({
			checkout_session: { id: 'cs_new', payment_action: { type: 'checkout_url', url: 'https://checkout.test/new' } },
		});

		renderTopupCard();
		await startCheckout('100');

		await waitFor(() => expect(openSpy).toHaveBeenCalledWith('https://checkout.test/new', '_blank', expect.any(String)));
	});
});
