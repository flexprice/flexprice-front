import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, EmptyState, InvoiceStatusBadge, invoiceRows } from './components';
import type { DataTableColumn } from './components';

type InvoiceRow = (typeof invoiceRows)[number];

const columns: DataTableColumn<InvoiceRow>[] = [
	{ key: 'id', header: 'Invoice', sortable: true },
	{ key: 'customer', header: 'Customer', sortable: true },
	{ key: 'status', header: 'Status', render: (row) => <InvoiceStatusBadge status={row.status} /> },
	{ key: 'amount', header: 'Amount' },
];

describe('storybook-system components', () => {
	it('renders a sortable invoice table with status badges and sorts correctly', async () => {
		const user = userEvent.setup();
		render(<DataTable columns={columns} rows={invoiceRows} />);

		expect(screen.getByText('Acme AI')).toBeInTheDocument();
		expect(screen.getByText('Paid')).toBeInTheDocument();

		// Capture customer cell text order before sorting
		const customersBefore = screen.getAllByRole('button', { name: /customer/i });
		const rowsBefore = screen.getAllByText(/Acme AI|Orbit Labs|Northstar Cloud|Sandbox Systems/);
		expect(rowsBefore[0]).toHaveTextContent('Acme AI');

		// Click customer header to sort ascending (A → Z)
		await user.click(customersBefore[0]);
		const rowsAfterAsc = screen.getAllByText(/Acme AI|Orbit Labs|Northstar Cloud|Sandbox Systems/);
		expect(rowsAfterAsc[0]).toHaveTextContent('Acme AI');
		expect(rowsAfterAsc[2]).toHaveTextContent('Orbit Labs');

		// Click again for descending (Z → A) — first row should now be Sandbox Systems
		await user.click(screen.getByRole('button', { name: /customer/i }));
		const rowsAfterDesc = screen.getAllByText(/Acme AI|Orbit Labs|Northstar Cloud|Sandbox Systems/);
		expect(rowsAfterDesc[0]).toHaveTextContent('Sandbox Systems');
	});

	it('renders an empty state CTA and handles clicks', async () => {
		const user = userEvent.setup();
		const onCtaClick = vi.fn();

		render(<EmptyState headline='No customers yet' subtext='Create a customer before adding a subscription.' ctaLabel='Add customer' onCtaClick={onCtaClick} />);

		expect(screen.getByText('No customers yet')).toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: /add customer/i }));
		expect(onCtaClick).toHaveBeenCalledTimes(1);
	});
});
