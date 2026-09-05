import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enPortal from '@/i18n/locales/en/customer-portal.json';
import InvoicesWidget from './InvoicesWidget';
import CustomerPortalApi from '@/api/CustomerPortalApi';

vi.mock('@/api/CustomerPortalApi', () => ({
	default: {
		getInvoices: vi.fn(),
		getInvoice: vi.fn(),
		downloadInvoicePdf: vi.fn(),
		payInvoice: vi.fn(),
	},
}));

vi.mock('@/context/PortalConfigContext', () => ({
	usePortalConfig: () => ({ config: {} }),
}));

/** Opens a row's overflow menu and returns the menu for scoping queries. */
const openRowMenu = async (invoiceNumber: string) => {
	const row = screen.getByText(invoiceNumber).closest('tr')!;
	await userEvent.click(within(row).getByRole('button', { name: /actions for invoice/i }));
	return screen.findByRole('menu');
};

const UNPAID = {
	id: 'inv_unpaid',
	invoice_number: 'INV-000484',
	invoice_status: 'FINALIZED',
	payment_status: 'PENDING',
	total: 120,
	subtotal: 100,
	total_tax: 20,
	amount_paid: 0,
	amount_remaining: 120,
	currency: 'USD',
	created_at: '2025-08-27T00:00:00Z',
	finalized_at: '2025-08-27T00:00:00Z',
	due_date: '2099-09-27T00:00:00Z',
	period_start: '2025-08-27T00:00:00Z',
	period_end: '2025-09-27T00:00:00Z',
	line_items: [],
};

const PAID = {
	...UNPAID,
	id: 'inv_paid',
	invoice_number: 'INV-000485',
	payment_status: 'SUCCEEDED',
	amount_remaining: 0,
	amount_paid: 120,
};

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
				<InvoicesWidget />
			</QueryClientProvider>
		</I18nextProvider>,
	);
};

describe('InvoicesWidget', () => {
	const originalLocation = window.location;
	let openSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		openSpy = vi.fn().mockReturnValue({} as Window);
		vi.stubGlobal('open', openSpy);
		// jsdom's location is not writable; replace it so the redirect is observable.
		Object.defineProperty(window, 'location', { configurable: true, value: { href: 'https://portal.test/invoices' } });
		vi.mocked(CustomerPortalApi.getInvoices).mockResolvedValue({ items: [UNPAID, PAID] } as never);
		vi.mocked(CustomerPortalApi.getInvoice).mockResolvedValue({ ...UNPAID, line_items: [] } as never);
	});

	afterEach(() => {
		Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	// A draft is the tenant still deciding what to bill and can still change; a
	// voided or skipped one is no longer owed. Listing either invites the customer
	// to pay something that is not, or is no longer, a bill.
	it('lists only finalized invoices', async () => {
		vi.mocked(CustomerPortalApi.getInvoices).mockResolvedValue({
			items: [
				{ ...UNPAID, id: 'inv_draft', invoice_number: 'INV-000900', invoice_status: 'DRAFT' },
				{ ...UNPAID, id: 'inv_void', invoice_number: 'INV-000901', invoice_status: 'VOIDED' },
				{ ...UNPAID, id: 'inv_skip', invoice_number: 'INV-000902', invoice_status: 'SKIPPED' },
				{ ...UNPAID, id: 'inv_final', invoice_number: 'INV-000903', invoice_status: 'FINALIZED' },
			],
		} as never);

		renderWidget();
		expect(await screen.findByText('INV-000903')).toBeInTheDocument();
		expect(screen.queryByText('INV-000900')).not.toBeInTheDocument();
		expect(screen.queryByText('INV-000901')).not.toBeInTheDocument();
		expect(screen.queryByText('INV-000902')).not.toBeInTheDocument();
	});

	// Filtered out, not merely hidden: a customer holding nothing but drafts has no
	// invoices to show, so the tab says so rather than rendering an empty table.
	it('shows the empty state when every invoice is a draft', async () => {
		vi.mocked(CustomerPortalApi.getInvoices).mockResolvedValue({
			items: [{ ...UNPAID, id: 'inv_draft', invoice_number: 'INV-000900', invoice_status: 'DRAFT' }],
		} as never);

		renderWidget();
		expect(await screen.findByText('No invoices')).toBeInTheDocument();
	});

	// The list used to derive one symbol from invoices[0] and stamp it on every
	// row, so a USD invoice under an INR one rendered as ₹100 in the list while
	// the drawer showed $100 for the same invoice.
	it('renders each row with its own currency symbol', async () => {
		vi.mocked(CustomerPortalApi.getInvoices).mockResolvedValue({
			items: [
				{ ...UNPAID, id: 'inv_inr', invoice_number: 'INV-000490', currency: 'inr', total: 10 },
				{ ...PAID, id: 'inv_usd', invoice_number: 'INV-000491', currency: 'usd', total: 100 },
			],
		} as never);

		renderWidget();
		await screen.findByText('INV-000491');

		expect(within(screen.getByText('INV-000490').closest('tr')!).getByText(/^₹/)).toHaveTextContent('₹10');
		expect(within(screen.getByText('INV-000491').closest('tr')!).getByText(/^\$/)).toHaveTextContent('$100');
	});

	// Pay stays listed on a settled invoice but is disabled, so the row's action
	// set does not change shape between states.
	it('offers pay, view and download, with pay disabled once the invoice is settled', async () => {
		renderWidget();
		await screen.findByText('INV-000485');

		const menu = await openRowMenu('INV-000485');
		expect(within(menu).getByRole('menuitem', { name: /view invoice/i })).toBeInTheDocument();
		expect(within(menu).getByRole('menuitem', { name: /download invoice/i })).toBeInTheDocument();
		expect(within(menu).getByRole('menuitem', { name: /pay now/i })).toHaveAttribute('aria-disabled', 'true');
	});

	// Pay starts a hosted payment and hands off to the returned action URL.
	it('Pay now starts a payment and opens the returned action URL', async () => {
		vi.mocked(CustomerPortalApi.payInvoice).mockResolvedValue({
			payment_id: 'pay_1',
			invoice_id: 'inv_unpaid',
			status: 'PENDING',
			amount: '120',
			currency: 'USD',
			payment_action: { type: 'payment_link', url: 'https://pay.test/link' },
		} as never);

		renderWidget();
		await screen.findByText('INV-000484');
		const menu = await openRowMenu('INV-000484');
		await userEvent.click(within(menu).getByRole('menuitem', { name: /pay now/i }));

		await waitFor(() => expect(openSpy).toHaveBeenCalledWith('https://pay.test/link', '_blank', expect.any(String)));
	});

	// A retry must reuse the key, or the customer is charged twice for one invoice.
	it('reuses the idempotency key when the same invoice is retried', async () => {
		vi.mocked(CustomerPortalApi.payInvoice)
			.mockRejectedValueOnce(new Error('network'))
			.mockResolvedValue({ payment_id: 'pay_1', invoice_id: 'inv_unpaid', status: 'PENDING', amount: '120', currency: 'USD' } as never);

		renderWidget();
		await screen.findByText('INV-000484');

		const menu1 = await openRowMenu('INV-000484');
		await userEvent.click(within(menu1).getByRole('menuitem', { name: /pay now/i }));
		await waitFor(() => expect(CustomerPortalApi.payInvoice).toHaveBeenCalledTimes(1));

		const menu2 = await openRowMenu('INV-000484');
		await userEvent.click(within(menu2).getByRole('menuitem', { name: /pay now/i }));
		await waitFor(() => expect(CustomerPortalApi.payInvoice).toHaveBeenCalledTimes(2));

		const calls = vi.mocked(CustomerPortalApi.payInvoice).mock.calls;
		expect(calls[0][1]?.idempotency_key).toBeTruthy();
		expect(calls[1][1]?.idempotency_key).toBe(calls[0][1]?.idempotency_key);
	});

	// The link is surfaced as well as followed, so a blocked redirect still leaves
	// the customer something they can open by hand.
	it('shows the payment link in a dialog alongside the redirect', async () => {
		vi.mocked(CustomerPortalApi.payInvoice).mockResolvedValue({
			payment_id: 'pay_1',
			invoice_id: 'inv_unpaid',
			status: 'PENDING',
			amount: '120',
			currency: 'USD',
			payment_action: { type: 'payment_link', url: 'https://pay.test/link' },
		} as never);

		renderWidget();
		await screen.findByText('INV-000484');
		const menu = await openRowMenu('INV-000484');
		await userEvent.click(within(menu).getByRole('menuitem', { name: /pay now/i }));

		expect(await screen.findByText('https://pay.test/link')).toBeInTheDocument();
	});

	it('opens the detail drawer from the invoice number and loads the full invoice', async () => {
		renderWidget();
		await userEvent.click(await screen.findByText('INV-000484'));

		await waitFor(() => expect(CustomerPortalApi.getInvoice).toHaveBeenCalledWith('inv_unpaid'));
		expect(await screen.findByText('Billing period')).toBeInTheDocument();
		// Appears twice by design: as the hero label and as the closing line of the
		// subtotal → total → paid → due breakdown.
		expect(screen.getAllByText('Amount due').length).toBeGreaterThan(0);
	});

	it('shows the invoice totals breakdown in the drawer', async () => {
		renderWidget();
		await userEvent.click(await screen.findByText('INV-000484'));

		expect(await screen.findByText('Subtotal')).toBeInTheDocument();
		expect(screen.getByText('Tax')).toBeInTheDocument();
	});

	// formatAmount left ₹2 where every other portal surface shows ₹2.00.
	it('shows drawer amounts at two decimals, like the rest of the portal', async () => {
		vi.mocked(CustomerPortalApi.getInvoice).mockResolvedValue({
			...UNPAID,
			currency: 'inr',
			total: 2,
			subtotal: 2,
			line_items: [],
		} as never);

		renderWidget();
		await userEvent.click(await screen.findByText('INV-000484'));

		await waitFor(() => expect(screen.getAllByText(/₹2\.00/).length).toBeGreaterThan(0));
	});
});
