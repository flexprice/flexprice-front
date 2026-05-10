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
	it('renders a sortable invoice table with status badges', async () => {
		const user = userEvent.setup();
		render(<DataTable columns={columns} rows={invoiceRows} />);

		expect(screen.getByText('Acme AI')).toBeInTheDocument();
		expect(screen.getByText('Paid')).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: /customer/i }));
		expect(screen.getByText('Northstar Cloud')).toBeInTheDocument();
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
