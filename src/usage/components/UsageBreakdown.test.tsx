import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import UsageBreakdown from './UsageBreakdown';

const ROWS = [
	{ id: 'feat_1', name: 'API Calls', groupId: 'grp_1', groupName: 'Core', totalUsage: 1000, totalCost: 12, currency: 'USD' },
	{ id: 'feat_2', name: 'Storage', totalUsage: 50, totalCost: 0 },
];

describe('UsageBreakdown', () => {
	it('renders grouped and ungrouped rows with the title', () => {
		render(<UsageBreakdown rows={ROWS} />);
		expect(screen.getByText('Usage Breakdown')).toBeInTheDocument();
		expect(screen.getByText('Core')).toBeInTheDocument();
		expect(screen.getByText('Storage')).toBeInTheDocument();
	});

	// Keeping the card and its heading tells the customer where usage will appear,
	// rather than collapsing to nothing under the section's date filter.
	it('keeps the titled card when not loading and rows is empty', () => {
		render(<UsageBreakdown rows={[]} />);
		expect(screen.getByText('Usage Breakdown')).toBeInTheDocument();
		expect(screen.getByText('No usage in this period')).toBeInTheDocument();
	});

	it('renders a loading skeleton when isLoading', () => {
		const { container } = render(<UsageBreakdown rows={[]} isLoading />);
		expect(container.querySelector('.animate-pulse')).not.toBeNull();
	});

	it('shows the unit price from price.amount with the row currency', () => {
		render(
			<UsageBreakdown
				rows={[{ id: 'sms', name: 'sms_australia_intelli', totalUsage: 2894, unitPrice: '0.05556', totalCost: 160.79, currency: 'USD' }]}
			/>,
		);
		expect(screen.getByText('Unit Price')).toBeInTheDocument();
		expect(screen.getByText('$0.05556')).toBeInTheDocument();
	});

	it('renders a non-numeric totalUsageDisplay as-is instead of "NaN"', () => {
		render(<UsageBreakdown rows={[{ id: 'feat_1', name: 'API Calls', totalUsage: 0, totalCost: 0, totalUsageDisplay: 'N/A' }]} />);
		expect(screen.getByText('N/A')).toBeInTheDocument();
		expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
	});

	// Regression: group buckets used to always sort alphabetically, ignoring the selected
	// cost/usage sort — so "Sort: Cost" reordered rows within a group but never which group led.
	it('sorts groups themselves by the selected field, not just alphabetically', () => {
		const rows = [
			{ id: 'a', name: 'Low cost row', groupId: 'grp_alpha', groupName: 'Alpha', totalUsage: 1, totalCost: 1 },
			{ id: 'b', name: 'High cost row', groupId: 'grp_zeta', groupName: 'Zeta', totalUsage: 1, totalCost: 1000 },
		];
		render(<UsageBreakdown rows={rows} />);
		const headers = screen.getAllByText(/^(Alpha|Zeta)$/).map((el) => el.textContent);
		// Default sort is cost, descending — Zeta (cost 1000) must lead Alpha (cost 1) despite
		// "Alpha" sorting first alphabetically.
		expect(headers).toEqual(['Zeta', 'Alpha']);
	});

	it('exposes aria-expanded and a focus-visible ring on an expandable group header row', () => {
		render(<UsageBreakdown rows={ROWS} />);
		const groupRow = screen.getByText('Core').closest('[role="button"]');
		expect(groupRow).toHaveAttribute('aria-expanded');
		expect(groupRow?.className).toContain('focus-visible:ring-2');
		expect(groupRow?.className).not.toContain('focus:outline-none');
	});
});
