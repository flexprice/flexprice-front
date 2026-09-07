import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enPortal from '@/i18n/locales/en/customer-portal.json';
import AutoTopUpWidget from './AutoTopUpWidget';
import CustomerPortalApi from '@/api/CustomerPortalApi';

vi.mock('@/api/CustomerPortalApi', () => ({
	default: { getWallets: vi.fn(), updateAutoTopup: vi.fn(), getPaymentMethods: vi.fn(), getIntegrations: vi.fn() },
}));

vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({
	refetchQueries: vi.fn().mockResolvedValue(undefined),
}));

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
				<AutoTopUpWidget />
			</QueryClientProvider>
		</I18nextProvider>,
	);
};

const CONFIGURED = {
	id: 'wallet_1',
	currency: 'USD',
	wallet_status: 'active',
	auto_topup: { enabled: true, threshold: '20', amount: '100', invoicing: true },
};

describe('AutoTopUpWidget', () => {
	beforeEach(() => {
		vi.mocked(CustomerPortalApi.updateAutoTopup).mockResolvedValue({} as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ providers: [] } as never);
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({
			payment_integrations: [{ provider: 'chargebee', capabilities: [{ type: 'payment_method_management', is_default: true }] }],
		} as never);
	});

	afterEach(() => vi.clearAllMocks());

	it('renders the empty state when the customer has no wallet', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([] as never);
		renderWidget();
		expect(await screen.findByText('No wallet')).toBeInTheDocument();
	});

	// The form seeds from the wallet on mount rather than through a syncing effect.
	it('seeds threshold and amount from the saved config', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([CONFIGURED] as never);
		renderWidget();
		expect(await screen.findByDisplayValue('20')).toBeInTheDocument();
		expect(screen.getByDisplayValue('100')).toBeInTheDocument();
	});

	it('hides the configuration fields while auto top-up is off', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([{ id: 'wallet_1', currency: 'USD', wallet_status: 'active' }] as never);
		renderWidget();
		await screen.findByRole('button', { name: /save settings/i });
		expect(screen.queryByDisplayValue('20')).not.toBeInTheDocument();
	});

	it('sends the configured threshold and amount on save', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([CONFIGURED] as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [
				{
					provider: 'chargebee',
					items: [{ id: 'pm_1', provider: 'chargebee', type: 'CARD', status: 'ACTIVE', is_default: true, can_auto_charge: true }],
				},
			],
		} as never);
		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /save settings/i }));

		await waitFor(() => expect(CustomerPortalApi.updateAutoTopup).toHaveBeenCalled());
		const [walletId, payload] = vi.mocked(CustomerPortalApi.updateAutoTopup).mock.calls[0];
		expect(walletId).toBe('wallet_1');
		expect(payload).toMatchObject({ enabled: true, threshold: '20', amount: '100' });
	});

	// The backend refuses to enable auto top-up without an auto-chargeable method,
	// so submitting without one is a guaranteed trip to an error the form knows about.
	it('blocks saving an enabled config when no card can be charged', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([CONFIGURED] as never);
		renderWidget();
		expect(await screen.findByRole('button', { name: /save settings/i })).toBeDisabled();
	});

	it('allows saving once a chargeable card exists', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([CONFIGURED] as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [
				{
					provider: 'chargebee',
					items: [{ id: 'pm_1', provider: 'chargebee', type: 'CARD', status: 'ACTIVE', is_default: true, can_auto_charge: true }],
				},
			],
		} as never);

		renderWidget();
		await waitFor(() => expect(screen.getByRole('button', { name: /save settings/i })).toBeEnabled());
	});

	// Auto-charging a saved card is meaningless without one, so the customer is told
	// rather than left with an option that silently cannot work.
	it('flags that there is no saved payment method to auto-charge', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([CONFIGURED] as never);
		renderWidget();
		expect(await screen.findByText(/no saved payment method found/i)).toBeInTheDocument();
	});

	// It explains why Save is greyed out, so it belongs beside the button rather
	// than at the top of the form with the whole configuration in between.
	it('puts the warning immediately before the save button, and only once', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([CONFIGURED] as never);
		renderWidget();

		const warning = await screen.findByText(/no saved payment method found/i);
		const save = screen.getByRole('button', { name: /save settings/i });

		expect(warning.compareDocumentPosition(save) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(screen.getAllByText(/add a payment method to enable automatic top-ups/i)).toHaveLength(1);
	});

	// Enabling auto top-up is itself the consent to be charged unattended, so no
	// invoicing flag and no auto-charge switch may be sent.
	it("sends no invoicing flag — that is the tenant's call, not the customer's", async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([CONFIGURED] as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [
				{
					provider: 'chargebee',
					items: [{ id: 'pm_1', provider: 'chargebee', type: 'CARD', status: 'ACTIVE', is_default: true, can_auto_charge: true }],
				},
			],
		} as never);

		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /save settings/i }));

		await waitFor(() => expect(CustomerPortalApi.updateAutoTopup).toHaveBeenCalled());
		const [, payload] = vi.mocked(CustomerPortalApi.updateAutoTopup).mock.calls[0];
		expect(payload).not.toHaveProperty('invoicing');
		expect(payload).not.toHaveProperty('auto_topup');
	});

	// Omitting cooldown leaves a stored one in place; value 0 is what clears it.
	// With the toggle on and the field empty the payload sends cooldown: null,
	// silently clearing the cool-off while the switch still reads as on — so Save
	// is blocked rather than quietly discarding the setting.
	it('blocks saving a cool-off that is enabled but has no value', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([CONFIGURED] as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [{ provider: 'chargebee', items: [{ id: 'pm_1', provider: 'chargebee', status: 'ACTIVE', can_auto_charge: true }] }],
		} as never);

		renderWidget();
		// Enabled and valid to begin with, so a disabled Save is attributable to the
		// cool-off alone rather than to a missing card or threshold.
		await waitFor(() => expect(screen.getByRole('button', { name: /save settings/i })).toBeEnabled());

		// Turning the cool-off on leaves its duration empty, which is exactly the
		// state that used to save a null cool-off under an on switch.
		await userEvent.click(screen.getByRole('switch', { name: /wait before the next auto top-up/i }));

		await waitFor(() => expect(screen.getByRole('button', { name: /save settings/i })).toBeDisabled());
	});

	// The server merges auto top-up field by field and only reads cooldown when the
	// pointer is non-nil, so JSON null is indistinguishable from an absent field and
	// the stored cooloff survived. Its clear branch keys off value === 0.
	it('clears a cooloff by sending a zero duration, not null', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([CONFIGURED] as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({
			providers: [
				{
					provider: 'chargebee',
					items: [{ id: 'pm_1', provider: 'chargebee', type: 'CARD', status: 'ACTIVE', is_default: true, can_auto_charge: true }],
				},
			],
		} as never);
		renderWidget();
		await userEvent.click(await screen.findByRole('button', { name: /save settings/i }));

		await waitFor(() => expect(CustomerPortalApi.updateAutoTopup).toHaveBeenCalled());
		const [, payload] = vi.mocked(CustomerPortalApi.updateAutoTopup).mock.calls[0];
		expect(payload.cooldown).toEqual({ value: 0, unit: expect.any(String) });
	});
});

// Enabling auto top-up with nothing to charge saves a config that can never fire.
describe('AutoTopUpWidget without a chargeable method', () => {
	it('blocks saving an enabled config', async () => {
		vi.mocked(CustomerPortalApi.getWallets).mockResolvedValue([
			{
				id: 'wallet_1',
				currency: 'USD',
				wallet_status: 'active',
				auto_topup: { enabled: true, threshold: '20', amount: '100', invoicing: true },
			},
		] as never);
		vi.mocked(CustomerPortalApi.getPaymentMethods).mockResolvedValue({ providers: [] } as never);
		vi.mocked(CustomerPortalApi.getIntegrations).mockResolvedValue({
			payment_integrations: [{ provider: 'chargebee', capabilities: [{ type: 'payment_method_management', is_default: true }] }],
		} as never);

		renderWidget();

		expect(await screen.findByRole('button', { name: /save settings/i })).toBeDisabled();
	});
});
