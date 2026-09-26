import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { INVOICE_STATUS, INVOICE_TYPE } from '@/models/Invoice';
import type { InvoiceListItem } from '@/types/dto';
import InvoiceTableMenu from './InvoiceTableMenu';

/**
 * Recomputing a draft rewrites it from current pricing and usage. The gating matters as much as
 * the call: the endpoint only accepts a DRAFT, and only a subscription invoice has usage behind
 * it — so the action must not be offered anywhere else.
 */
const { mockCompute, mockRecalculate } = vi.hoisted(() => ({
	mockCompute: vi.fn().mockResolvedValue({}),
	mockRecalculate: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/api/InvoiceApi', () => ({
	default: {
		computeInvoice: mockCompute,
		recalculateInvoice: mockRecalculate,
		triggerCommunication: vi.fn(),
		downloadInvoicePdf: vi.fn(),
		downloadInvoiceCsv: vi.fn(),
	},
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('react-router', async () => {
	const actual = await vi.importActual('react-router');
	return { ...actual, useNavigate: () => vi.fn() };
});
vi.mock('@/hooks/useCurrentUserPermissions', () => ({ useCurrentUserPermissions: () => ({ can: () => true }) }));
vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({ refetchQueries: vi.fn() }));
vi.mock('@/core/services/tanstack/queryKeys', () => ({ refetchInvoiceQueries: vi.fn() }));

let testI18n: I18nInstance;
beforeAll(async () => {
	const instance = createInstance();
	await instance.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['billing', 'common'],
		defaultNS: 'billing',
		resources: {
			en: {
				common: { actions: { cancel: 'Cancel', copyId: 'Copy ID' } },
				billing: {
					invoices: {
						writeDenied: 'No permission',
						edit: { menuLabel: 'Edit Invoice', menuDisabledStatus: 'Not editable' },
						recompute: {
							menuLabel: 'Recalculate Invoice',
							menuDisabledStatus: 'Only draft, skipped or finalized invoices can be recalculated',
							menuDisabledAlready: 'Already replaced',
							confirmDescriptionFinalized: 'This invoice will be voided and replaced.',
							replacementQueued: 'Replacement queued',
							menuDisabledType: 'Only subscription invoices can be recalculated',
							confirmTitle: 'Recalculate this invoice?',
							confirmDescription: 'Line items and totals will be recomputed.',
							confirmAction: 'Recalculate',
							success: 'Invoice recalculated',
							failed: 'Unable to recalculate invoice',
						},
					},
				},
			},
		},
		interpolation: { escapeValue: false },
	});
	testI18n = instance;
});

const invoice = (over: Partial<InvoiceListItem> = {}) =>
	({
		id: 'inv_1',
		customer_id: 'cust_1',
		subscription_id: 'subs_1',
		invoice_status: INVOICE_STATUS.DRAFT,
		invoice_type: INVOICE_TYPE.SUBSCRIPTION,
		amount_remaining: 0,
		currency: 'usd',
		...over,
	}) as unknown as InvoiceListItem;

const renderMenu = async (data: InvoiceListItem) => {
	const user = userEvent.setup();
	const client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
	render(
		<QueryClientProvider client={client}>
			<I18nextProvider i18n={testI18n}>
				<InvoiceTableMenu data={data} />
			</I18nextProvider>
		</QueryClientProvider>,
	);
	// Radix opens on pointer events, so the kebab needs a real user-event click.
	await user.click(screen.getAllByRole('button')[0]);
	await screen.findByText('Recalculate Invoice');
	return user;
};

beforeEach(() => vi.clearAllMocks());

describe('InvoiceTableMenu — recalculate a draft from usage', () => {
	it('confirms before recomputing, then calls compute for that invoice', async () => {
		const user = await renderMenu(invoice());
		await user.click(screen.getByText('Recalculate Invoice'));

		await screen.findByText('Recalculate this invoice?');
		expect(mockCompute).not.toHaveBeenCalled(); // nothing fires until confirmed

		await user.click(screen.getByRole('button', { name: 'Recalculate' }));
		await waitFor(() => expect(mockCompute).toHaveBeenCalledWith('inv_1'));
		// the replace-a-finalized-invoice action is a different endpoint and must stay untouched
		expect(mockRecalculate).not.toHaveBeenCalled();
	});

	it('does not recompute when the dialog is cancelled', async () => {
		const user = await renderMenu(invoice());
		await user.click(screen.getByText('Recalculate Invoice'));
		await screen.findByText('Recalculate this invoice?');

		await user.click(screen.getByRole('button', { name: 'Cancel' }));
		expect(mockCompute).not.toHaveBeenCalled();
	});

	it('recalculates a FINALIZED invoice through the replacement endpoint instead', async () => {
		const user = await renderMenu(invoice({ invoice_status: INVOICE_STATUS.FINALIZED }));
		await user.click(screen.getByText('Recalculate Invoice'));
		await screen.findByText('This invoice will be voided and replaced.');

		await user.click(screen.getByRole('button', { name: 'Recalculate' }));
		await waitFor(() => expect(mockRecalculate).toHaveBeenCalledWith('inv_1'));
		// a finalized invoice must never be sent to /compute — the backend 400s on it
		expect(mockCompute).not.toHaveBeenCalled();
	});

	it('is disabled once a replacement already exists, and says why', async () => {
		const user = await renderMenu(invoice({ invoice_status: INVOICE_STATUS.FINALIZED, recalculated_invoice_id: 'inv_2' }));
		const item = screen.getByText('Recalculate Invoice');
		expect(item.closest('[aria-disabled]')).toHaveAttribute('aria-disabled', 'true');
		// the reason is a Tooltip, so it only exists once the item is hovered
		await user.hover(item);
		expect(await screen.findAllByText('Already replaced')).not.toHaveLength(0);
	});

	it('is disabled for a one-off invoice — there is no usage behind it', async () => {
		const user = await renderMenu(invoice({ invoice_type: INVOICE_TYPE.ONE_OFF }));
		const item = screen.getByText('Recalculate Invoice');
		expect(item.closest('[aria-disabled]')).toHaveAttribute('aria-disabled', 'true');
		// A one-off draft IS a draft, so without its own reason this greys out unexplained.
		await user.hover(item);
		expect(await screen.findAllByText('Only subscription invoices can be recalculated')).not.toHaveLength(0);
	});
});
