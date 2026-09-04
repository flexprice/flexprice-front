import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import billingEn from '@/i18n/locales/en/billing.json';
import commonEn from '@/i18n/locales/en/common.json';

const mockGetInvoiceById = vi.hoisted(() => vi.fn());
const mockUpdateInvoice = vi.hoisted(() => vi.fn());
const mockUpdatePaymentStatus = vi.hoisted(() => vi.fn());
const mockModifyInvoice = vi.hoisted(() => vi.fn());
const mockVoidInvoice = vi.hoisted(() => vi.fn());
const mockFinalizeInvoice = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('@/api/InvoiceApi', () => ({
	default: {
		getInvoiceById: (...args: unknown[]) => mockGetInvoiceById(...args),
		updateInvoice: (...args: unknown[]) => mockUpdateInvoice(...args),
		updateInvoicePaymentStatus: (...args: unknown[]) => mockUpdatePaymentStatus(...args),
		modifyInvoice: (...args: unknown[]) => mockModifyInvoice(...args),
		voidInvoice: (...args: unknown[]) => mockVoidInvoice(...args),
		finalizeInvoice: (...args: unknown[]) => mockFinalizeInvoice(...args),
	},
}));

vi.mock('@/store/useBreadcrumbsStore', () => ({
	useBreadcrumbsStore: () => ({ updateBreadcrumb: vi.fn(), setSegmentLoading: vi.fn() }),
}));

vi.mock('react-hot-toast', () => ({
	default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/core/services/tanstack/queryKeys', () => ({
	refetchInvoiceQueries: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({
	refetchQueries: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/components/molecules', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/components/molecules')>();
	return {
		...actual,
		InvoiceLineItemTable: () => <div data-testid='line-item-table' />,
		InvoiceStatusModal: () => <div data-testid='invoice-status-modal' />,
	};
});

vi.mock('@/components/organisms/PlanForm/SetupChargesSection', () => ({
	AddChargesButton: ({ onClick, label }: { onClick: () => void; label: string }) => <button onClick={onClick}>{label}</button>,
}));

vi.mock('@/components/atoms', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/components/atoms')>();
	return {
		...actual,
		DateTimePicker: ({ title }: { title?: string }) => <div>{title}</div>,
		// Radix Select doesn't open in jsdom; a native select keeps the page wiring testable.
		Select: ({
			label,
			value,
			options,
			onChange,
			disabled,
		}: {
			label?: string;
			value?: string;
			options: { value: string; label: string }[];
			onChange?: (value: string) => void;
			disabled?: boolean;
		}) => (
			<label>
				{label}
				<select value={value} disabled={disabled} onChange={(e) => onChange?.(e.target.value)}>
					{options.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>
			</label>
		),
	};
});

vi.mock('react-router', async () => {
	const actual = await vi.importActual('react-router');
	return {
		...actual,
		useParams: () => ({ invoiceId: 'inv_1' }),
		useNavigate: () => mockNavigate,
	};
});

import EditInvoicePage from './EditInvoicePage';

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

const renderPage = () => {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<I18nextProvider i18n={testI18n}>
				<MemoryRouter>
					<EditInvoicePage />
				</MemoryRouter>
			</I18nextProvider>
		</QueryClientProvider>,
	);
};

const makeInvoice = (overrides: Record<string, unknown> = {}) => ({
	id: 'inv_1',
	invoice_number: 'INV-001',
	customer_id: 'cust_1',
	customer: { id: 'cust_1', name: 'Acme Corp' },
	invoice_status: 'DRAFT',
	payment_status: 'PENDING',
	invoice_type: 'ONE_OFF',
	currency: 'usd',
	issue_date: '2026-08-01T00:00:00Z',
	due_date: '2026-09-30T00:00:00Z',
	invoice_pdf_url: '',
	metadata: { po_number: 'PO-42' },
	line_items: [],
	subtotal: 100,
	total: 100,
	amount_due: 100,
	amount_paid: 0,
	amount_remaining: 100,
	total_tax: 0,
	total_discount: 0,
	total_prepaid_credits_applied: 0,
	...overrides,
});

describe('EditInvoicePage', () => {
	beforeEach(() => {
		mockGetInvoiceById.mockReset();
		mockUpdateInvoice.mockReset();
		mockUpdatePaymentStatus.mockReset();
		mockModifyInvoice.mockReset();
		mockVoidInvoice.mockReset();
		mockFinalizeInvoice.mockReset();
		mockNavigate.mockReset();
	});

	it('renders invoice context and disables save until something changes', async () => {
		mockGetInvoiceById.mockResolvedValue(makeInvoice());
		renderPage();

		expect(await screen.findByText('INV-001')).toBeInTheDocument();
		expect(screen.getByText('Acme Corp')).toBeInTheDocument();
		expect(screen.getByDisplayValue('po_number')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
	});

	it('sends only the changed fields on save', async () => {
		mockGetInvoiceById.mockResolvedValue(makeInvoice());
		mockUpdateInvoice.mockResolvedValue(makeInvoice());
		const user = userEvent.setup();
		renderPage();

		const pdfInput = await screen.findByPlaceholderText('https://example.com/invoice.pdf');
		await user.type(pdfInput, 'https://example.com/inv.pdf');

		const saveButton = screen.getByRole('button', { name: 'Save Changes' });
		expect(saveButton).toBeEnabled();
		await user.click(saveButton);

		await waitFor(() => expect(mockUpdateInvoice).toHaveBeenCalledTimes(1));
		expect(mockUpdateInvoice).toHaveBeenCalledWith('inv_1', { invoice_pdf_url: 'https://example.com/inv.pdf' });
		await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/billing/invoices/inv_1'));
	});

	it('sends apply_discount for draft invoices when the checkbox is ticked', async () => {
		mockGetInvoiceById.mockResolvedValue(makeInvoice());
		mockUpdateInvoice.mockResolvedValue(makeInvoice());
		const user = userEvent.setup();
		renderPage();

		const checkbox = await screen.findByRole('checkbox');
		await user.click(checkbox);
		await user.click(screen.getByRole('button', { name: 'Save Changes' }));

		await waitFor(() => expect(mockUpdateInvoice).toHaveBeenCalledWith('inv_1', { apply_discount: true }));
	});

	it('sends the full metadata map when a row changes', async () => {
		mockGetInvoiceById.mockResolvedValue(makeInvoice());
		mockUpdateInvoice.mockResolvedValue(makeInvoice());
		const user = userEvent.setup();
		renderPage();

		const valueField = await screen.findByDisplayValue('PO-42');
		await user.clear(valueField);
		await user.type(valueField, 'PO-43');
		await user.click(screen.getByRole('button', { name: 'Save Changes' }));

		await waitFor(() => expect(mockUpdateInvoice).toHaveBeenCalledWith('inv_1', { metadata: { po_number: 'PO-43' } }));
	});

	it('updates payment status through the payment endpoint, not the invoice update', async () => {
		mockGetInvoiceById.mockResolvedValue(makeInvoice());
		mockUpdatePaymentStatus.mockResolvedValue(makeInvoice());
		const user = userEvent.setup();
		renderPage();

		const selects = await screen.findAllByRole('combobox');
		await user.selectOptions(selects[0], 'SUCCEEDED');
		await user.click(screen.getByRole('button', { name: 'Save Changes' }));

		await waitFor(() => expect(mockUpdatePaymentStatus).toHaveBeenCalledWith('inv_1', { payment_status: 'SUCCEEDED' }));
		expect(mockUpdateInvoice).not.toHaveBeenCalled();
		await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/billing/invoices/inv_1'));
	});

	it('locks the payment status select once payment has succeeded', async () => {
		mockGetInvoiceById.mockResolvedValue(makeInvoice({ payment_status: 'SUCCEEDED' }));
		renderPage();

		const selects = await screen.findAllByRole('combobox');
		expect(selects[0]).toBeDisabled();
	});

	it('voids the invoice through the status dropdown on save', async () => {
		mockGetInvoiceById.mockResolvedValue(makeInvoice());
		mockVoidInvoice.mockResolvedValue(undefined);
		const user = userEvent.setup();
		renderPage();

		const selects = await screen.findAllByRole('combobox');
		await user.selectOptions(selects[selects.length - 1], 'VOIDED');
		await user.click(screen.getByRole('button', { name: 'Save Changes' }));

		await waitFor(() => expect(mockVoidInvoice).toHaveBeenCalledWith('inv_1'));
		expect(mockUpdateInvoice).not.toHaveBeenCalled();
	});

	it('finalizes a failed draft through the status dropdown on save', async () => {
		mockGetInvoiceById.mockResolvedValue(makeInvoice({ payment_status: 'FAILED' }));
		mockFinalizeInvoice.mockResolvedValue(undefined);
		const user = userEvent.setup();
		renderPage();

		const selects = await screen.findAllByRole('combobox');
		await user.selectOptions(selects[selects.length - 1], 'FINALIZED');
		await user.click(screen.getByRole('button', { name: 'Save Changes' }));

		await waitFor(() => expect(mockFinalizeInvoice).toHaveBeenCalledWith('inv_1'));
	});

	it('blocks voiding combined with line item changes', async () => {
		mockGetInvoiceById.mockResolvedValue(
			makeInvoice({ line_items: [{ id: 'li_1', display_name: 'Consulting', quantity: '2', amount: 300 }] }),
		);
		const user = userEvent.setup();
		renderPage();

		const nameInput = await screen.findByDisplayValue('Consulting');
		await user.clear(nameInput);
		await user.type(nameInput, 'Consulting hours');
		const selects = screen.getAllByRole('combobox');
		await user.selectOptions(selects[selects.length - 1], 'VOIDED');
		await user.click(screen.getByRole('button', { name: 'Save Changes' }));

		expect(mockVoidInvoice).not.toHaveBeenCalled();
		expect(mockModifyInvoice).not.toHaveBeenCalled();
	});

	it('edits a draft line item through the modify endpoint', async () => {
		mockGetInvoiceById.mockResolvedValue(
			makeInvoice({ line_items: [{ id: 'li_1', display_name: 'Consulting', quantity: '2', amount: 300 }] }),
		);
		mockModifyInvoice.mockResolvedValue({ invoice: makeInvoice() });
		const user = userEvent.setup();
		renderPage();

		const nameInput = await screen.findByDisplayValue('Consulting');
		await user.clear(nameInput);
		await user.type(nameInput, 'Consulting hours');
		await user.click(screen.getByRole('button', { name: 'Save Changes' }));

		await waitFor(() =>
			expect(mockModifyInvoice).toHaveBeenCalledWith('inv_1', {
				type: 'line_item',
				line_item_params: { action: 'update', line_item_id: 'li_1', update: { display_name: 'Consulting hours' } },
			}),
		);
		expect(mockUpdateInvoice).not.toHaveBeenCalled();
	});

	it('adds and removes draft line items through the modify endpoint', async () => {
		mockGetInvoiceById.mockResolvedValue(
			makeInvoice({ line_items: [{ id: 'li_1', display_name: 'Consulting', quantity: '2', amount: 300 }] }),
		);
		mockModifyInvoice.mockResolvedValue({ invoice: makeInvoice() });
		const user = userEvent.setup();
		renderPage();

		// remove the existing row
		await screen.findByDisplayValue('Consulting');
		const removeButtons = screen.getAllByRole('button', { name: 'Remove line item' });
		await user.click(removeButtons[removeButtons.length - 1]);

		// add a new row
		await user.click(screen.getByRole('button', { name: 'Add Line Item' }));
		await user.type(screen.getByPlaceholderText('Enter item name'), 'Setup fee');
		const amountInputs = screen.getAllByPlaceholderText('0.00');
		await user.clear(amountInputs[amountInputs.length - 1]);
		await user.type(amountInputs[amountInputs.length - 1], '50');

		await user.click(screen.getByRole('button', { name: 'Save Changes' }));

		await waitFor(() =>
			expect(mockModifyInvoice).toHaveBeenCalledWith('inv_1', {
				type: 'line_item',
				line_item_params: { action: 'remove', line_item_ids: ['li_1'] },
			}),
		);
		expect(mockModifyInvoice).toHaveBeenCalledWith('inv_1', {
			type: 'line_item',
			line_item_params: { action: 'add', items: [{ display_name: 'Setup fee', amount: '50', quantity: '1' }] },
		});
	});

	it('lets finalized invoices edit line items behind a void-and-recreate confirmation', async () => {
		mockGetInvoiceById.mockResolvedValue(
			makeInvoice({
				invoice_status: 'FINALIZED',
				line_items: [{ id: 'li_1', display_name: 'Consulting', quantity: '2', amount: 300 }],
			}),
		);
		mockModifyInvoice.mockResolvedValue({ invoice: makeInvoice() });
		const user = userEvent.setup();
		renderPage();

		const nameInput = await screen.findByDisplayValue('Consulting');
		await user.clear(nameInput);
		await user.type(nameInput, 'Consulting hours');
		await user.click(screen.getByRole('button', { name: 'Save Changes' }));

		// No API call yet — the confirmation dialog gates the save.
		expect(mockModifyInvoice).not.toHaveBeenCalled();
		expect(await screen.findByText('Void invoice and create a new draft?')).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Void & create draft' }));
		await waitFor(() =>
			expect(mockModifyInvoice).toHaveBeenCalledWith('inv_1', {
				type: 'line_item',
				line_item_params: { action: 'update', line_item_id: 'li_1', update: { display_name: 'Consulting hours' } },
			}),
		);
	});

	it('chains finalized operations onto the recreated draft and navigates to it', async () => {
		mockGetInvoiceById.mockResolvedValue(
			makeInvoice({
				invoice_status: 'FINALIZED',
				line_items: [{ id: 'li_1', display_name: 'Consulting', quantity: '2', amount: 300 }],
			}),
		);
		// The first operation voids the invoice and returns the new draft copy.
		mockModifyInvoice.mockResolvedValue({ invoice: makeInvoice({ id: 'inv_draft_2', invoice_status: 'DRAFT' }) });
		const user = userEvent.setup();
		renderPage();

		const nameInput = await screen.findByDisplayValue('Consulting');
		await user.clear(nameInput);
		await user.type(nameInput, 'Consulting hours');
		await user.click(screen.getByRole('button', { name: 'Add Line Item' }));
		const nameInputs = screen.getAllByPlaceholderText('Enter item name');
		await user.type(nameInputs[nameInputs.length - 1], 'Setup fee');
		const amountInputs = screen.getAllByPlaceholderText('0.00');
		await user.clear(amountInputs[amountInputs.length - 1]);
		await user.type(amountInputs[amountInputs.length - 1], '50');

		await user.click(screen.getByRole('button', { name: 'Save Changes' }));
		await user.click(await screen.findByRole('button', { name: 'Void & create draft' }));

		await waitFor(() => expect(mockModifyInvoice).toHaveBeenCalledTimes(2));
		// First call hits the original invoice; the follow-up targets the returned draft.
		expect(mockModifyInvoice.mock.calls[0][0]).toBe('inv_1');
		expect(mockModifyInvoice.mock.calls[1][0]).toBe('inv_draft_2');
		await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/billing/invoices/inv_draft_2'));
	});

	it('keeps the edited form state when the finalized save fails', async () => {
		mockGetInvoiceById.mockResolvedValue(
			makeInvoice({
				invoice_status: 'FINALIZED',
				line_items: [{ id: 'li_1', display_name: 'Consulting', quantity: '2', amount: 300 }],
			}),
		);
		mockModifyInvoice.mockRejectedValue(new Error('void failed'));
		const user = userEvent.setup();
		renderPage();

		const nameInput = await screen.findByDisplayValue('Consulting');
		await user.clear(nameInput);
		await user.type(nameInput, 'Consulting hours');
		await user.click(screen.getByRole('button', { name: 'Save Changes' }));
		await user.click(await screen.findByRole('button', { name: 'Void & create draft' }));

		await waitFor(() => expect(mockModifyInvoice).toHaveBeenCalled());
		// Edits survive the failure so the user can fix and retry.
		expect(screen.getByDisplayValue('Consulting hours')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it('resumes onto the recreated draft on retry instead of replaying the completed step', async () => {
		mockGetInvoiceById.mockResolvedValue(
			makeInvoice({
				invoice_status: 'FINALIZED',
				line_items: [{ id: 'li_1', display_name: 'Consulting', quantity: '2', amount: 300 }],
			}),
		);
		mockModifyInvoice
			// The update step succeeds and voids-and-recreates the invoice.
			.mockResolvedValueOnce({ invoice: makeInvoice({ id: 'inv_draft_2', invoice_status: 'DRAFT' }) })
			// The add step fails on the first attempt.
			.mockRejectedValueOnce(new Error('add failed'))
			// The retried add step succeeds.
			.mockResolvedValueOnce({ invoice: makeInvoice({ id: 'inv_draft_2', invoice_status: 'DRAFT' }) });
		const user = userEvent.setup();
		renderPage();

		const nameInput = await screen.findByDisplayValue('Consulting');
		await user.clear(nameInput);
		await user.type(nameInput, 'Consulting hours');
		await user.click(screen.getByRole('button', { name: 'Add Line Item' }));
		const nameInputs = screen.getAllByPlaceholderText('Enter item name');
		await user.type(nameInputs[nameInputs.length - 1], 'Setup fee');
		const amountInputs = screen.getAllByPlaceholderText('0.00');
		await user.clear(amountInputs[amountInputs.length - 1]);
		await user.type(amountInputs[amountInputs.length - 1], '50');

		// First attempt: update succeeds (recreates the draft), add fails.
		await user.click(screen.getByRole('button', { name: 'Save Changes' }));
		await user.click(await screen.findByRole('button', { name: 'Void & create draft' }));
		await waitFor(() => expect(mockModifyInvoice).toHaveBeenCalledTimes(2));
		expect(mockNavigate).not.toHaveBeenCalled();

		// Retry with unchanged form state.
		await user.click(screen.getByRole('button', { name: 'Save Changes' }));
		await user.click(await screen.findByRole('button', { name: 'Void & create draft' }));

		await waitFor(() => expect(mockModifyInvoice).toHaveBeenCalledTimes(3));
		// The retry must not resend the already-completed update against the original
		// (by now voided) invoice — only the failed add re-runs, against the recreated draft.
		expect(mockModifyInvoice.mock.calls[2][0]).toBe('inv_draft_2');
		expect(mockModifyInvoice.mock.calls[2][1]).toEqual({
			type: 'line_item',
			line_item_params: { action: 'add', items: [{ display_name: 'Setup fee', amount: '50', quantity: '1' }] },
		});
		await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/billing/invoices/inv_draft_2'));
	});

	it('cancelling the void confirmation returns to editing without saving', async () => {
		mockGetInvoiceById.mockResolvedValue(
			makeInvoice({
				invoice_status: 'FINALIZED',
				line_items: [{ id: 'li_1', display_name: 'Consulting', quantity: '2', amount: 300 }],
			}),
		);
		const user = userEvent.setup();
		renderPage();

		const nameInput = await screen.findByDisplayValue('Consulting');
		await user.clear(nameInput);
		await user.type(nameInput, 'Consulting hours');
		await user.click(screen.getByRole('button', { name: 'Save Changes' }));
		const dialog = await screen.findByRole('dialog');
		await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

		expect(mockModifyInvoice).not.toHaveBeenCalled();
		expect(screen.getByDisplayValue('Consulting hours')).toBeInTheDocument();
	});

	it('blocks editing for voided invoices', async () => {
		mockGetInvoiceById.mockResolvedValue(makeInvoice({ invoice_status: 'VOIDED' }));
		renderPage();

		expect(await screen.findByText('This invoice cannot be edited. Only draft and finalized invoices can be updated.')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Update Invoice Status' })).not.toBeInTheDocument();
		// apply_discount is draft-only
		expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
	});
});
