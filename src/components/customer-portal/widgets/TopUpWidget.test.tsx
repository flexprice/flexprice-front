import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enPortal from '@/i18n/locales/en/customer-portal.json';
import TopUpWidget from './TopUpWidget';
import toast from 'react-hot-toast';
import CustomerPortalApi from '@/api/CustomerPortalApi';

vi.mock('@/api/CustomerPortalApi', () => ({
	default: { getWallets: vi.fn(), topUpWallet: vi.fn(), getPaymentMethods: vi.fn(), getIntegrations: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({
	refetchQueries: vi.fn().mockResolvedValue(undefined),
}));

const WALLET = { id: 'wallet_1', currency: 'USD', wallet_status: 'active', conversion_rate: 1 };

// Rendering through the real locale file also asserts the new keys actually
// resolve — a missing key would surface here as raw `topUp.payNow` text.
const renderWidget = () => {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	const i18n = createInstance();
	i18n.init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['customer-portal'],
		defaultNS: 'customer-portal',
		resources: { en: { 'customer-portal': enPortal } },
		interpolation: { escapeValue: false },
	});
	return render(
		<I18nextProvider i18n={i18n}>
			<QueryClientProvider client={client}>
				<TopUpWidget />
			</QueryClientProvider>
		</I18nextProvider>,
	);
};

// findBy, not getBy: the form only mounts once the wallet query resolves.
const enterCredits = async (value: string) => {
	const input = await screen.findByPlaceholderText('Enter an amount');
	await userEvent.type(input, value);
};

describe('TopUpWidget', () => {
	const originalLocation = window.location;

	let openSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		openSpy = vi.fn().mockReturnValue({} as Window);
		vi.stubGlobal('open', openSpy);
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([WALLET] as never);
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({
			payment_integrations: [{ provider: 'chargebee', capabilities: [{ type: 'checkout', is_default: true }] }],
		} as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ providers: [] } as never);
		// jsdom's location is not writable; replace it so the redirect is observable.
		Object.defineProperty(window, 'location', { configurable: true, value: { href: 'https://portal.test/credits' } });
	});

	afterEach(() => {
		Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	it('renders the empty state when the customer has no wallet', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([] as never);
		renderWidget();
		expect(await screen.findByText('No wallet')).toBeInTheDocument();
	});

	it('keeps the action disabled until a positive credit amount is entered', async () => {
		renderWidget();
		const payNow = await screen.findByRole('button', { name: /pay now/i });
		expect(payNow).toBeDisabled();

		await enterCredits('25');
		await waitFor(() => expect(payNow).toBeEnabled());
	});

	// Pay now is the checkout path: the customer is charged before credits land,
	// so the widget must hand off to the returned session.
	// Both, not either: the open can be blocked, and the dialog is what the customer
	// falls back to — so the link must be on the page even when the tab opens.
	it('Pay now opens the checkout and keeps the link on the page', async () => {
		vi.mocked(CustomerPortalApi.topUpWallet).mockResolvedValue({
			checkout_session: { id: 'cs_1', payment_action: { type: 'checkout_url', url: 'https://checkout.test/session' } },
		} as never);

		renderWidget();
		await enterCredits('50');
		await userEvent.click(screen.getByRole('button', { name: /pay now/i }));

		await waitFor(() => expect(openSpy).toHaveBeenCalledWith('https://checkout.test/session', '_blank', expect.any(String)));
		expect(await screen.findByText('https://checkout.test/session')).toBeInTheDocument();
	});

	// transaction_reason is pinned server-side; the client must not send one.
	it('never sends a transaction reason, and always sends an idempotency key', async () => {
		vi.mocked(CustomerPortalApi.topUpWallet).mockResolvedValue({} as never);

		renderWidget();
		await enterCredits('10');
		await userEvent.click(screen.getByRole('button', { name: /pay now/i }));

		await waitFor(() => expect(CustomerPortalApi.topUpWallet).toHaveBeenCalled());
		const [walletId, payload] = vi.mocked(CustomerPortalApi.topUpWallet).mock.calls[0];
		expect(walletId).toBe('wallet_1');
		expect(payload.credits_to_add).toBe('10');
		expect(payload.idempotency_key).toBeTruthy();
		expect(payload).not.toHaveProperty('transaction_reason');
	});

	// The backend prices a top-up with TopupConversionRate, so quoting the spend
	// rate would show an amount the customer is not actually charged.
	it('quotes the charge using the top-up conversion rate, not the spend rate', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([{ ...WALLET, conversion_rate: 1, topup_conversion_rate: 2 }] as never);

		renderWidget();
		await enterCredits('10');

		expect(await screen.findByText(/You'll be charged \$20\.00/)).toBeInTheDocument();
	});

	it('falls back to the spend rate when no top-up rate is set', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([{ ...WALLET, conversion_rate: 3 }] as never);

		renderWidget();
		await enterCredits('10');

		expect(await screen.findByText(/You'll be charged \$30\.00/)).toBeInTheDocument();
	});

	// use_saved_method charges the card outright: the session comes back completed
	// with nothing to redirect to. Treating an absent action as failure rejected a
	// payment that had already gone through.
	it('reports success when a saved-card charge settles with no redirect', async () => {
		vi.mocked(CustomerPortalApi.topUpWallet).mockResolvedValue({
			checkout_session: { id: 'cs_1', checkout_status: 'completed' },
		} as never);

		renderWidget();
		await enterCredits('10');
		await userEvent.click(screen.getByRole('button', { name: /pay now/i }));

		await waitFor(() => expect(toast.success).toHaveBeenCalled());
		expect(toast.error).not.toHaveBeenCalled();
	});

	it('reports the gateway reason when the session failed', async () => {
		vi.mocked(CustomerPortalApi.topUpWallet).mockResolvedValue({
			checkout_session: { id: 'cs_1', checkout_status: 'failed', failure_reason: 'card declined' },
		} as never);

		renderWidget();
		await enterCredits('10');
		await userEvent.click(screen.getByRole('button', { name: /pay now/i }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith('card declined'));
	});

	// Still settling with nowhere to send them: the wallet updates on the webhook,
	// so neither outcome may be claimed.
	it('reports a pending session as in flight, not as a failure', async () => {
		vi.mocked(CustomerPortalApi.topUpWallet).mockResolvedValue({
			checkout_session: { id: 'cs_1', checkout_status: 'pending' },
		} as never);

		renderWidget();
		await enterCredits('10');
		await userEvent.click(screen.getByRole('button', { name: /pay now/i }));

		await waitFor(() => expect(toast.success).toHaveBeenCalled());
		expect(toast.error).not.toHaveBeenCalled();
	});

	// The saved-card option stays visible but disabled when nothing can use it, so
	// the customer sees a state to resolve rather than a missing feature.
	it('disables the saved-card toggle when no provider can charge off-session', async () => {
		renderWidget();
		await screen.findByRole('button', { name: /pay now/i });

		// findBy, not getBy: supports() is false while /integrations is in flight, so
		// a synchronous read would pass on the loading state rather than the answer.
		expect(await screen.findByText(/does not support charging a saved card/i)).toBeInTheDocument();
		expect(screen.getByRole('switch')).toBeDisabled();
	});

	it('explains a missing saved card separately from an unsupported provider', async () => {
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({
			payment_integrations: [
				{
					provider: 'chargebee',
					capabilities: [
						{ type: 'checkout', is_default: true },
						{ type: 'auto_charge', is_default: true },
					],
				},
			],
		} as never);

		renderWidget();
		await screen.findByRole('button', { name: /pay now/i });

		expect(await screen.findByText(/no saved card yet/i)).toBeInTheDocument();
		expect(screen.getByRole('switch')).toBeDisabled();
	});

	// The resolver refuses to guess between two capable gateways, returning
	// "Specify which payment provider to use", so one is always named.
	it('names the checkout provider explicitly', async () => {
		vi.mocked(CustomerPortalApi.topUpWallet).mockResolvedValue({} as never);

		renderWidget();
		await enterCredits('10');
		await userEvent.click(screen.getByRole('button', { name: /pay now/i }));

		await waitFor(() => expect(CustomerPortalApi.topUpWallet).toHaveBeenCalled());
		const [, payload] = vi.mocked(CustomerPortalApi.topUpWallet).mock.calls[0];
		expect(payload.checkout?.payment_provider).toBe('chargebee');
	});

	// The customer is about to be handed to a third party, so it is named even when
	// there is only one — already selected, with nothing to decide.
	it('shows the single gateway, pre-selected, with no choice to make', async () => {
		renderWidget();
		// Awaited, not queried off the Pay now button: canCheckout is optimistic while
		// /integrations is in flight, so the button renders before the provider list.
		expect(await screen.findByText('Payment provider')).toBeInTheDocument();
		expect(screen.getByRole('radio', { name: /chargebee/i })).toHaveAttribute('aria-checked', 'true');
		// A hint inviting a choice would imply one that is not on offer.
		expect(screen.queryByText(/choose which provider/i)).not.toBeInTheDocument();
	});

	// Inline options, not a Select: a portaled listbox inside this modal={false}
	// dialog reads as an outside click and closed the dialog mid-choice.
	it('asks which gateway to use when more than one can host checkout', async () => {
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({
			payment_integrations: [
				{ provider: 'chargebee', capabilities: [{ type: 'checkout', is_default: true }] },
				{ provider: 'razorpay', capabilities: [{ type: 'checkout', is_default: false }] },
			],
		} as never);

		renderWidget();
		expect(await screen.findByText('Payment provider')).toBeInTheDocument();

		// Selectable in place, with no portaled layer to dismiss.
		const options = screen.getAllByRole('radio');
		expect(options.map((o) => o.textContent)).toEqual(['Chargebee', 'Razorpay']);
		expect(options[0]).toHaveAttribute('aria-checked', 'true');

		await userEvent.click(options[1]);
		expect(options[1]).toHaveAttribute('aria-checked', 'true');
	});

	it('sends the provider the customer picked', async () => {
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({
			payment_integrations: [
				{ provider: 'chargebee', capabilities: [{ type: 'checkout', is_default: true }] },
				{ provider: 'razorpay', capabilities: [{ type: 'checkout', is_default: false }] },
			],
		} as never);
		vi.mocked(CustomerPortalApi.topUpWallet).mockResolvedValue({} as never);

		renderWidget();
		await screen.findByText('Payment provider');
		await userEvent.click(screen.getByRole('radio', { name: 'Razorpay' }));
		await enterCredits('10');
		await userEvent.click(screen.getByRole('button', { name: /pay now/i }));

		await waitFor(() => expect(CustomerPortalApi.topUpWallet).toHaveBeenCalled());
		const [, payload] = vi.mocked(CustomerPortalApi.topUpWallet).mock.calls[0];
		expect(payload.checkout?.payment_provider).toBe('razorpay');
	});

	// Portal checkouts always vault, so no save flag may be sent from here.
	it('sends no provider config and no save-card flag', async () => {
		vi.mocked(CustomerPortalApi.topUpWallet).mockResolvedValue({} as never);

		renderWidget();
		await enterCredits('10');
		await userEvent.click(screen.getByRole('button', { name: /pay now/i }));

		await waitFor(() => expect(CustomerPortalApi.topUpWallet).toHaveBeenCalled());
		const [, payload] = vi.mocked(CustomerPortalApi.topUpWallet).mock.calls[0];
		expect(payload.checkout).not.toHaveProperty('payment_provider_config');
		expect(payload.checkout).not.toHaveProperty('save_payment_method');
	});

	// The resolver only picks for us when exactly one provider qualifies; with two
	// it refuses as ambiguous, so the provider has to be named.
	it('names the checkout provider from /integrations', async () => {
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({
			payment_integrations: [
				{ provider: 'razorpay', capabilities: [{ type: 'checkout', is_default: false }] },
				{ provider: 'chargebee', capabilities: [{ type: 'checkout', is_default: true }] },
			],
		} as never);
		vi.mocked(CustomerPortalApi.topUpWallet).mockResolvedValue({} as never);

		renderWidget();
		await enterCredits('10');
		await userEvent.click(screen.getByRole('button', { name: /pay now/i }));

		await waitFor(() => expect(CustomerPortalApi.topUpWallet).toHaveBeenCalled());
		const [, payload] = vi.mocked(CustomerPortalApi.topUpWallet).mock.calls[0];
		// The default wins over declaration order.
		expect(payload.checkout?.payment_provider).toBe('chargebee');
	});

	// Without checkout configured the request still raises an invoice and the
	// response says so. Blocking the button told the customer about the tenant's
	// payment setup — something they cannot act on — and stopped an action that works.
	it('lets the customer pay when no gateway can host a checkout', async () => {
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({ payment_integrations: [] } as never);
		vi.mocked(CustomerPortalApi.topUpWallet).mockResolvedValue({} as never);

		renderWidget();
		await enterCredits('10');

		const pay = screen.getByRole('button', { name: /pay now/i });
		await waitFor(() => expect(pay).toBeEnabled());
		expect(screen.queryByText(/online payment is not set up/i)).not.toBeInTheDocument();

		await userEvent.click(pay);
		await waitFor(() => expect(CustomerPortalApi.topUpWallet).toHaveBeenCalled());
	});
});
