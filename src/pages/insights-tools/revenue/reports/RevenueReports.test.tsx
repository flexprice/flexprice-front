import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import RevenueReports from './RevenueReports';
import { renderWithProviders } from './testUtils';
import ReportsApi from '@/api/ReportsApi';

describe('RevenueReports', () => {
	beforeEach(() => vi.stubEnv('VITE_REPORTS_MOCK', 'true'));
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it('renders the catalog and selects the first report', async () => {
		renderWithProviders(<RevenueReports />);
		expect(await screen.findByRole('heading', { name: 'Total billing' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Receivables aging' })).toBeInTheDocument();
	});

	it('switching report runs that report', async () => {
		const spy = vi.spyOn(ReportsApi, 'runReport');
		renderWithProviders(<RevenueReports />);
		fireEvent.click(await screen.findByRole('button', { name: 'Days to pay' }));
		await waitFor(() => expect(spy).toHaveBeenCalledWith('days_to_pay', expect.objectContaining({ shape: 'timeseries' })));
		expect(await screen.findByRole('heading', { name: 'Days to pay' })).toBeInTheDocument();
	});

	it('shows the server message when a report fails', async () => {
		vi.spyOn(ReportsApi, 'runReport').mockRejectedValue(new Error('financial reports are not enabled'));
		renderWithProviders(<RevenueReports />);
		expect(await screen.findByText('Could not load this report')).toBeInTheDocument();
		expect(screen.getAllByText('financial reports are not enabled').length).toBeGreaterThan(0);
	});

	it('snapshot report shows point-in-time caption, no compare control', async () => {
		renderWithProviders(<RevenueReports />);
		fireEvent.click(await screen.findByRole('button', { name: 'Total receivables' }));
		expect(await screen.findByRole('heading', { name: 'Total receivables' })).toBeInTheDocument();
		expect(screen.getAllByText('Point-in-time · no comparison').length).toBeGreaterThan(0);
	});
});
