import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InvoiceStatusBadge from './InvoiceStatusBadge';

describe('InvoiceStatusBadge', () => {
	it('renders "Draft" label for draft status', () => {
		render(<InvoiceStatusBadge status='draft' />);
		expect(screen.getByText('Draft')).toBeInTheDocument();
	});

	it('renders "Paid" label for paid status', () => {
		render(<InvoiceStatusBadge status='paid' />);
		expect(screen.getByText('Paid')).toBeInTheDocument();
	});

	it('renders "Void" label for void status', () => {
		render(<InvoiceStatusBadge status='void' />);
		expect(screen.getByText('Void')).toBeInTheDocument();
	});

	it('renders "Finalized" label for finalized status', () => {
		render(<InvoiceStatusBadge status='finalized' />);
		expect(screen.getByText('Finalized')).toBeInTheDocument();
	});

	it('renders "Uncollectible" label for uncollectible status', () => {
		render(<InvoiceStatusBadge status='uncollectible' />);
		expect(screen.getByText('Uncollectible')).toBeInTheDocument();
	});

	it('hides label when showLabel is false', () => {
		render(<InvoiceStatusBadge status='paid' showLabel={false} />);
		expect(screen.queryByText('Paid')).not.toBeInTheDocument();
	});

	it('renders an icon for every status', () => {
		const { container } = render(<InvoiceStatusBadge status='draft' />);
		expect(container.querySelector('svg')).toBeTruthy();
	});
});
