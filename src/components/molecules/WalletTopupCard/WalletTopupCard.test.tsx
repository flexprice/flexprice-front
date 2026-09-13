import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enBilling from '@/i18n/locales/en/billing.json';
import enCommon from '@/i18n/locales/en/common.json';
import { Dialog } from '@/components/ui';
import TopupCard from './WalletTopupCard';
import WalletApi from '@/api/WalletApi';

vi.mock('@/api/WalletApi', () => ({ default: { topupWallet: vi.fn() } }));

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({
	refetchQueries: vi.fn().mockResolvedValue(undefined),
}));

const BLOCKING_SESSION = {
	id: 'cs_existing',
	checkout_status: 'pending',
	expires_at: '2026-01-01T10:00:00Z',
	payment_action: { type: 'checkout_url', url: 'https://checkout.test/existing' },
	entity_creation_result: { status: 'failed_already_exists', entity_id: 'cs_existing' },
};

// Rendered through the real locale files, so a missing key surfaces here as the
// raw `wallet.pendingCheckout.title` string rather than passing silently.
const renderCard = () => {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	const i18n = createInstance();
	i18n.init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['billing', 'common'],
		defaultNS: 'billing',
		resources: { en: { billing: enBilling, common: enCommon } },
		interpolation: { escapeValue: false },
	});
	return render(
		<I18nextProvider i18n={i18n}>
			<QueryClientProvider client={client}>
				{/* TopupCard renders a DialogContent, which Radix requires a root for. */}
				<Dialog open>
					<TopupCard walletId='wallet_1' currency='USD' conversion_rate={1} />
				</Dialog>
			</QueryClientProvider>
		</I18nextProvider>,
	);
};

/** Purchased credits is what unlocks the checkout exit; free credits never bill. */
const startCheckout = async (credits: string) => {
	await userEvent.click(await screen.findByText('Purchased'));
	await userEvent.type(screen.getByPlaceholderText('credits'), credits);
	await userEvent.click(screen.getByRole('button', { name: /checkout link/i }));
};

describe('WalletTopupCard checkout conflicts', () => {
	let openSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
		openSpy = vi.fn().mockReturnValue({} as Window);
		vi.stubGlobal('open', openSpy);
	});

	// The blocked response is a 200 carrying a live session for a different
	// top-up. Treating it as this call's result handed the operator a checkout
	// link for an amount the customer never asked for.
	it('does not hand out the blocking session as if it were the new checkout', async () => {
		vi.mocked(WalletApi.topupWallet).mockResolvedValue({ checkout_session: BLOCKING_SESSION } as never);

		renderCard();
		await startCheckout('100');

		expect(await screen.findByText('A checkout is already pending for this wallet')).toBeInTheDocument();
		expect(screen.getByText('cs_existing')).toBeInTheDocument();
		expect(openSpy).not.toHaveBeenCalled();
	});

	it('supersedes only on the operator’s confirmation', async () => {
		vi.mocked(WalletApi.topupWallet).mockResolvedValue({ checkout_session: BLOCKING_SESSION } as never);

		renderCard();
		await startCheckout('100');
		await screen.findByText('A checkout is already pending for this wallet');

		expect(vi.mocked(WalletApi.topupWallet).mock.calls[0][0].checkout?.entity_creation_options).toBeUndefined();

		vi.mocked(WalletApi.topupWallet).mockResolvedValue({
			checkout_session: {
				id: 'cs_new',
				payment_action: { type: 'checkout_url', url: 'https://checkout.test/new' },
				entity_creation_result: { status: 'superseded', entity_id: 'cs_new' },
			},
		} as never);
		await userEvent.click(screen.getByRole('button', { name: /cancel it and start a new checkout/i }));

		await waitFor(() => expect(WalletApi.topupWallet).toHaveBeenCalledTimes(2));
		expect(vi.mocked(WalletApi.topupWallet).mock.calls[1][0].checkout?.entity_creation_options).toEqual({
			entity_creation_conflict_policies: { on_existing_entity: 'supersede' },
		});
		await waitFor(() => expect(openSpy).toHaveBeenCalledWith('https://checkout.test/new', '_blank', expect.any(String)));
	});

	// payment_action.url is what the API sends; the card previously read only
	// redirect_url and payment_url, neither of which exists on the response.
	it('reads the checkout link from payment_action.url', async () => {
		vi.mocked(WalletApi.topupWallet).mockResolvedValue({
			checkout_session: { id: 'cs_new', payment_action: { type: 'checkout_url', url: 'https://checkout.test/new' } },
		} as never);

		renderCard();
		await startCheckout('100');

		await waitFor(() => expect(openSpy).toHaveBeenCalledWith('https://checkout.test/new', '_blank', expect.any(String)));
	});
});
