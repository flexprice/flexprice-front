import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import RevenueReports from './RevenueReports';
import { renderWithProviders } from './testUtils';
import { render } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import enSettings from '@/i18n/locales/en/settings.json';
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

	it('shows the server message when the catalog fails', async () => {
		vi.spyOn(ReportsApi, 'listReports').mockRejectedValue(new Error('reports are not available'));
		renderWithProviders(<RevenueReports />);
		expect(await screen.findByText('Could not load this report')).toBeInTheDocument();
		expect(screen.getByText('reports are not available')).toBeInTheDocument();
	});

	it('does not retry a failed report with default query retry', async () => {
		const spy = vi.spyOn(ReportsApi, 'runReport').mockRejectedValue(new Error('forbidden'));
		const i18n = createInstance();
		i18n.init({ lng: 'en', ns: ['settings'], defaultNS: 'settings', resources: { en: { settings: enSettings } } });
		render(
			<QueryClientProvider client={new QueryClient()}>
				<I18nextProvider i18n={i18n}>
					<RevenueReports />
				</I18nextProvider>
			</QueryClientProvider>,
		);
		expect(await screen.findByText('Could not load this report')).toBeInTheDocument();
		const main = spy.mock.calls.filter(([, req]) => req.shape !== 'scalar');
		expect(main).toHaveLength(1);
	});
});
