import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enPortal from '@/i18n/locales/en/customer-portal.json';
import PaymentMethodsWidget from './PaymentMethodsWidget';
import CustomerPortalApi from '@/api/CustomerPortalApi';

vi.mock('@/api/CustomerPortalApi', () => ({
	default: {
		getIntegrations: vi.fn(),
		getPaymentMethods: vi.fn(),
		addPaymentMethod: vi.fn(),
		deletePaymentMethod: vi.fn(),
		setDefaultPaymentMethod: vi.fn(),
	},
}));

vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({
	refetchQueries: vi.fn().mockResolvedValue(undefined),
}));

const FULL_CAPABILITIES = {
	payment_integrations: [
		{
			provider: 'chargebee',
			capabilities: [
				{ type: 'payment_method_management', is_default: true },
				{ type: 'set_default_method', is_default: true },
			],
		},
	],
};

const card = (over: Record<string, unknown> = {}) => ({
	id: 'pm_1',
	provider: 'chargebee',
	type: 'CARD',
	status: 'ACTIVE',
	card: { brand: 'visa', last4: '4242', exp_month: 4, exp_year: 2030 },
	is_default: true,
	can_auto_charge: true,
	...over,
});

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
				<PaymentMethodsWidget />
			</QueryClientProvider>
		</I18nextProvider>,
	);
};

describe('PaymentMethodsWidget', () => {
	const originalLocation = window.location;

	let openSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		openSpy = vi.fn().mockReturnValue({} as Window);
		vi.stubGlobal('open', openSpy);
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue(FULL_CAPABILITIES as never);
		Object.defineProperty(window, 'location', { configurable: true, value: { href: 'https://portal.test/methods' } });
	});

	afterEach(() => {
		Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	it('renders the empty state when no cards are saved', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ providers: [] } as never);
		renderWidget();
		expect(await screen.findByText('No payment methods')).toBeInTheDocument();
	});

	it('renders a saved card with brand, last4, expiry and the default badge', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [{ provider: 'chargebee', items: [card()] }],
		} as never);

		renderWidget();

		expect(await screen.findByText('visa •••• 4242')).toBeInTheDocument();
		expect(screen.getByText('Expires 04/30')).toBeInTheDocument();
		expect(screen.getByText('Default')).toBeInTheDocument();
	});

	// A provider that could not be read is not the same as one with no cards —
	// an empty list cannot express "we could not ask", and the two need different UI.
	it('distinguishes a provider that could not be read from one with no cards', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [{ provider: 'chargebee', items: [], error: { message: 'gateway timeout' } }],
		} as never);

		renderWidget();

		expect(await screen.findByText(/couldn't load/i)).toBeInTheDocument();
		expect(screen.getByText('gateway timeout')).toBeInTheDocument();
		expect(screen.queryByText('No payment methods')).not.toBeInTheDocument();
	});

	// Defaults are scoped per provider, so both fields must be sent.
	it('sends provider and method id when promoting a card to default', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [
				{
					provider: 'chargebee',
					items: [
						card(),
						// Distinct details so the second row can be targeted unambiguously.
						card({ id: 'pm_2', is_default: false, card: { brand: 'amex', last4: '0005', exp_month: 1, exp_year: 2031 } }),
					],
				},
			],
		} as never);
		vi.mocked(CustomerPortalApi.setDefaultPaymentMethod).mockResolvedValue({} as never);

		renderWidget();
		// Actions live behind a per-row menu now, matching the invoices table.
		await screen.findByText('amex •••• 0005');
		await userEvent.click(screen.getByRole('button', { name: /actions for amex/i }));
		const menu = await screen.findByRole('menu');
		await userEvent.click(within(menu).getByRole('menuitem', { name: /set as default/i }));
		await waitFor(() =>
			expect(CustomerPortalApi.setDefaultPaymentMethod).toHaveBeenCalledWith({
				payment_provider: 'chargebee',
				payment_method_id: 'pm_2',
			}),
		);
	});

	// Removing a card is destructive and irreversible, so it is confirmed first.
	it('confirms before removing a card, then sends provider and method id', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [{ provider: 'chargebee', items: [card()] }],
		} as never);
		vi.mocked(CustomerPortalApi.deletePaymentMethod).mockResolvedValue({} as never);

		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /actions for/i }));
		const menu = await screen.findByRole('menu');
		await userEvent.click(within(menu).getByRole('menuitem', { name: /remove/i }));
		expect(CustomerPortalApi.deletePaymentMethod).not.toHaveBeenCalled();

		// The row action and the dialog's confirm share a label, so scope to the dialog.
		const dialog = await screen.findByRole('dialog');
		await userEvent.click(within(dialog).getByRole('button', { name: /^remove$/i }));

		await waitFor(() =>
			expect(CustomerPortalApi.deletePaymentMethod).toHaveBeenCalledWith({
				payment_provider: 'chargebee',
				payment_method_id: 'pm_1',
			}),
		);
	});

	// A new tab, so abandoning the provider's page still leaves the portal behind;
	// the link is shown too, since the open can be blocked.
	it('opens a redirect action in a new tab and keeps the link on the page', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ providers: [] } as never);
		vi.mocked(CustomerPortalApi.addPaymentMethod).mockResolvedValue({
			provider: 'chargebee',
			action: { type: 'redirect', url: 'https://vault.test/setup' },
		} as never);

		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /add card/i }));

		await waitFor(() => expect(openSpy).toHaveBeenCalledWith('https://vault.test/setup', '_blank', expect.any(String)));
		expect(await screen.findByText('https://vault.test/setup')).toBeInTheDocument();
		// The portal must still be mounted — that is the point of not navigating.
		expect(window.location.href).toBe('https://portal.test/methods');
	});

	// type 'none' means the provider vaulted server-to-server; there is nothing to
	// redirect to and waiting for a return trip would hang the flow.
	it('does not redirect when the setup action is none', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ providers: [] } as never);
		vi.mocked(CustomerPortalApi.addPaymentMethod).mockResolvedValue({
			provider: 'chargebee',
			action: { type: 'none' },
		} as never);

		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /add card/i }));

		await waitFor(() => expect(CustomerPortalApi.addPaymentMethod).toHaveBeenCalled());
		expect(window.location.href).toBe('https://portal.test/methods');
	});

	// An integrations failure is not a capability answer — claiming "not available"
	// would state something we do not know.
	it('distinguishes an integrations failure from an unsupported account', async () => {
		vi.mocked(CustomerPortalApi.getIntegrations).mockRejectedValue(new Error('gateway down'));
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ providers: [] } as never);

		renderWidget();

		expect(await screen.findByText(/couldn't load/i)).toBeInTheDocument();
		expect(screen.queryByText(/not available/i)).not.toBeInTheDocument();
	});

	// Set as default is provider-scoped; offering it where unsupported would fail.
	it('hides Set as default for a provider that does not support it', async () => {
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({
			payment_integrations: [{ provider: 'chargebee', capabilities: [{ type: 'payment_method_management', is_default: true }] }],
		} as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [{ provider: 'chargebee', items: [card({ is_default: false })] }],
		} as never);

		renderWidget();

		await screen.findByText('visa •••• 4242');
		expect(screen.queryByRole('button', { name: /set as default/i })).not.toBeInTheDocument();
	});

	// No connected provider can manage methods, so the actions would be dead.
	it('says so when no provider supports managing payment methods', async () => {
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({ payment_integrations: [] } as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ providers: [] } as never);

		renderWidget();

		expect(await screen.findByText(/not available/i)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /add card/i })).not.toBeInTheDocument();
	});

	// Every portal empty state carries a glyph: text alone in a card sized for
	// populated data reads as a widget that failed to render.
	it('gives the empty state an icon', async () => {
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ providers: [] } as never);

		const { container } = renderWidget();
		await screen.findByText(/no payment methods|not available/i);
		expect(container.querySelector('svg')).toBeInTheDocument();
	});

	it('renders provider filter dropdown and badges when multiple providers are connected', async () => {
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({
			payment_integrations: [
				{
					provider: 'stripe',
					capabilities: [{ type: 'payment_method_management', is_default: true }],
				},
				{
					provider: 'chargebee',
					capabilities: [{ type: 'payment_method_management', is_default: false }],
				},
			],
		} as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [
				{ provider: 'stripe', items: [card({ id: 'pm_stripe', provider: 'stripe', card: { brand: 'visa', last4: '4242' } })] },
				{ provider: 'chargebee', items: [card({ id: 'pm_cb', provider: 'chargebee', card: { brand: 'mastercard', last4: '5555' } })] },
			],
		} as never);

		renderWidget();

		// Wait for data to load
		expect(await screen.findByText('visa •••• 4242')).toBeInTheDocument();
		expect(screen.getByText('mastercard •••• 5555')).toBeInTheDocument();

		// Check filter dropdown trigger exists to the left of Add card
		const filterTrigger = screen.getByRole('button', { name: /^All providers\s+\(2\)$/i });
		expect(filterTrigger).toBeInTheDocument();

		// Check provider badges on cards
		expect(screen.getByText('Stripe')).toBeInTheDocument();
		expect(screen.getByText('Chargebee')).toBeInTheDocument();

		// Open filter dropdown and select Stripe
		await userEvent.click(filterTrigger);
		const menu = await screen.findByRole('menu');
		await userEvent.click(within(menu).getByRole('menuitem', { name: /^Stripe\s+\(1\)$/i }));

		expect(screen.getByText('visa •••• 4242')).toBeInTheDocument();
		expect(screen.queryByText('mastercard •••• 5555')).not.toBeInTheDocument();

		// Open filter dropdown and select Chargebee
		const stripeTrigger = screen.getByRole('button', { name: /^Stripe\s+\(1\)$/i });
		await userEvent.click(stripeTrigger);
		const menu2 = await screen.findByRole('menu');
		await userEvent.click(within(menu2).getByRole('menuitem', { name: /^Chargebee\s+\(1\)$/i }));

		expect(screen.queryByText('visa •••• 4242')).not.toBeInTheDocument();
		expect(screen.getByText('mastercard •••• 5555')).toBeInTheDocument();
	});

	it('resets the provider filter to all when the selected provider is removed', async () => {
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({
			payment_integrations: [
				{ provider: 'stripe', capabilities: [{ type: 'payment_method_management', is_default: true }] },
				{ provider: 'chargebee', capabilities: [{ type: 'payment_method_management', is_default: false }] },
			],
		} as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [
				{ provider: 'stripe', items: [card({ id: 'pm_stripe', provider: 'stripe', card: { brand: 'visa', last4: '4242' } })] },
				{ provider: 'chargebee', items: [card({ id: 'pm_cb', provider: 'chargebee', card: { brand: 'mastercard', last4: '5555' } })] },
			],
		} as never);
		vi.mocked(CustomerPortalApi.addPaymentMethod).mockResolvedValue({
			provider: 'chargebee',
			action: { type: 'none' },
		} as never);

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
		render(
			<I18nextProvider i18n={i18n}>
				<QueryClientProvider client={client}>
					<PaymentMethodsWidget />
				</QueryClientProvider>
			</I18nextProvider>,
		);

		await screen.findByText('visa •••• 4242');
		await userEvent.click(screen.getByRole('button', { name: /^All providers\s+\(2\)$/i }));
		const menu = await screen.findByRole('menu');
		await userEvent.click(within(menu).getByRole('menuitem', { name: /^Stripe\s+\(1\)$/i }));
		expect(await screen.findByRole('button', { name: /^Stripe\s+\(1\)$/i })).toBeInTheDocument();

		// Stripe is disabled elsewhere while the portal stays open: the integrations
		// query refreshes without it, leaving chargebee as the only manager.
		client.setQueryData(['portal-integrations'], {
			payment_integrations: [{ provider: 'chargebee', capabilities: [{ type: 'payment_method_management', is_default: false }] }],
		});

		// The filter must fall back to "all" rather than keep the Add button wired
		// to `addMethod('stripe')` for a provider that no longer exists.
		const addButton = await screen.findByRole('button', { name: /add card/i });
		await userEvent.click(addButton);
		await waitFor(() =>
			expect(CustomerPortalApi.addPaymentMethod).toHaveBeenCalledWith(expect.objectContaining({ payment_provider: 'chargebee' })),
		);
	});

	it('shows provider empty state with dedicated add button when provider has no cards', async () => {
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({
			payment_integrations: [
				{
					provider: 'stripe',
					capabilities: [{ type: 'payment_method_management', is_default: true }],
				},
				{
					provider: 'chargebee',
					capabilities: [{ type: 'payment_method_management', is_default: false }],
				},
			],
		} as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [
				{ provider: 'chargebee', items: [card({ id: 'pm_cb', provider: 'chargebee', card: { brand: 'visa', last4: '4242' } })] },
				{ provider: 'stripe', items: [] },
			],
		} as never);

		renderWidget();

		// Wait for methods to load
		expect(await screen.findByText('visa •••• 4242')).toBeInTheDocument();

		// Open filter dropdown and select Stripe
		const filterTrigger = screen.getByRole('button', { name: /^All providers\s+\(1\)$/i });
		await userEvent.click(filterTrigger);
		const menu = await screen.findByRole('menu');
		await userEvent.click(within(menu).getByRole('menuitem', { name: /^Stripe\s+\(0\)$/i }));

		expect(screen.getByText('No Stripe cards')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Add card \(Stripe\)/i })).toBeInTheDocument();
	});

	it('does not render filter dropdown or add dropdown when only one provider supports payment methods, even with duplicate connection entries', async () => {
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({
			payment_integrations: [
				{
					provider: 'stripe',
					capabilities: [{ type: 'payment_method_management', is_default: true }],
				},
				{
					provider: 'stripe',
					capabilities: [{ type: 'payment_method_management', is_default: false }],
				},
			],
		} as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [{ provider: 'stripe', items: [card({ provider: 'stripe' })] }],
		} as never);

		renderWidget();

		expect(await screen.findByText('visa •••• 4242')).toBeInTheDocument();
		// No filter dropdown
		expect(screen.queryByRole('button', { name: /all providers/i })).not.toBeInTheDocument();
		// Add card is a direct button, not a dropdown trigger
		const addBtn = screen.getByRole('button', { name: /^add card$/i });
		expect(addBtn).toBeInTheDocument();
		expect(addBtn).not.toHaveAttribute('aria-haspopup');
	});
});
