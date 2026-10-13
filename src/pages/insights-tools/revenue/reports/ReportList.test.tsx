import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, screen } from '@testing-library/react';
import { mockCatalog } from '@/api/fixtures/reports';
import ReportList from './ReportList';
import { renderWithProviders } from './testUtils';

describe('ReportList', () => {
	const entries = mockCatalog().items;

	it('groups by category and selects on click', () => {
		const onSelect = vi.fn();
		renderWithProviders(<ReportList entries={entries} selectedKey='invoice_total' onSelect={onSelect} />);
		expect(screen.getByText('Receivables')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Days to pay' }));
		expect(onSelect).toHaveBeenCalledWith('days_to_pay');
	});

	it('filters by search', () => {
		renderWithProviders(<ReportList entries={entries} selectedKey='' onSelect={() => {}} />);
		fireEvent.change(screen.getByPlaceholderText('Search reports'), { target: { value: 'aging' } });
		expect(screen.getByRole('button', { name: 'Receivables aging' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Total billing' })).not.toBeInTheDocument();
	});

	it('hides variant entries', () => {
		renderWithProviders(<ReportList entries={entries} selectedKey='' onSelect={() => {}} />);
		expect(screen.getByRole('button', { name: 'ARPU' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'ARPU (billed)' })).not.toBeInTheDocument();
	});

	it('custom report is disabled', () => {
		renderWithProviders(<ReportList entries={entries} selectedKey='' onSelect={() => {}} />);
		expect(screen.getByRole('button', { name: /New custom report/ })).toBeDisabled();
	});
});
