import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router';
import RedirectCell from './RedirectCell';

const renderCell = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('RedirectCell', () => {
	// The link carried aria-hidden='true' while staying keyboard-focusable, which is
	// the axe `aria-hidden-focus` failure: the tab stop survives but the element is
	// stripped from the accessibility tree, so a screen-reader user lands on an
	// unlabeled stop and the cell's text vanishes from the tree entirely.
	it('does not hide the focusable link from the accessibility tree', () => {
		renderCell(<RedirectCell redirectUrl='/customers/cus_1'>Acme Corp</RedirectCell>);

		const link = screen.getByRole('link');
		expect(link).not.toHaveAttribute('aria-hidden');
	});

	it("exposes the cell's text as the link's accessible name", () => {
		renderCell(<RedirectCell redirectUrl='/customers/cus_1'>Acme Corp</RedirectCell>);

		// getByRole matches on accessible name, so this only passes if the children
		// are actually reachable in the accessibility tree.
		expect(screen.getByRole('link', { name: 'Acme Corp' })).toHaveAttribute('href', '/customers/cus_1');
	});

	// The trailing ExternalLink is purely decorative - it duplicates what the link
	// already conveys, so it must not leak into the accessible name.
	it('hides the decorative external-link icon', () => {
		const { container } = renderCell(<RedirectCell redirectUrl='/plans/plan_1'>Starter</RedirectCell>);

		const icon = container.querySelector('svg');
		expect(icon).toHaveAttribute('aria-hidden', 'true');
		expect(screen.getByRole('link').textContent).toBe('Starter');
	});

	it('renders children without a link when redirection is disabled', () => {
		renderCell(
			<RedirectCell redirectUrl='/plans/plan_1' allowRedirect={false}>
				Starter
			</RedirectCell>,
		);

		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		expect(screen.getByText('Starter')).toBeInTheDocument();
	});
});
